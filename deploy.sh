#!/bin/bash

# Build the project
echo "Building the project..."
npm run build

# Create directory if it doesn't exist
echo "Creating target directory..."
sudo mkdir -p /var/www/ion-trap/

# Copy build files to web directory
echo "Copying files to /var/www/ion-trap/..."
sudo cp -r dist/* /var/www/ion-trap/

# Set ownership to web server user
echo "Setting ownership..."
sudo chown -R www-data:www-data /var/www/ion-trap/

# Set proper permissions
echo "Setting permissions..."
sudo chmod -R 755 /var/www/ion-trap/

# Reload nginx
echo "Reloading nginx..."
sudo systemctl reload nginx

echo "Deployment complete!"