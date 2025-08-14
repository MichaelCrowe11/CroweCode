#!/usr/bin/env python3
"""
CroweCode Model Download Script
Downloads and configures Qwen models for the CroweCode platform.
"""

import os
import sys
import argparse
from crowecode.qwen_integration import qwen_manager


def download_model(variant: str, force: bool = False):
    """Download model for specific CroweCode variant."""
    print(f"🚀 CroweCode Model Download")
    print(f"📦 Variant: CroweCode-{variant}")
    
    if not qwen_manager.is_qwen_available():
        print("❌ Kaggle Hub not available. Install with: pip install kagglehub")
        return False
    
    if not force and variant in qwen_manager._download_cache:
        print(f"✅ CroweCode-{variant} already downloaded")
        return True
    
    path = qwen_manager.download_model(variant)
    if path:
        print(f"✅ CroweCode-{variant} ready for use")
        return True
    else:
        print(f"❌ Failed to download CroweCode-{variant}")
        return False


def download_all_models(force: bool = False):
    """Download all CroweCode models."""
    variants = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta"]
    
    print("🚀 CroweCode Platform - Downloading All Models")
    print("=" * 50)
    
    success_count = 0
    for variant in variants:
        print(f"\n📦 Processing CroweCode-{variant}...")
        if download_model(variant, force):
            success_count += 1
    
    print(f"\n🎉 Download Complete: {success_count}/{len(variants)} models ready")
    
    if success_count == len(variants):
        print("✅ All CroweCode models are ready for use!")
        print("\n🚀 Start the server with: python -m crowecode")
    else:
        print("⚠️  Some models failed to download. Check your internet connection and Kaggle access.")


def list_models():
    """List all available CroweCode models and their status."""
    print("🚀 CroweCode Platform - Model Status")
    print("=" * 40)
    
    status = qwen_manager.list_available_models()
    for model, state in status.items():
        status_icon = "✅" if state == "downloaded" else "📦"
        print(f"{status_icon} {model}: {state}")
    
    if not qwen_manager.is_qwen_available():
        print("\n⚠️  Kaggle Hub not available. Install with: pip install kagglehub")


def main():
    parser = argparse.ArgumentParser(
        description="Download and manage CroweCode models",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python download_models.py --all                 # Download all CroweCode models
  python download_models.py --variant Alpha       # Download CroweCode-Alpha only
  python download_models.py --list                # List model status
  python download_models.py --variant Beta --force # Force re-download CroweCode-Beta
        """
    )
    
    parser.add_argument("--all", action="store_true", help="Download all CroweCode models")
    parser.add_argument("--variant", help="Download specific CroweCode variant (Alpha, Beta, etc.)")
    parser.add_argument("--list", action="store_true", help="List all models and their status")
    parser.add_argument("--force", action="store_true", help="Force re-download even if model exists")
    
    args = parser.parse_args()
    
    if args.list:
        list_models()
    elif args.all:
        download_all_models(args.force)
    elif args.variant:
        variant = args.variant.capitalize()
        if variant not in ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta"]:
            print(f"❌ Invalid variant: {variant}")
            print("Valid variants: Alpha, Beta, Gamma, Delta, Epsilon, Zeta, Eta, Theta")
            sys.exit(1)
        download_model(variant, args.force)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
