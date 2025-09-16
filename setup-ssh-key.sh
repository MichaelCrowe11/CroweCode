#!/bin/bash

echo "Setting up SSH key for CroweCode VPS"
echo "===================================="
echo ""
echo "You'll be prompted for your VPS root password once."
echo ""

# Copy the SSH key
ssh-copy-id -i ~/.ssh/crowecode_vps.pub root@159.198.37.197

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SSH key successfully added!"
    echo ""
    echo "Testing connection with SSH key..."
    ssh -i ~/.ssh/crowecode_vps -o PasswordAuthentication=no root@159.198.37.197 "echo 'SSH key authentication successful!'"

    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Success! You can now deploy without passwords."
        echo ""
        echo "Create SSH config for easy access..."

        # Create SSH config
        cat >> ~/.ssh/config << EOF

Host crowecode-vps
    HostName 159.198.37.197
    User root
    IdentityFile ~/.ssh/crowecode_vps
    StrictHostKeyChecking no
EOF

        echo "You can now connect with: ssh crowecode-vps"
    else
        echo "Key was added but authentication failed. Check VPS settings."
    fi
else
    echo ""
    echo "Failed to copy SSH key. Please try manual method."
fi