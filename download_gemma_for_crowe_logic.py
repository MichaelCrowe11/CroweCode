#!/usr/bin/env python3
"""
Crowe Logic T5Gemma Download & Integration Script
=================================================

This script downloads Google's T5Gemma model and integrates it into the
Crowe Logic platform as "Crowe Logic Gemma Intelligence" - our premium
enterprise reasoning and language understanding model.

Usage:
    python download_gemma_for_crowe_logic.py

Requirements:
    pip install kagglehub

The script will:
1. Download T5Gemma from Kaggle Hub
2. Rebrand it as "Crowe Logic Gemma Intelligence"  
3. Configure it for enterprise use
4. Integrate it into the Crowe Logic API platform
"""

import kagglehub
import os
import sys
from pathlib import Path

def main():
    """Download and integrate T5Gemma into Crowe Logic platform."""
    
    print("🧠 Crowe Logic Platform - T5Gemma Integration")
    print("=" * 55)
    print("🎯 Rebranding: Google T5Gemma → Crowe Logic Gemma Intelligence")
    print("💡 Tagline: Logic. Applied.")
    print()
    
    try:
        # Step 1: Download T5Gemma using kagglehub
        print("📥 Downloading T5Gemma from Kaggle Hub...")
        print("   Model: google/t5gemma/transformers/t5gemma-2b-2b-prefixlm")
        
        path = kagglehub.model_download("google/t5gemma/transformers/t5gemma-2b-2b-prefixlm")
        
        print(f"✅ Download complete!")
        print(f"   Path to model files: {path}")
        print()
        
        # Step 2: Import and run Crowe Logic integration
        print("🔄 Integrating into Crowe Logic platform...")
        
        # Import our integration script
        from crowe_logic_gemma_integration import CroweLogicGemmaDownloader
        
        # Run the integration
        downloader = CroweLogicGemmaDownloader()
        result = downloader.download_and_setup_gemma()
        
        if result['status'] == 'success':
            print("✅ Crowe Logic Integration Complete!")
            print()
            print("🎯 Integration Results:")
            print(f"   • Platform: {result['platform']}")
            print(f"   • Tagline: {result['tagline']}")
            print(f"   • Model Name: {result['model_info']['display_name']}")
            print(f"   • Model ID: {result['model_info']['model_id']}")
            print(f"   • Subscription Tier: {result['model_info']['tier']}")
            print(f"   • Original Path: {result['original_path']}")
            print(f"   • Crowe Logic Path: {result['crowe_logic_path']}")
            print()
            
            print("💰 Enterprise Pricing:")
            print(f"   • Premium Multiplier: {result['model_info']['pricing_premium']}x")
            print(f"   • SLA Uptime: {result['model_info']['sla_uptime']}")
            print()
            
            print("🏢 Available to Subscription Tiers:")
            for tier in result['model_info']['subscription_tiers']:
                print(f"   • {tier.replace('_', ' ').title()}")
            print()
            
            print("🚀 Next Steps:")
            print("   1. Start API server: python -m uvicorn crowecode.api:app --reload")
            print("   2. Test Gemma endpoint: POST /crowe-logic/gemma")
            print("   3. View API docs: http://localhost:8000/docs")
            print("   4. Enterprise customers can now access Gemma Intelligence!")
            print()
            print("🧠 Crowe Logic Gemma Intelligence: Logic. Applied. 🚀")
            
        else:
            print(f"❌ Integration failed: {result.get('error', 'Unknown error')}")
            return 1
            
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("   Please install: pip install kagglehub")
        return 1
        
    except Exception as e:
        print(f"❌ Error during integration: {e}")
        print("   Check your internet connection and Kaggle API access")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
