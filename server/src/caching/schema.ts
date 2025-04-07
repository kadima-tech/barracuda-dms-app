import { Type, Static } from '@sinclair/typebox';

export const cacheContentSchema = Type.Object({
  videoUrl: Type.String(),
  scheduleTime: Type.String(),
  cacheDuration: Type.Number(),
  deviceId: Type.String(),
}, { title: 'CacheContent' });

export type CacheContentBody = Static<typeof cacheContentSchema>;