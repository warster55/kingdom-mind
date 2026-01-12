#!/bin/bash

# EMERGENCY SCRIPT TO KILL DOCKER ON REMOTE HOST
# Usage: ./scripts/kill_docker_remote.sh [ssh_user]
# Example: ./scripts/kill_docker_remote.sh ubuntu

IP="3.131.126.239"
USER=${1:-ubuntu} # Default to 'ubuntu', change if needed (e.g., 'ec2-user', 'root')

echo "==================================================="
echo "🔴 MISSION CRITICAL: STOPPING DOCKER ON $IP"
echo "==================================================="

# -o ConnectTimeout=5: Fail fast if server isn't up yet so you can retry
# -t: Force pseudo-terminal for sudo
ssh -o ConnectTimeout=5 -t "$USER@$IP" "sudo systemctl stop docker && sudo systemctl disable docker && echo '✅ SUCCESS: Docker stopped and disabled.'"

echo "==================================================="
echo "If the command failed, the server might not be up yet."
echo "Retry immediately."
