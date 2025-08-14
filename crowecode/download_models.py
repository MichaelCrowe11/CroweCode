#!/usr/bin/env python3
"""
CroweCode Model Download CLI

Downloads Qwen3-Coder models for the CroweCode platform.
Completely abstracts model names - only exposes CroweCode variants.
"""

import sys
import argparse
from pathlib import Path

# Add the parent directory to the path to import crowecode
sys.path.insert(0, str(Path(__file__).parent.parent))

from crowecode.qwen_integration import QwenModelManager


def main():
    parser = argparse.ArgumentParser(
        description="Download CroweCode models",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Download recommended models for development
  python download_models.py --dev
  
  # Download all models for production
  python download_models.py --all
  
  # Download specific CroweCode variants
  python download_models.py Alpha Beta Gamma
  
  # List available models
  python download_models.py --list

Available CroweCode Variants:
  Alpha   - 7B parameter model (fastest, good for development)
  Beta    - 30B parameter model (balanced performance)
  Gamma   - 480B parameter model (largest, best quality)
  Delta   - 7B parameter model
  Epsilon - 30B parameter model  
  Zeta    - 7B parameter model
  Eta     - 30B parameter model
  Theta   - 480B parameter model (largest)
        """
    )
    
    parser.add_argument(
        'variants', 
        nargs='*', 
        help='CroweCode variants to download (Alpha, Beta, Gamma, etc.)'
    )
    parser.add_argument(
        '--dev', 
        action='store_true',
        help='Download recommended models for development (Alpha, Beta)'
    )
    parser.add_argument(
        '--all', 
        action='store_true',
        help='Download all CroweCode models'
    )
    parser.add_argument(
        '--list', 
        action='store_true',
        help='List available CroweCode models'
    )
    parser.add_argument(
        '--status', 
        action='store_true',
        help='Show download status of all models'
    )
    
    args = parser.parse_args()
    
    manager = QwenModelManager()
    
    # Check if kagglehub is available
    if not manager.is_available():
        print("❌ Error: kagglehub is not installed.")
        print("📦 Install it with: pip install kagglehub")
        print("🔐 Then login with: kaggle auth")
        return 1
    
    # List models
    if args.list:
        print("🤖 Available CroweCode Models:")
        models = manager.list_models()
        for model in sorted(models):
            print(f"  • {model}")
        return 0
    
    # Show status
    if args.status:
        print("📊 CroweCode Model Status:")
        status = manager.list_available_models()
        for model, state in sorted(status.items()):
            icon = "✅" if state == "downloaded" else "📥"
            print(f"  {icon} {model}: {state}")
        return 0
    
    # Determine which models to download
    to_download = []
    
    if args.all:
        to_download = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta"]
    elif args.dev:
        to_download = ["Alpha", "Beta"]  # 7B and 30B models
    elif args.variants:
        to_download = [v.capitalize() for v in args.variants]
    else:
        parser.print_help()
        return 0
    
    # Download models
    print(f"🚀 Starting download of {len(to_download)} CroweCode models...")
    
    success_count = 0
    for variant in to_download:
        print(f"\n📥 Downloading CroweCode-{variant}...")
        path = manager.download_model(variant)
        if path:
            success_count += 1
            print(f"✅ CroweCode-{variant} ready")
        else:
            print(f"❌ Failed to download CroweCode-{variant}")
    
    print(f"\n🎉 Downloaded {success_count}/{len(to_download)} models successfully!")
    
    if success_count < len(to_download):
        print("⚠️  Some downloads failed. Check your internet connection and Kaggle authentication.")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
