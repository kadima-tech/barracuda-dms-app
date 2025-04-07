#!/bin/bash
set -euo pipefail  # Stricter error handling

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Error handling function
handle_error() {
    log "ERROR: $1"
    exit 1
}

# Function to check if a command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        handle_error "$1 is not installed"
    fi
}

# Check required commands
for cmd in xhost xset openbox unclutter node; do
    check_command "$cmd"
done

log "Starting BarracudaDMS..."

# Allow Docker access to X server
log "Setting up X server access..."
sleep 5
export DISPLAY=:0
xhost +SI:localuser:root || handle_error "Failed to allow root access to X server"
xhost +local: || handle_error "Failed to allow local access to X server"
log "DISPLAY is set to $DISPLAY"

# Comprehensive power management settings
log "Configuring power management settings..."
# Disable DPMS (Energy Star) features
xset -dpms || handle_error "Failed to disable DPMS"
# Disable screen saver
xset s off || handle_error "Failed to disable screen saver"
# Don't blank the video device
xset s noblank || handle_error "Failed to set noblank"
# Set monitor power state to on
xset -q | grep "Monitor is" || handle_error "Failed to get monitor state"
xset monitor on || handle_error "Failed to set monitor on"
# Disable screen blanking
xset s 0 0 || handle_error "Failed to set screen timeout to 0"

# Additional settings to prevent sleep
log "Setting additional display settings..."
# Disable system sleep
systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target || true
# Prevent system from going to sleep
systemctl set-property runtime-sleep.target TimeoutUSec=0 || true

# Start matchbox window manager (for fullscreen)
log "Starting window manager..."
openbox &

# Hide mouse cursor
log "Configuring cursor settings..."
unclutter -grab &

# Start WebSocket client
log "Starting WebSocket client..."
nohup node /app/ws-client.js &
log "Started WebSocket client."

# Get the initial URL
if [ -f "/app/current_url.txt" ]; then
    URL=$(cat /app/current_url.txt)
else
    URL="http://192.168.2.128:5173/spotify"
fi
log "Loading URL: $URL"

# Start Chromium in kiosk mode
log "Starting Chromium in kiosk mode..."
chromium-browser --display=:0 --kiosk --incognito --window-position=0,0 --disable-scrollbars "$URL" &

# Monitor for URL changes
while true; do
    if [ -f "/app/reload_flag" ]; then
        log "Reload flag detected"
        rm /app/reload_flag
        
        URL=$(cat /app/current_url.txt)
        log "Loading new URL: $URL"

        # Kill existing Chromium browser instances
        killall chromium-browser
        log "Killed existing Chromium instances"

        # Start Chromium with the new URL
        chromium-browser --display=:0 --kiosk --incognito --window-position=0,0 --disable-scrollbars "$URL" &
        log "Started new Chromium instance"
        
        # Give Chromium some time to load
        sleep 10
    fi
    
    # Check for reload flag every second
    sleep 1
done 