// CORS Proxy Server
const corsAnywhere = require('cors-anywhere');

// Create the CORS server
const host = 'localhost';
const port = 8010;

// Start the proxy server
corsAnywhere
  .createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ['origin', 'x-requested-with'],
    removeHeaders: ['cookie', 'cookie2'],
    redirectSameOrigin: true,
    httpProxyOptions: {
      xfwd: true, // Add X-Forwarded-For header
    },
  })
  .listen(port, host, () => {
    console.log(`CORS Anywhere proxy server started on ${host}:${port}`);
  });
