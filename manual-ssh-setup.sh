#!/bin/bash

echo "Manual SSH Key Setup for CroweCode VPS"
echo "======================================="
echo ""
echo "Since automatic password prompt isn't working,"
echo "we'll need to do this manually."
echo ""
echo "Your SSH Public Key is:"
echo "---------------------------------------"
cat ~/.ssh/crowecode_vps.pub
echo "---------------------------------------"
echo ""
echo "Please follow these steps:"
echo ""
echo "1. Open a new terminal window"
echo ""
echo "2. Connect to your VPS manually:"
echo "   ssh root@159.198.37.197"
echo "   (Enter your password when prompted)"
echo ""
echo "3. Once connected, run these commands on the VPS:"
echo ""
echo "mkdir -p ~/.ssh"
echo "cat >> ~/.ssh/authorized_keys << 'EOF'"
cat ~/.ssh/crowecode_vps.pub
echo "EOF"
echo "chmod 700 ~/.ssh"
echo "chmod 600 ~/.ssh/authorized_keys"
echo ""
echo "4. Exit the VPS (type 'exit')"
echo ""
echo "5. Test the connection without password:"
echo "   ssh -i ~/.ssh/crowecode_vps root@159.198.37.197"
echo ""
echo "Press Enter when you've completed these steps..."
read

# Test the connection
echo "Testing SSH key authentication..."
ssh -i ~/.ssh/crowecode_vps -o PasswordAuthentication=no root@159.198.37.197 "echo 'SUCCESS: SSH key authentication is working!'" 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Excellent! SSH key authentication is working!"
    echo ""

    # Create SSH config for easier access
    grep -q "Host crowecode-vps" ~/.ssh/config 2>/dev/null || cat >> ~/.ssh/config << EOF

Host crowecode-vps
    HostName 159.198.37.197
    User root
    IdentityFile ~/.ssh/crowecode_vps
    StrictHostKeyChecking no
EOF

    echo "You can now:"
    echo "  - Connect easily with: ssh crowecode-vps"
    echo "  - Deploy your app with: ./deploy-almalinux.sh"
else
    echo ""
    echo "❌ SSH key authentication not working yet."
    echo "Please make sure you followed all the steps correctly."
fi