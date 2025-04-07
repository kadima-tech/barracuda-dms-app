import { api } from "./instance";
import { API_BASE_URL } from "./config";

export interface DeviceMetrics {
  temperature?: number;
  uptime?: number;
  cpuLoad?: number;
  memoryUsage?: number;
  diskUsage?: number;
  currentUrl?: string;
  activeDownloads?: any[];
  activeSchedules?: any[];
}

export interface Device {
  deviceId: string;
  status: "connected" | "disconnected";
  lastHeartbeat: number;
  metrics: DeviceMetrics;
}

export const deviceApi = {
  // Get all connected devices
  getDevices: () => {
    return api.get("/devices");
  },

  // Send reboot command to a specific device
  sendReboot: (deviceId: string) => {
    return api.post(
      `/devices/${deviceId}/reboot`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  },

  // Rename a device
  renameDevice: (deviceId: string, newName: string) => {
    return api.put(
      `/devices/${deviceId}/rename`,
      { name: newName },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  },

  // Register a device (typically used by devices, not frontend)
  registerDevice: (deviceId: string) => {
    return api.post(
      "/devices/register",
      { deviceId },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  },

  // Send heartbeat (typically used by devices, not frontend)
  sendHeartbeat: (deviceId: string, metrics: DeviceMetrics) => {
    return api.post(
      "/devices/heartbeat",
      {
        deviceId,
        ...metrics,
      },
      {
        headers: {
          "Content-Type": "application/json",
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
    formData.append("file", videoFile);

    const response = await api.post<{ message: string; data: { url: string } }>(
      `/devices/${deviceId}/video/upload`,
      formData,
      {
        headers: {
          Accept: "application/json",
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
          "Content-Type": "application/json",
        },
      }
    );
  },

  async assignClient(deviceId: string, clientId: string | null) {
    const response = await fetch(`/api/devices/${deviceId}/client`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clientId }),
    });

    if (!response.ok) {
      throw new Error("Failed to assign client to device");
    }

    return response.json();
  },

  // Function to upload images
  uploadImages: async (deviceId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    const response = await fetch(
      `${API_BASE_URL}/devices/${deviceId}/images/upload`,
      {
        method: "POST",
        body: formData,
        // No need for default headers as FormData sets its own
      }
    );

    if (!response.ok) {
      throw new Error("Failed to upload images");
    }

    return response.json();
  },
};
