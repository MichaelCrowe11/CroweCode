#!/usr/bin/env python3
"""
Background Model Downloader for CroweCode

Downloads models in the background while you work on other features.
Shows progress and handles interruptions gracefully.
"""

import sys
import time
import signal
import threading
from pathlib import Path

# Add the parent directory to the path to import crowecode
sys.path.insert(0, str(Path(__file__).parent.parent))

from crowecode.qwen_integration import QwenModelManager


class BackgroundDownloader:
    def __init__(self):
        self.manager = QwenModelManager()
        self.downloading = False
        self.current_model = None
        self.downloaded = []
        self.failed = []
        
    def signal_handler(self, signum, frame):
        """Handle Ctrl+C gracefully."""
        print(f"\n\n🛑 Download interrupted for {self.current_model}")
        print("💡 You can resume later with: python crowecode/download_models.py Alpha")
        print("🚀 CroweCode works perfectly with mock backend in the meantime!")
        sys.exit(0)
        
    def download_with_progress(self, model_name):
        """Download a single model with progress tracking."""
        self.current_model = model_name
        print(f"\n📥 Starting download: CroweCode-{model_name}")
        print("💡 Press Ctrl+C to stop and continue working")
        
        try:
            path = self.manager.download_model(model_name)
            if path:
                self.downloaded.append(model_name)
                print(f"✅ CroweCode-{model_name} ready!")
                return True
            else:
                self.failed.append(model_name)
                print(f"❌ CroweCode-{model_name} failed")
                return False
        except KeyboardInterrupt:
            raise
        except Exception as e:
            print(f"❌ Error downloading CroweCode-{model_name}: {e}")
            self.failed.append(model_name)
            return False
    
    def download_models(self, models):
        """Download multiple models in sequence."""
        signal.signal(signal.SIGINT, self.signal_handler)
        
        print("🚀 CroweCode Background Downloader")
        print("=" * 50)
        print(f"📋 Queue: {', '.join(models)}")
        print("💡 CroweCode works with mock backend while downloading!")
        print("🛑 Press Ctrl+C anytime to stop and continue working")
        
        for model in models:
            success = self.download_with_progress(model)
            if not success:
                print(f"⚠️  Skipping to next model...")
                
        print("\n🎉 Download Session Complete!")
        print(f"✅ Downloaded: {len(self.downloaded)} models")
        print(f"❌ Failed: {len(self.failed)} models")
        
        if self.downloaded:
            print(f"🎯 Ready models: {', '.join(self.downloaded)}")
            
        if self.failed:
            print(f"🔄 Retry failed: python crowecode/download_models.py {' '.join(self.failed)}")


def main():
    downloader = BackgroundDownloader()
    
    # Check if kagglehub is available
    if not downloader.manager.is_available():
        print("❌ Error: kagglehub is not installed.")
        print("📦 Install it with: pip install kagglehub")
        print("🔐 Then login with: kaggle auth")
        return 1
    
    # Download recommended development models
    models_to_download = ["Alpha", "Beta"]
    
    print("🎯 Downloading CroweCode development models...")
    print("💡 Meanwhile, you can work on:")
    print("   • API improvements")
    print("   • Frontend development") 
    print("   • Documentation")
    print("   • Testing")
    print()
    
    downloader.download_models(models_to_download)
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
