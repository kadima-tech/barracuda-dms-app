// ... existing imports and initial variables ...

let ball = {
  x: 100,
  y: 100,
  isDragging: false,
  element: null,
};

// Add to your existing initialization code
function initializeBall() {
  // Create ball element
  const ballElement = document.createElement("div");
  ballElement.className = "device-ball";
  ballElement.style.cssText = `
    position: fixed;
    width: 20px;
    height: 20px;
    background: red;
    border-radius: 50%;
    cursor: grab;
    touch-action: none;
    transition: transform 0.1s ease-out;
    z-index: 1000;
  `;

  document.body.appendChild(ballElement);
  ball.element = ballElement;

  // Add event listeners
  ballElement.addEventListener("mousedown", startDragging);
  ballElement.addEventListener("touchstart", startDragging, { passive: false });
  document.addEventListener("mousemove", onDrag);
  document.addEventListener("touchmove", onDrag, { passive: false });
  document.addEventListener("mouseup", stopDragging);
  document.addEventListener("touchend", stopDragging);

  updateBallPosition(ball.x, ball.y);
}

function startDragging(e) {
  e.preventDefault();
  ball.isDragging = true;
  ball.element.style.cursor = "grabbing";
}

function onDrag(e) {
  if (!ball.isDragging) return;

  const pos = getEventPosition(e);
  updateBallPosition(pos.x, pos.y);
  checkZoneTransfer(pos);
}

function stopDragging() {
  ball.isDragging = false;
  ball.element.style.cursor = "grab";
}

function getEventPosition(e) {
  if (e.type.startsWith("mouse")) {
    return { x: e.clientX, y: e.clientY };
  } else {
    const touch = e.touches[0];
    return { x: touch.clientX, y: touch.clientY };
  }
}

function updateBallPosition(x, y) {
  ball.x = x;
  ball.y = y;
  ball.element.style.transform = `translate(${x - 10}px, ${y - 10}px)`;

  // Emit position update if socket is connected
  if (socket && socket.connected) {
    socket.emit("ballPosition", {
      x,
      y,
      deviceId: DEVICE_ID,
    });
  }
}

function receiveBall(ballData) {
  log(`Received ball transfer: ${JSON.stringify(ballData)}`);

  // Animate ball appearing from the transfer zone
  ball.element.style.scale = "0";
  updateBallPosition(ballData.x, ballData.y);

  requestAnimationFrame(() => {
    ball.element.style.transition = "transform 0.3s, scale 0.3s";
    ball.element.style.scale = "1";
  });
}

function checkZoneTransfer(pos) {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;

  // Check if ball is in transfer zone
  if (
    pos.x <= 10 ||
    pos.x >= screenWidth - 10 ||
    pos.y <= 10 ||
    pos.y >= screenHeight - 10
  ) {
    // Ball position will be handled by server response
    log(`Ball in transfer zone at position: ${JSON.stringify(pos)}`);
  }
}

// Modify your existing initializeSocketConnection function to add these event listeners
function initializeSocketConnection() {
  // ... existing socket initialization code ...

  socket.on("connect", () => {
    // ... existing connect code ...

    // Send screen dimensions
    socket.emit("deviceMetrics", {
      deviceId: DEVICE_ID,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    });
  });

  // Add these new socket event listeners
  socket.on("zonesUpdated", (zones) => {
    log(`Received zones update: ${JSON.stringify(zones)}`);
    updateZoneVisualizations(zones);
  });

  socket.on("ballTransfer", (ballData) => {
    log(`Received ball transfer: ${JSON.stringify(ballData)}`);
    if (ballData.targetDeviceId === DEVICE_ID) {
      receiveBall(ballData);
    }
  });

  socket.on("ballPosition", (data) => {
    log(
      `Ball position update from device ${data.deviceId}: ${JSON.stringify(
        data
      )}`
    );
    // Forward the ball position to all connected devices
    if (socket && socket.connected) {
      socket.emit("ballPosition", data);
    }
  });

  socket.on("ballZoneTransfer", (data) => {
    log(
      `Ball zone transfer from device ${data.deviceId}: ${JSON.stringify(data)}`
    );
    // Forward the transfer request to the server
    if (socket && socket.connected) {
      socket.emit("ballZoneTransfer", data);
    }
  });

  // ... rest of your existing socket event listeners ...
}

function updateZoneVisualizations(zones) {
  // Remove existing zone visualizations
  document.querySelectorAll(".transfer-zone").forEach((el) => el.remove());

  // Create new zone visualizations
  zones.forEach((zone) => {
    if (zone.deviceId === DEVICE_ID) {
      const zoneElement = document.createElement("div");
      zoneElement.className = "transfer-zone";
      zoneElement.style.cssText = `
        position: fixed;
        background: rgba(0, 255, 0, 0.2);
        pointer-events: none;
        z-index: 999;
        ${zone.position}: 0;
        width: ${zone.width}px;
        height: ${zone.height}px;
      `;
      document.body.appendChild(zoneElement);
    }
  });
}

// Add to your window resize handler if you have one, or create one
window.addEventListener("resize", () => {
  if (socket && socket.connected) {
    socket.emit("deviceMetrics", {
      deviceId: DEVICE_ID,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
    });
  }
});

// Modify your existing connectToServer function to initialize the ball
function connectToServer() {
  if (isConnecting) {
    log(
      "Already attempting to connect. Skipping redundant connection attempt."
    );
    return;
  }

  isConnecting = true;
  log("Attempting to connect to server...");

  checkServerStatus((err, statusCode) => {
    if (err) {
      log(`Server unreachable: ${err.message}`);
      log(`Retrying in ${RECONNECT_INTERVAL / 1000} seconds...`);
      isConnecting = false;
      setTimeout(connectToServer, RECONNECT_INTERVAL);
    } else {
      log(`Server health check status: ${statusCode}`);
      initializeSocketConnection();
      initializeBall(); // Initialize the ball after connection
    }
  });
}

// Add to your heartbeat data
function startHeartbeat() {
  // ... existing code ...

  const heartbeatData = {
    // ... existing metrics ...
    screenWidth: process.env.SCREEN_WIDTH || 1920, // Add default or actual screen dimensions
    screenHeight: process.env.SCREEN_HEIGHT || 1080,
  };

  // ... rest of the function ...
}
