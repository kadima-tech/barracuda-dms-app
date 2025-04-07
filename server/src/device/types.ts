import { Socket } from "socket.io";

export interface DeviceMetrics {
  deviceId?: string;
  temperature?: number;
  uptime?: number;
  cpuLoad?: number;
  memoryUsage?: number;
  diskUsage?: number;
  currentUrl?: string;
  activeDownloads?: any[];
  activeSchedules?: any[];
  screenWidth?: number;
  screenHeight?: number;
  zone?: DeviceZone;
}

export interface Device {
  deviceId: string;
  status: "connected" | "disconnected";
  lastHeartbeat: number;
  metrics: DeviceMetrics;
}

export interface DeviceSocket extends Socket {
  deviceId?: string;
  lastHeartbeat?: number;
  data: DeviceMetrics;
}

export interface ImageUploadResponse {
  path: string;
  filename: string;
  url: string;
}

export interface SlideshowConfig {
  images: string[];
  interval?: number; // in milliseconds
  shuffle?: boolean;
}

export interface DeviceZone {
  x: number;
  y: number;
  width: number;
  height: number;
  position: "left" | "right" | "top" | "bottom";
}

export interface BallPosition {
  x: number;
  y: number;
  timestamp: number;
  sourceDeviceId?: string;
  targetDeviceId?: string;
}
