import { api } from './instance';

export interface CacheRequest extends Record<string, unknown> {
  scheduleId: string;
  videoUrl: string;
  scheduleTime: string;
  cacheDuration: number;
  deviceId: string;
}

export const cacheApi = {
  getData: (key: string) => {
    return api.get(`/cache/${key}`);
  },

  cacheContent: (request: CacheRequest) => {
    return api.post(`/cache/${request.scheduleId}`, request, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  getCacheProgress: (scheduleId: string, deviceId: string) => {
    return api.get(`/cache/${scheduleId}/progress/${deviceId}`);
  },
};
