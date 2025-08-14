#!/usr/bin/env python3
"""
CroweCode AWS Auto-Setup Tool

Automatically creates AWS resources for CroweCode cloud storage:
- S3 buckets with proper configuration
- IAM roles and policies
- Security settings and encryption
- Cost optimization settings

Requires AWS CLI to be installed and configured with admin permissions.
"""

import sys
import json
import time
import subprocess
from pathlib import Path

# Add the parent directory to the path to import crowecode
sys.path.insert(0, str(Path(__file__).parent.parent))


def run_aws_command(cmd, check=True, capture_output=True):
    """Run AWS CLI command and return result."""
    try:
        result = subprocess.run(
            cmd,
            shell=True,
            check=check,
            capture_output=capture_output,
            text=True
        )
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ AWS command failed: {cmd}")
        print(f"Error: {e.stderr}")
        return None


def check_aws_cli():
    """Check if AWS CLI is installed and configured."""
    print("🔍 Checking AWS CLI...")
    
    # Check if AWS CLI is installed
    result = run_aws_command("aws --version", check=False)
    if not result or result.returncode != 0:
        print("❌ AWS CLI not found!")
        print("📦 Install AWS CLI:")
        print("   curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip'")
        print("   unzip awscliv2.zip")
        print("   sudo ./aws/install")
        return False
    
    print(f"✅ AWS CLI found: {result.stdout.strip()}")
    
    # Check if AWS is configured
    result = run_aws_command("aws sts get-caller-identity", check=False)
    if not result or result.returncode != 0:
        print("❌ AWS CLI not configured!")
        print("🔐 Configure AWS CLI:")
        print("   aws configure")
        print("   # Enter your Access Key ID, Secret Access Key, Region, and Output format")
        return False
    
    identity = json.loads(result.stdout)
    print(f"✅ AWS configured as: {identity['Arn']}")
    return True


def get_aws_region():
    """Get current AWS region."""
    result = run_aws_command("aws configure get region")
    if result and result.returncode == 0:
        return result.stdout.strip()
    return "us-east-1"  # Default


def create_s3_bucket(bucket_name, region):
    """Create S3 bucket with proper configuration."""
    print(f"🪣 Creating S3 bucket: {bucket_name}")
    
    # Check if bucket already exists
    result = run_aws_command(f"aws s3api head-bucket --bucket {bucket_name}", check=False)
    if result and result.returncode == 0:
        print(f"✅ Bucket {bucket_name} already exists")
        return True
    
    # Create bucket
    if region == "us-east-1":
        # us-east-1 doesn't need location constraint
        cmd = f"aws s3api create-bucket --bucket {bucket_name}"
    else:
        cmd = f"aws s3api create-bucket --bucket {bucket_name} --region {region} --create-bucket-configuration LocationConstraint={region}"
    
    result = run_aws_command(cmd, check=False)
    if not result or result.returncode != 0:
        print(f"❌ Failed to create bucket {bucket_name}")
        if "BucketAlreadyExists" in result.stderr:
            print("💡 Bucket name already taken globally. Try a different name.")
        return False
    
    print(f"✅ Created S3 bucket: {bucket_name}")
    
    # Configure bucket settings
    configure_bucket_security(bucket_name)
    configure_bucket_lifecycle(bucket_name)
    
    return True


def configure_bucket_security(bucket_name):
    """Configure bucket security settings."""
    print(f"🔒 Configuring security for {bucket_name}")
    
    # Block public access
    policy = {
        "BlockPublicAcls": True,
        "IgnorePublicAcls": True,
        "BlockPublicPolicy": True,
        "RestrictPublicBuckets": True
    }
    
    cmd = f"aws s3api put-public-access-block --bucket {bucket_name} --public-access-block-configuration '{json.dumps(policy)}'"
    result = run_aws_command(cmd, check=False)
    if result and result.returncode == 0:
        print("✅ Enabled public access blocking")
    
    # Enable versioning
    cmd = f"aws s3api put-bucket-versioning --bucket {bucket_name} --versioning-configuration Status=Enabled"
    result = run_aws_command(cmd, check=False)
    if result and result.returncode == 0:
        print("✅ Enabled versioning")
    
    # Enable server-side encryption
    encryption_config = {
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            },
            "BucketKeyEnabled": True
        }]
    }
    
    cmd = f"aws s3api put-bucket-encryption --bucket {bucket_name} --server-side-encryption-configuration '{json.dumps(encryption_config)}'"
    result = run_aws_command(cmd, check=False)
    if result and result.returncode == 0:
        print("✅ Enabled server-side encryption")


def configure_bucket_lifecycle(bucket_name):
    """Configure bucket lifecycle for cost optimization."""
    print(f"💰 Configuring lifecycle policies for {bucket_name}")
    
    lifecycle_config = {
        "Rules": [{
            "ID": "CroweCodeModelLifecycle",
            "Status": "Enabled",
            "Filter": {"Prefix": "crowecode-models/"},
            "Transitions": [
                {
                    "Days": 30,
                    "StorageClass": "STANDARD_IA"
                },
                {
                    "Days": 90,
                    "StorageClass": "GLACIER"
                }
            ]
        }]
    }
    
    cmd = f"aws s3api put-bucket-lifecycle-configuration --bucket {bucket_name} --lifecycle-configuration '{json.dumps(lifecycle_config)}'"
    result = run_aws_command(cmd, check=False)
    if result and result.returncode == 0:
        print("✅ Configured lifecycle policies (30d → IA, 90d → Glacier)")


def create_iam_role(role_name, bucket_name):
    """Create IAM role for CroweCode instances."""
    print(f"👤 Creating IAM role: {role_name}")
    
    # Trust policy for EC2 instances
    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }
    
    # Create role
    cmd = f"aws iam create-role --role-name {role_name} --assume-role-policy-document '{json.dumps(trust_policy)}'"
    result = run_aws_command(cmd, check=False)
    if result and result.returncode != 0:
        if "EntityAlreadyExists" in result.stderr:
            print(f"✅ Role {role_name} already exists")
        else:
            print(f"❌ Failed to create role {role_name}")
            return False
    else:
        print(f"✅ Created IAM role: {role_name}")
    
    # Create policy for S3 access
    s3_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                "Resource": f"arn:aws:s3:::{bucket_name}/crowecode-models/*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:ListBucket"
                ],
                "Resource": f"arn:aws:s3:::{bucket_name}",
                "Condition": {
                    "StringLike": {
                        "s3:prefix": "crowecode-models/*"
                    }
                }
            }
        ]
    }
    
    policy_name = f"{role_name}-S3Policy"
    cmd = f"aws iam put-role-policy --role-name {role_name} --policy-name {policy_name} --policy-document '{json.dumps(s3_policy)}'"
    result = run_aws_command(cmd, check=False)
    if result and result.returncode == 0:
        print(f"✅ Attached S3 policy to role")
    
    # Create instance profile
    cmd = f"aws iam create-instance-profile --instance-profile-name {role_name}"
    result = run_aws_command(cmd, check=False)
    if result and result.returncode != 0 and "EntityAlreadyExists" not in result.stderr:
        print(f"❌ Failed to create instance profile")
        return False
    
    # Add role to instance profile
    cmd = f"aws iam add-role-to-instance-profile --instance-profile-name {role_name} --role-name {role_name}"
    result = run_aws_command(cmd, check=False)
    if result and result.returncode == 0:
        print(f"✅ Created instance profile")
    
    return True


def create_user_credentials(user_name, bucket_name):
    """Create IAM user with programmatic access."""
    print(f"🔐 Creating IAM user: {user_name}")
    
    # Create user
    cmd = f"aws iam create-user --user-name {user_name}"
    result = run_aws_command(cmd, check=False)
    if result and result.returncode != 0:
        if "EntityAlreadyExists" in result.stderr:
            print(f"✅ User {user_name} already exists")
        else:
            print(f"❌ Failed to create user {user_name}")
            return None
    else:
        print(f"✅ Created IAM user: {user_name}")
    
    # Create policy for user
    s3_policy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                "Resource": [
                    f"arn:aws:s3:::{bucket_name}",
                    f"arn:aws:s3:::{bucket_name}/crowecode-models/*"
                ]
            }
        ]
    }
    
    policy_name = f"{user_name}-S3Policy"
    cmd = f"aws iam put-user-policy --user-name {user_name} --policy-name {policy_name} --policy-document '{json.dumps(s3_policy)}'"
    result = run_aws_command(cmd, check=False)
    if result and result.returncode == 0:
        print(f"✅ Attached S3 policy to user")
    
    # Create access key
    cmd = f"aws iam create-access-key --user-name {user_name}"
    result = run_aws_command(cmd, check=False)
    if not result or result.returncode != 0:
        print(f"❌ Failed to create access key for {user_name}")
        return None
    
    access_key_data = json.loads(result.stdout)
    credentials = access_key_data['AccessKey']
    
    print(f"✅ Created access key for {user_name}")
    return {
        'AccessKeyId': credentials['AccessKeyId'],
        'SecretAccessKey': credentials['SecretAccessKey']
    }


def setup_crowecode_config(bucket_name, region, credentials=None):
    """Generate CroweCode configuration."""
    print("🔧 Generating CroweCode configuration...")
    
    # Import here to avoid circular imports
    from crowecode.cloud_models import main as cloud_main
    
    # Generate cloud config
    config_cmd = [
        "python", "crowecode/cloud_models.py", "setup",
        "--provider", "s3",
        "--bucket", bucket_name,
        "--region", region
    ]
    
    result = subprocess.run(config_cmd, capture_output=True, text=True)
    
    if credentials:
        print("\n🔐 AWS Credentials (save these securely!):")
        print(f"export AWS_ACCESS_KEY_ID='{credentials['AccessKeyId']}'")
        print(f"export AWS_SECRET_ACCESS_KEY='{credentials['SecretAccessKey']}'")
        print(f"export AWS_DEFAULT_REGION='{region}'")
    
    print("\n🚀 Setup Complete! Next steps:")
    print("1. Set the environment variables above")
    print("2. Download models: python crowecode/download_models.py --dev")
    print("3. Upload to cloud: python crowecode/cloud_models.py upload Alpha Beta")
    print("4. Deploy your CroweCode instances!")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="CroweCode AWS Auto-Setup",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Full automatic setup
  python aws_setup.py --bucket my-crowecode-models --auto
  
  # Custom setup with specific options
  python aws_setup.py --bucket my-models --region us-west-2 --create-user
  
  # Just create bucket (use existing credentials)
  python aws_setup.py --bucket my-models --bucket-only

Prerequisites:
  1. Install AWS CLI: curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
  2. Configure AWS CLI: aws configure (with admin permissions)
        """
    )
    
    parser.add_argument("--bucket", required=True, help="S3 bucket name for CroweCode models")
    parser.add_argument("--region", help="AWS region (default: from AWS config)")
    parser.add_argument("--create-user", action="store_true", help="Create IAM user with programmatic access")
    parser.add_argument("--create-role", action="store_true", help="Create IAM role for EC2 instances")
    parser.add_argument("--bucket-only", action="store_true", help="Only create bucket, skip IAM")
    parser.add_argument("--auto", action="store_true", help="Full automatic setup (bucket + user + role)")
    
    args = parser.parse_args()
    
    print("🚀 CroweCode AWS Auto-Setup")
    print("=" * 50)
    
    # Check prerequisites
    if not check_aws_cli():
        return 1
    
    # Get region
    region = args.region or get_aws_region()
    print(f"🌍 Using region: {region}")
    
    # Create bucket
    if not create_s3_bucket(args.bucket, region):
        return 1
    
    credentials = None
    
    if not args.bucket_only:
        # Create IAM resources
        if args.auto or args.create_user:
            user_name = f"crowecode-user-{args.bucket}"
            credentials = create_user_credentials(user_name, args.bucket)
        
        if args.auto or args.create_role:
            role_name = f"crowecode-role-{args.bucket}"
            create_iam_role(role_name, args.bucket)
    
    # Generate CroweCode configuration
    setup_crowecode_config(args.bucket, region, credentials)
    
    print("\n✅ AWS setup complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
