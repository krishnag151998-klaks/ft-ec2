#!/bin/bash
cd /home/ubuntu/ft-ec2
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

export PM2_HOME="/home/ubuntu/.pm2"

# Check if pm2 process exists and stop it, but don't fail if it doesn't
pm2 stop familytree-app || true
