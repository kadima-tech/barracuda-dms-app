import { Server } from 'socket.io';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as ioc } from 'socket.io-client';
import { initializeSocketIO } from '../socket';

describe('Device Registration Tests', () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: any;
  let httpServer: any;

  beforeAll((done) => {
    httpServer = createServer();
    io = new Server(httpServer);
    initializeSocketIO(io);
    httpServer.listen(() => {
      const port = (httpServer.address() as AddressInfo).port;
      clientSocket = ioc(`http://localhost:${port}`, {
        transports: ['websocket'],
        autoConnect: false,
      });
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.connect();
      done();
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  test('should register a device successfully', (done) => {
    const deviceId = 'test-device-1';

    clientSocket.on('connect', () => {
      clientSocket.emit('register', { deviceId }, (response: any) => {
        expect(response).toBeDefined();
        expect(response.status).toBe('success');
        expect(response.message).toContain(deviceId);
        done();
      });
    });
  });

  test('should handle heartbeat messages', (done) => {
    const deviceId = 'test-device-1';

    clientSocket.emit('heartbeat', { deviceId }, (response: any) => {
      expect(response).toBeDefined();
      expect(response.status).toBe('success');
      expect(response.message).toBe('Heartbeat received');
      done();
    });
  });

  test('should handle device disconnection', (done) => {
    const deviceId = 'test-device-1';

    // First register the device
    clientSocket.emit('register', { deviceId }, () => {
      // Then disconnect
      clientSocket.disconnect();

      // Give some time for the server to process the disconnection
      setTimeout(() => {
        // Reconnect to verify the device was unregistered
        clientSocket.connect();
        clientSocket.emit('register', { deviceId }, (response: any) => {
          expect(response).toBeDefined();
          expect(response.status).toBe('success');
          expect(response.message).toContain(deviceId);
          done();
        });
      }, 100);
    });
  });
});
