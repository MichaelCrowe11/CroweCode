"""
CroweCode Cloud Storage Integration

Supports downloading models to and operating from cloud storage:
- AWS S3
- Google Cloud Storage  
- Azure Blob Storage
- Custom cloud providers

Models are downloaded once to cloud storage, then accessed by all instances.
"""

import os
import json
import base64
from typing import Dict, Optional, Union
from pathlib import Path
from abc import ABC, abstractmethod


class CloudStorageProvider(ABC):
    """Abstract base class for cloud storage providers."""
    
    @abstractmethod
    def upload_model(self, local_path: str, remote_path: str) -> bool:
        """Upload model from local path to cloud storage."""
        pass
    
    @abstractmethod
    def download_model(self, remote_path: str, local_path: str) -> bool:
        """Download model from cloud storage to local path."""
        pass
    
    @abstractmethod
    def model_exists(self, remote_path: str) -> bool:
        """Check if model exists in cloud storage."""
        pass
    
    @abstractmethod
    def list_models(self) -> list[str]:
        """List all available models in cloud storage."""
        pass
    
    @abstractmethod
    def get_model_url(self, remote_path: str) -> str:
        """Get direct access URL for model (if supported)."""
        pass


class S3StorageProvider(CloudStorageProvider):
    """AWS S3 storage provider for CroweCode models."""
    
    def __init__(self, bucket: str, region: str = "us-east-1", prefix: str = "crowecode-models/"):
        self.bucket = bucket
        self.region = region
        self.prefix = prefix
        self._s3_client = None
    
    def _get_s3_client(self):
        """Lazy load S3 client."""
        if self._s3_client is None:
            try:
                import boto3
                self._s3_client = boto3.client('s3', region_name=self.region)
            except ImportError:
                raise ImportError("boto3 required for S3 storage: pip install boto3")
        return self._s3_client
    
    def upload_model(self, local_path: str, remote_path: str) -> bool:
        """Upload model directory to S3."""
        try:
            s3 = self._get_s3_client()
            local_path = Path(local_path)
            
            if local_path.is_file():
                # Single file upload
                key = f"{self.prefix}{remote_path}"
                s3.upload_file(str(local_path), self.bucket, key)
                return True
            
            # Directory upload
            for file_path in local_path.rglob("*"):
                if file_path.is_file():
                    relative_path = file_path.relative_to(local_path)
                    key = f"{self.prefix}{remote_path}/{relative_path}"
                    s3.upload_file(str(file_path), self.bucket, key)
            
            return True
            
        except Exception as e:
            print(f"❌ S3 upload failed: {e}")
            return False
    
    def download_model(self, remote_path: str, local_path: str) -> bool:
        """Download model from S3 to local directory."""
        try:
            s3 = self._get_s3_client()
            local_path = Path(local_path)
            local_path.mkdir(parents=True, exist_ok=True)
            
            # List all objects with the prefix
            prefix = f"{self.prefix}{remote_path}/"
            response = s3.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
            
            if 'Contents' not in response:
                return False
            
            for obj in response['Contents']:
                key = obj['Key']
                # Remove prefix to get relative path
                relative_path = key[len(prefix):]
                if relative_path:  # Skip directory markers
                    file_path = local_path / relative_path
                    file_path.parent.mkdir(parents=True, exist_ok=True)
                    s3.download_file(self.bucket, key, str(file_path))
            
            return True
            
        except Exception as e:
            print(f"❌ S3 download failed: {e}")
            return False
    
    def model_exists(self, remote_path: str) -> bool:
        """Check if model exists in S3."""
        try:
            s3 = self._get_s3_client()
            prefix = f"{self.prefix}{remote_path}/"
            response = s3.list_objects_v2(Bucket=self.bucket, Prefix=prefix, MaxKeys=1)
            return 'Contents' in response and len(response['Contents']) > 0
        except Exception:
            return False
    
    def list_models(self) -> list[str]:
        """List all models in S3."""
        try:
            s3 = self._get_s3_client()
            response = s3.list_objects_v2(Bucket=self.bucket, Prefix=self.prefix, Delimiter='/')
            
            models = []
            if 'CommonPrefixes' in response:
                for prefix_info in response['CommonPrefixes']:
                    prefix = prefix_info['Prefix']
                    # Extract model name from prefix
                    model_name = prefix[len(self.prefix):].rstrip('/')
                    if model_name:
                        models.append(model_name)
            
            return models
            
        except Exception as e:
            print(f"❌ S3 list failed: {e}")
            return []
    
    def get_model_url(self, remote_path: str) -> str:
        """Get S3 URL for model access."""
        return f"s3://{self.bucket}/{self.prefix}{remote_path}/"


class GCSStorageProvider(CloudStorageProvider):
    """Google Cloud Storage provider for CroweCode models."""
    
    def __init__(self, bucket: str, prefix: str = "crowecode-models/"):
        self.bucket = bucket
        self.prefix = prefix
        self._gcs_client = None
    
    def _get_gcs_client(self):
        """Lazy load GCS client."""
        if self._gcs_client is None:
            try:
                from google.cloud import storage
                self._gcs_client = storage.Client()
            except ImportError:
                raise ImportError("google-cloud-storage required: pip install google-cloud-storage")
        return self._gcs_client
    
    def upload_model(self, local_path: str, remote_path: str) -> bool:
        """Upload model to Google Cloud Storage."""
        try:
            client = self._get_gcs_client()
            bucket = client.bucket(self.bucket)
            local_path = Path(local_path)
            
            for file_path in local_path.rglob("*"):
                if file_path.is_file():
                    relative_path = file_path.relative_to(local_path)
                    blob_name = f"{self.prefix}{remote_path}/{relative_path}"
                    blob = bucket.blob(blob_name)
                    blob.upload_from_filename(str(file_path))
            
            return True
            
        except Exception as e:
            print(f"❌ GCS upload failed: {e}")
            return False
    
    def download_model(self, remote_path: str, local_path: str) -> bool:
        """Download model from GCS."""
        try:
            client = self._get_gcs_client()
            bucket = client.bucket(self.bucket)
            local_path = Path(local_path)
            local_path.mkdir(parents=True, exist_ok=True)
            
            prefix = f"{self.prefix}{remote_path}/"
            blobs = bucket.list_blobs(prefix=prefix)
            
            for blob in blobs:
                relative_path = blob.name[len(prefix):]
                if relative_path:  # Skip directory markers
                    file_path = local_path / relative_path
                    file_path.parent.mkdir(parents=True, exist_ok=True)
                    blob.download_to_filename(str(file_path))
            
            return True
            
        except Exception as e:
            print(f"❌ GCS download failed: {e}")
            return False
    
    def model_exists(self, remote_path: str) -> bool:
        """Check if model exists in GCS."""
        try:
            client = self._get_gcs_client()
            bucket = client.bucket(self.bucket)
            prefix = f"{self.prefix}{remote_path}/"
            blobs = list(bucket.list_blobs(prefix=prefix, max_results=1))
            return len(blobs) > 0
        except Exception:
            return False
    
    def list_models(self) -> list[str]:
        """List all models in GCS."""
        try:
            client = self._get_gcs_client()
            bucket = client.bucket(self.bucket)
            
            # Get unique model directories
            models = set()
            for blob in bucket.list_blobs(prefix=self.prefix):
                # Extract model name from blob path
                relative_path = blob.name[len(self.prefix):]
                if '/' in relative_path:
                    model_name = relative_path.split('/')[0]
                    if model_name:
                        models.add(model_name)
            
            return list(models)
            
        except Exception as e:
            print(f"❌ GCS list failed: {e}")
            return []
    
    def get_model_url(self, remote_path: str) -> str:
        """Get GCS URL for model access."""
        return f"gs://{self.bucket}/{self.prefix}{remote_path}/"


class AzureStorageProvider(CloudStorageProvider):
    """Azure Blob Storage provider for CroweCode models."""
    
    def __init__(self, account_name: str, container: str, prefix: str = "crowecode-models/"):
        self.account_name = account_name
        self.container = container
        self.prefix = prefix
        self._blob_client = None
    
    def _get_blob_client(self):
        """Lazy load Azure Blob client."""
        if self._blob_client is None:
            try:
                from azure.storage.blob import BlobServiceClient
                # Uses DefaultAzureCredential or connection string from env
                connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
                if connection_string:
                    self._blob_client = BlobServiceClient.from_connection_string(connection_string)
                else:
                    account_url = f"https://{self.account_name}.blob.core.windows.net"
                    self._blob_client = BlobServiceClient(account_url=account_url)
            except ImportError:
                raise ImportError("azure-storage-blob required for Azure storage: pip install azure-storage-blob azure-identity")
        return self._blob_client
    
    def upload_model(self, local_path: str, remote_path: str) -> bool:
        """Upload model to Azure Blob Storage."""
        try:
            client = self._get_blob_client()
            local_path = Path(local_path)
            
            for file_path in local_path.rglob("*"):
                if file_path.is_file():
                    relative_path = file_path.relative_to(local_path)
                    blob_name = f"{self.prefix}{remote_path}/{relative_path}"
                    
                    with open(file_path, 'rb') as data:
                        client.upload_blob(
                            name=blob_name,
                            data=data,
                            container=self.container,
                            overwrite=True
                        )
            
            return True
            
        except Exception as e:
            print(f"❌ Azure upload failed: {e}")
            return False
    
    def download_model(self, remote_path: str, local_path: str) -> bool:
        """Download model from Azure Blob Storage."""
        try:
            client = self._get_blob_client()
            container_client = client.get_container_client(self.container)
            local_path = Path(local_path)
            local_path.mkdir(parents=True, exist_ok=True)
            
            prefix = f"{self.prefix}{remote_path}/"
            blobs = container_client.list_blobs(name_starts_with=prefix)
            
            for blob in blobs:
                relative_path = blob.name[len(prefix):]
                if relative_path:  # Skip directory markers
                    file_path = local_path / relative_path
                    file_path.parent.mkdir(parents=True, exist_ok=True)
                    
                    with open(file_path, 'wb') as download_file:
                        download_stream = container_client.download_blob(blob.name)
                        download_file.write(download_stream.readall())
            
            return True
            
        except Exception as e:
            print(f"❌ Azure download failed: {e}")
            return False
    
    def model_exists(self, remote_path: str) -> bool:
        """Check if model exists in Azure."""
        try:
            client = self._get_blob_client()
            container_client = client.get_container_client(self.container)
            prefix = f"{self.prefix}{remote_path}/"
            blobs = list(container_client.list_blobs(name_starts_with=prefix, max_results=1))
            return len(blobs) > 0
        except Exception:
            return False
    
    def list_models(self) -> list[str]:
        """List all models in Azure."""
        try:
            client = self._get_blob_client()
            container_client = client.get_container_client(self.container)
            
            models = set()
            for blob in container_client.list_blobs(name_starts_with=self.prefix):
                relative_path = blob.name[len(self.prefix):]
                if '/' in relative_path:
                    model_name = relative_path.split('/')[0]
                    if model_name:
                        models.add(model_name)
            
            return list(models)
            
        except Exception as e:
            print(f"❌ Azure list failed: {e}")
            return []
    
    def get_model_url(self, remote_path: str) -> str:
        """Get Azure URL for model access."""
        return f"https://{self.account_name}.blob.core.windows.net/{self.container}/{self.prefix}{remote_path}/"


class CloudModelManager:
    """Manages CroweCode models in cloud storage."""
    
    def __init__(self, storage_provider: CloudStorageProvider):
        self.storage = storage_provider
        self.local_cache = Path.home() / ".crowecode" / "models"
        self.local_cache.mkdir(parents=True, exist_ok=True)
    
    def upload_model_to_cloud(self, model_variant: str, local_model_path: str) -> bool:
        """Upload a downloaded model to cloud storage."""
        remote_path = f"crowecode-{model_variant.lower()}"
        print(f"📤 Uploading CroweCode-{model_variant} to cloud storage...")
        
        success = self.storage.upload_model(local_model_path, remote_path)
        if success:
            print(f"✅ CroweCode-{model_variant} uploaded to cloud")
        else:
            print(f"❌ Failed to upload CroweCode-{model_variant}")
        
        return success
    
    def download_model_from_cloud(self, model_variant: str) -> Optional[str]:
        """Download model from cloud storage to local cache."""
        remote_path = f"crowecode-{model_variant.lower()}"
        local_path = self.local_cache / remote_path
        
        # Check if already cached locally
        if local_path.exists():
            print(f"💾 CroweCode-{model_variant} already cached locally")
            return str(local_path)
        
        # Check if exists in cloud
        if not self.storage.model_exists(remote_path):
            print(f"❌ CroweCode-{model_variant} not found in cloud storage")
            return None
        
        print(f"☁️  Downloading CroweCode-{model_variant} from cloud...")
        success = self.storage.download_model(remote_path, str(local_path))
        
        if success:
            print(f"✅ CroweCode-{model_variant} downloaded from cloud")
            return str(local_path)
        else:
            print(f"❌ Failed to download CroweCode-{model_variant} from cloud")
            return None
    
    def list_cloud_models(self) -> list[str]:
        """List all CroweCode models available in cloud storage."""
        cloud_models = self.storage.list_models()
        return [model for model in cloud_models if model.startswith("crowecode-")]
    
    def model_available_in_cloud(self, model_variant: str) -> bool:
        """Check if model is available in cloud storage."""
        remote_path = f"crowecode-{model_variant.lower()}"
        return self.storage.model_exists(remote_path)
    
    def get_model_cloud_url(self, model_variant: str) -> Optional[str]:
        """Get cloud storage URL for direct model access."""
        remote_path = f"crowecode-{model_variant.lower()}"
        if self.storage.model_exists(remote_path):
            return self.storage.get_model_url(remote_path)
        return None


def create_cloud_storage_provider(provider_type: str, **kwargs) -> CloudStorageProvider:
    """Factory function to create cloud storage providers."""
    provider_type = provider_type.lower()
    
    if provider_type == "s3":
        return S3StorageProvider(**kwargs)
    elif provider_type == "gcs":
        return GCSStorageProvider(**kwargs)
    elif provider_type == "azure":
        return AzureStorageProvider(**kwargs)
    else:
        raise ValueError(f"Unsupported storage provider: {provider_type}")


def get_cloud_config() -> Optional[Dict]:
    """Get cloud storage configuration from environment."""
    config_b64 = os.getenv("CROWECODE_CLOUD_CONFIG_B64")
    if not config_b64:
        return None
    
    try:
        decoded = base64.b64decode(config_b64.encode("utf-8"))
        return json.loads(decoded.decode("utf-8"))
    except Exception:
        return None


# Global cloud manager instance
_cloud_manager = None

def get_cloud_manager() -> Optional[CloudModelManager]:
    """Get the global cloud model manager if configured."""
    global _cloud_manager
    
    if _cloud_manager is None:
        config = get_cloud_config()
        if config and config.get("enabled", False):
            try:
                provider = create_cloud_storage_provider(
                    config["provider"],
                    **config.get("config", {})
                )
                _cloud_manager = CloudModelManager(provider)
            except Exception as e:
                print(f"⚠️  Cloud storage not available: {e}")
                return None
    
    return _cloud_manager
