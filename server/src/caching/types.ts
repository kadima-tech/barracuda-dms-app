export interface CacheRequest {
  scheduleId: string;
  videoUrl: string;
  scheduleTime: string;  // ISO timestamp
  cacheDuration: number; // minutes
  deviceId: string;
}

export interface CacheStatus {
  isCached: boolean;
  progress?: number;
  error?: string;
}
