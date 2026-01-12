#!/bin/bash

# EMERGENCY REBOOT AND RESCUE SCRIPT
# 1. Reboots AWS Instance i-0d91b959c63682d04
# 2. Spams SSH to kill Docker immediately upon boot

INSTANCE_ID="i-0d91b959c63682d04"
IP="3.131.126.239"
USER="ubuntu"
KEY="/home/wmoore/.ssh/SSP-Key.pem"

echo "==================================================="
echo "🚨 INITIATING EMERGENCY REBOOT SEQUENCE"
echo "Target: $INSTANCE_ID ($IP)"
echo "==================================================="

# 1. Reboot
echo "Sending Reboot Signal..."
aws ec2 reboot-instances --instance-ids "$INSTANCE_ID"
echo "✅ Reboot signal sent."

# 2. Loop until success
echo "==================================================="
echo "⏳ WAITING FOR SERVER TO COME ONLINE..."
echo "Attempting to kill Docker service repeatedly..."
echo "==================================================="

attempt=1
while true; do
    echo "Attempt #$attempt..."
    # Connect, kill docker, and exit immediately on success
    # -o StrictHostKeyChecking=no: Don't hang on 'known_hosts' changes if IP re-assigned (unlikely but safe)
    # -i: Use the specific key
    ssh -o ConnectTimeout=2 -o StrictHostKeyChecking=no -i "$KEY" "$USER@$IP" "sudo systemctl stop docker && sudo systemctl disable docker && echo '✅ MISSION ACCOMPLISHED: DOCKER STOPPED'"
    
    # Check if the last command succeeded (exit code 0)
    if [ $? -eq 0 ]; then
        echo "==================================================="
        echo "🎉 SUCCESS! Server rescued."
        echo "==================================================="
        exit 0
    fi
    
    sleep 1
    ((attempt++))
done
