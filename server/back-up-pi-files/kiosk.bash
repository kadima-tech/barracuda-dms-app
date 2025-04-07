#!/bin/bash
xset -dpms     # disable DPMS (Energy Star) features.
xset s off     # disable screen saver
xset s noblank # don't blank the video device
matchbox-window-manager -use_titlebar no &
unclutter -grab &    # hide X mouse cursor unless mouse activated

DEVICE_ID=$(cat /proc/cpuinfo | grep Serial | cut -d ' ' -f 2)

export DEVICE_ID

# Start WebSocket client in the background
nohup node /home/pi/ws-client/ws-client.js &

# Start Chromium initially
URL=$(cat /home/pi/current_url.txt)

chromium-browser --display=:0 --kiosk --incognito --window-position=0,0 --disable-scrollbars "$URL" &

while true; do
    if [ -f "/home/pi/reload_flag" ]; then
        log_message "Reload flag detected"
        rm /home/pi/reload_flag
        
        URL=$(cat /home/pi/current_url.txt)
        log_message "Loading URL: $URL"

        # Kill existing Chromium browser instances
        killall chromium-browser
        log_message "Killed existing Chromium instances"

        # Start Chromium with the current URL
        chromium-browser --display=:0 --kiosk --incognito --window-position=0,0 "$URL" &
        log_message "Started new Chromium instance"
        
        # Give Chromium some time to load
        sleep 10
    fi
    
    # Check for reload flag every second
    sleep 1
done

