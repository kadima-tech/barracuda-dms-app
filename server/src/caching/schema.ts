import { Type, Static } from '@sinclair/typebox';

export const cacheContentSchema = {
  body: Type.Object(
    {
      videoUrl: Type.String({
        format: 'uri',
        description: 'URL of the video to cache',
      }),
      scheduleTime: Type.String({
        format: 'date-time',
        description: 'ISO 8601 timestamp for when to schedule the cache',
      }),
      cacheDuration: Type.Number({
        minimum: 1,
        description: 'Duration in minutes to keep the content cached',
      }),
      deviceId: Type.String({
        minLength: 1,
        description: 'ID of the device to cache content for',
      }),
    },
    {
      title: 'CacheContent',
      additionalProperties: false,
    }
  ),
  response: {
    200: Type.Object({
      data: Type.Object({
        message: Type.String(),
        deviceId: Type.String(),
        scheduleTime: Type.String(),
      }),
      links: Type.Object({
        self: Type.String(),
      }),
    }),
    400: Type.Object({
      error: Type.String(),
    }),
    404: Type.Object({
      error: Type.String(),
    }),
  },
};

export type CacheContentBody = Static<typeof cacheContentSchema.body>;
