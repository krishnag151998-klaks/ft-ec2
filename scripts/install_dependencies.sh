#!/bin/bash
cd /home/ubuntu/ft-ec2
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" 

# Install dependencies if node_modules is missing or package.json changed
npm ci

# Generate prisma client
npx prisma generate
