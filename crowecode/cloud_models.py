#!/usr/bin/env python3
"""
CroweCode Cloud Model Manager

Manages CroweCode models in cloud storage (S3, GCS, Azure) for production deployments.
Models are downloaded once to cloud storage, then accessed by all instances.
"""

import sys
import json
import base64
import argparse
from pathlib import Path

# Add the parent directory to the path to import crowecode
sys.path.insert(0, str(Path(__file__).parent.parent))

from crowecode.cloud_storage import (
    create_cloud_storage_provider,
    CloudModelManager,
    get_cloud_config
)
from crowecode.qwen_integration import QwenModelManager


def main():
    parser = argparse.ArgumentParser(
        description="CroweCode Cloud Model Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Upload models to cloud after local download
  python cloud_models.py upload Alpha Beta
  
  # Download models from cloud to local instances
  python cloud_models.py download Alpha Beta
  
  # List models available in cloud
  python cloud_models.py list
  
  # Setup cloud storage configuration
  python cloud_models.py setup --provider s3 --bucket my-models --region us-west-2
  
  # Check cloud storage status
  python cloud_models.py status

Cloud Providers:
  s3     - Amazon S3 (requires: pip install boto3)
  gcs    - Google Cloud Storage (requires: pip install google-cloud-storage)
  azure  - Azure Blob Storage (requires: pip install azure-storage-blob)

Environment Setup:
  # For S3
  export AWS_ACCESS_KEY_ID="your-key"
  export AWS_SECRET_ACCESS_KEY="your-secret"
  
  # For GCS
  export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
  
  # For Azure
  export AZURE_STORAGE_CONNECTION_STRING="your-connection-string"
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Upload command
    upload_parser = subparsers.add_parser('upload', help='Upload models to cloud storage')
    upload_parser.add_argument('models', nargs='+', help='CroweCode models to upload')
    
    # Download command  
    download_parser = subparsers.add_parser('download', help='Download models from cloud storage')
    download_parser.add_argument('models', nargs='+', help='CroweCode models to download')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List models in cloud storage')
    
    # Status command
    status_parser = subparsers.add_parser('status', help='Show cloud storage status')
    
    # Setup command
    setup_parser = subparsers.add_parser('setup', help='Configure cloud storage')
    setup_parser.add_argument('--provider', required=True, choices=['s3', 'gcs', 'azure'])
    setup_parser.add_argument('--bucket', required=True, help='Storage bucket/container name')
    setup_parser.add_argument('--region', help='Region (for S3)')
    setup_parser.add_argument('--account', help='Account name (for Azure)')
    setup_parser.add_argument('--prefix', default='crowecode-models/', help='Storage prefix')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return 0
    
    # Handle setup command
    if args.command == 'setup':
        return setup_cloud_storage(args)
    
    # For other commands, check if cloud storage is configured
    config = get_cloud_config()
    if not config or not config.get("enabled", False):
        print("❌ Cloud storage not configured.")
        print("🔧 Run: python cloud_models.py setup --help")
        return 1
    
    try:
        provider = create_cloud_storage_provider(
            config["provider"],
            **config.get("config", {})
        )
        cloud_manager = CloudModelManager(provider)
    except Exception as e:
        print(f"❌ Cloud storage connection failed: {e}")
        return 1
    
    if args.command == 'upload':
        return upload_models(cloud_manager, args.models)
    elif args.command == 'download':
        return download_models(cloud_manager, args.models)
    elif args.command == 'list':
        return list_models(cloud_manager)
    elif args.command == 'status':
        return show_status(cloud_manager)
    
    return 0


def setup_cloud_storage(args):
    """Configure cloud storage settings."""
    config = {
        "enabled": True,
        "provider": args.provider,
        "config": {
            "prefix": args.prefix
        }
    }
    
    if args.provider == "s3":
        config["config"]["bucket"] = args.bucket
        if args.region:
            config["config"]["region"] = args.region
        print("📋 S3 Configuration:")
        print(f"   Bucket: {args.bucket}")
        print(f"   Region: {args.region or 'us-east-1'}")
        print("🔐 Ensure AWS credentials are set:")
        print("   export AWS_ACCESS_KEY_ID=your-key")
        print("   export AWS_SECRET_ACCESS_KEY=your-secret")
        
    elif args.provider == "gcs":
        config["config"]["bucket"] = args.bucket
        print("📋 Google Cloud Storage Configuration:")
        print(f"   Bucket: {args.bucket}")
        print("🔐 Ensure GCS credentials are set:")
        print("   export GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json")
        
    elif args.provider == "azure":
        config["config"]["container"] = args.bucket
        if args.account:
            config["config"]["account_name"] = args.account
        print("📋 Azure Blob Storage Configuration:")
        print(f"   Container: {args.bucket}")
        print(f"   Account: {args.account or 'from-connection-string'}")
        print("🔐 Ensure Azure credentials are set:")
        print("   export AZURE_STORAGE_CONNECTION_STRING=your-connection-string")
    
    # Encode configuration
    config_json = json.dumps(config)
    config_b64 = base64.b64encode(config_json.encode()).decode()
    
    print(f"\n🔧 Add this to your environment:")
    print(f"export CROWECODE_CLOUD_CONFIG_B64='{config_b64}'")
    
    # Try to test the connection
    try:
        provider = create_cloud_storage_provider(args.provider, **config["config"])
        print("\n✅ Cloud storage provider created successfully!")
        
        # Test basic connectivity
        models = provider.list_models()
        print(f"📊 Found {len(models)} existing models in cloud storage")
        
    except Exception as e:
        print(f"\n⚠️  Cloud storage test failed: {e}")
        print("   Configuration saved, but connection couldn't be verified.")
    
    return 0


def upload_models(cloud_manager, model_names):
    """Upload models to cloud storage."""
    local_manager = QwenModelManager()
    
    print(f"📤 Uploading {len(model_names)} models to cloud storage...")
    
    success_count = 0
    for model_name in model_names:
        model_variant = model_name.capitalize()
        
        # Check if model exists locally
        local_path = local_manager.get_model_path(model_variant)
        if not local_path:
            print(f"❌ CroweCode-{model_variant} not found locally. Download it first.")
            continue
        
        # Upload to cloud
        success = cloud_manager.upload_model_to_cloud(model_variant, local_path)
        if success:
            success_count += 1
    
    print(f"✅ Uploaded {success_count}/{len(model_names)} models to cloud")
    return 0 if success_count == len(model_names) else 1


def download_models(cloud_manager, model_names):
    """Download models from cloud storage."""
    print(f"☁️  Downloading {len(model_names)} models from cloud storage...")
    
    success_count = 0
    for model_name in model_names:
        model_variant = model_name.capitalize()
        
        local_path = cloud_manager.download_model_from_cloud(model_variant)
        if local_path:
            success_count += 1
            print(f"✅ CroweCode-{model_variant} ready at: {local_path}")
        else:
            print(f"❌ Failed to download CroweCode-{model_variant}")
    
    print(f"✅ Downloaded {success_count}/{len(model_names)} models from cloud")
    return 0 if success_count == len(model_names) else 1


def list_models(cloud_manager):
    """List models available in cloud storage."""
    print("☁️  Checking cloud storage for CroweCode models...")
    
    models = cloud_manager.list_cloud_models()
    if not models:
        print("📋 No CroweCode models found in cloud storage")
        print("💡 Upload models with: python cloud_models.py upload Alpha Beta")
        return 0
    
    print(f"📋 Found {len(models)} CroweCode models in cloud storage:")
    for model in sorted(models):
        # Convert back to variant name
        variant = model.replace("crowecode-", "").capitalize()
        url = cloud_manager.get_model_cloud_url(variant)
        print(f"  ✅ CroweCode-{variant}")
        if url:
            print(f"     URL: {url}")
    
    return 0


def show_status(cloud_manager):
    """Show cloud storage status and configuration."""
    config = get_cloud_config()
    
    print("☁️  CroweCode Cloud Storage Status")
    print("=" * 50)
    print(f"Provider: {config['provider'].upper()}")
    print(f"Configuration: {config['config']}")
    
    # Test connectivity
    try:
        models = cloud_manager.list_cloud_models()
        print(f"✅ Connected successfully")
        print(f"📊 Models in cloud: {len(models)}")
        
        if models:
            print("\nAvailable models:")
            for model in sorted(models):
                variant = model.replace("crowecode-", "").capitalize()
                print(f"  • CroweCode-{variant}")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
