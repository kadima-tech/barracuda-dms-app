export interface Schedule {
  id: string;
  deviceId: string;
  videoUrl: string;
  startTime: string;    // ISO timestamp
  endTime: string;      // ISO timestamp
  repeat?: 'daily' | 'weekly' | 'monthly' | 'none';
  status: 'pending' | 'caching' | 'ready' | 'playing' | 'completed' | 'error';
  cacheDuration: number;
  created: string;      // ISO timestamp
  updated: string;      // ISO timestamp
}

export interface CreateScheduleRequest {
  deviceId: string;
  videoUrl: string;
  startTime: string;
  endTime: string;
  repeat?: 'daily' | 'weekly' | 'monthly' | 'none';
  cacheDuration: number;
}

export interface UpdateScheduleRequest {
  startTime?: string;
  endTime?: string;
  repeat?: 'daily' | 'weekly' | 'monthly' | 'none';
  status?: 'pending' | 'caching' | 'ready' | 'playing' | 'completed' | 'error';
}
