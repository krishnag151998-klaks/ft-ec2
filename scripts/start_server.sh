#!/bin/bash
cd /home/ubuntu/ft-ec2
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

export PM2_HOME="/home/ubuntu/.pm2"

# Start or Restart using PM2
pm2 describe familytree-app > /dev/null
if [ $? -eq 0 ]; then
  pm2 restart familytree-app
else
  pm2 start npm --name "familytree-app" -- start
fi

pm2 save
