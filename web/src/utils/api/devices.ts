import { api } from './instance';
import { API_BASE_URL } from './config';

interface Download {
  id: string;
  url: string;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed' | 'error';
}

interface Schedule {
  id: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'active' | 'completed';
}

export interface DeviceMetrics {
  temperature?: number;
  uptime?: number;
  cpuLoad?: number;
  memoryUsage?: number;
  diskUsage?: number;
  currentUrl?: string;
  activeDownloads?: Download[];
  activeSchedules?: Schedule[];
}

export interface Device {
  deviceId: string;
  status: 'connected' | 'disconnected';
  lastHeartbeat: number;
  metrics: DeviceMetrics;
}

export const deviceApi = {
  // Get all connected devices
  getDevices: () => {
    return api.get('/devices');
  },

  // Send reboot command to a specific device
  sendReboot: (deviceId: string) => {
    return api.post(
      `/devices/${deviceId}/reboot`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  // Rename a device
  renameDevice: (deviceId: string, newName: string) => {
    return api.put(`/devices/${deviceId}/rename`, { name: newName });
  },

  // Register a device (typically used by devices, not frontend)
  registerDevice: (deviceId: string) => {
    return api.post(
      '/devices/register',
      { deviceId },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  // Send heartbeat (typically used by devices, not frontend)
  sendHeartbeat: (deviceId: string, metrics: DeviceMetrics) => {
    return api.post(
      '/devices/heartbeat',
      {
        deviceId,
        ...metrics,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  // Unregister/disconnect a device
  unregisterDevice: (deviceId: string) => {
    return api.delete(`/devices/${deviceId}`);
  },

  // Upload video for devices
  uploadVideo: async (deviceId: string, videoFile: File) => {
    const formData = new FormData();
    formData.append('file', videoFile);

    const response = await api.post<{ message: string; data: { url: string } }>(
      `/devices/${deviceId}/video/upload`,
      formData,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    return response;
  },

  // Send URL to device
  sendUrl: (deviceId: string, url: string, active: boolean = true) => {
    return api.post(
      `/devices/${deviceId}/url`,
      { url, active },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  async assignClient(deviceId: string, clientId: string | null) {
    const response = await api.put(`/devices/${deviceId}/client`, { clientId });
    return response;
  },

  // Function to upload images
  uploadImages: async (deviceId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await api.post(
      `/devices/${deviceId}/images/upload`,
      formData
    );
    return response;
  },
};
