#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================"
echo " Starting EC2 Setup for Family Tree App "
echo "========================================"

# 1. Update system packages
echo "--> Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# 2. Install curl and CA certificates if not present
echo "--> Installing prerequisites..."
sudo apt-get install -y ca-certificates curl gnupg

# 3. Install Node.js (v20 LTS recommended)
echo "--> Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install PM2 globally for background process management
echo "--> Installing PM2..."
sudo npm install -g pm2

# 5. Install project dependencies
echo "--> Installing project dependencies..."
npm install

# 6. Generate Prisma Client
echo "--> Generating Prisma Client..."
npx prisma generate

# 7. Build the Next.js application
echo "--> Building the Next.js application..."
npm run build

# 8. Start the application with PM2
echo "--> Starting the application with PM2..."
# Check if PM2 process already exists to avoid errors on re-run
if pm2 status | grep -q "familytree"; then
    pm2 restart familytree
else
    pm2 start npm --name "familytree" -- run start
fi

# 9. Setup PM2 to persist across reboots
echo "--> Configuring PM2 to start on boot..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
pm2 save

echo "========================================"
echo " Setup Complete!                        "
echo " The Family Tree app is running.        "
echo " You can view logs with: pm2 logs       "
echo "========================================"
