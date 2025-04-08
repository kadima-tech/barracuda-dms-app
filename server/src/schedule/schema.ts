import { Type } from '@sinclair/typebox';
import { FastifySchema } from 'fastify';

const scheduleBase = {
  deviceId: Type.String(),
  videoUrl: Type.String(),
  startTime: Type.String(),
  endTime: Type.String(),
  repeat: Type.Optional(
    Type.Union([
      Type.Literal('daily'),
      Type.Literal('weekly'),
      Type.Literal('monthly'),
      Type.Literal('none'),
    ])
  ),
  cacheDuration: Type.Number(),
};

const scheduleResponse = Type.Object({
  id: Type.String(),
  ...scheduleBase,
  status: Type.Union([
    Type.Literal('pending'),
    Type.Literal('caching'),
    Type.Literal('ready'),
    Type.Literal('playing'),
    Type.Literal('completed'),
    Type.Literal('error'),
  ]),
  created: Type.String(),
  updated: Type.String(),
});

const responseWrapper = Type.Object({
  data: Type.Union([scheduleResponse, Type.Array(scheduleResponse)]),
  links: Type.Object({
    self: Type.String(),
  }),
});

const errorResponse = Type.Object({
  error: Type.String(),
});

export const createScheduleSchema: FastifySchema = {
  body: Type.Object(scheduleBase),
  response: {
    200: responseWrapper,
    400: errorResponse,
  },
};

export const updateScheduleSchema: FastifySchema = {
  params: Type.Object({
    scheduleId: Type.String(),
  }),
  body: Type.Partial(Type.Object(scheduleBase)),
  response: {
    200: responseWrapper,
    404: errorResponse,
  },
};

export const getScheduleSchema: FastifySchema = {
  params: Type.Object({
    scheduleId: Type.String(),
  }),
  response: {
    200: responseWrapper,
    404: errorResponse,
  },
};

export const getSchedulesSchema: FastifySchema = {
  querystring: Type.Object({
    deviceId: Type.Optional(Type.String()),
    status: Type.Optional(Type.String()),
  }),
  response: {
    200: responseWrapper,
    500: errorResponse,
  },
};

export const deleteScheduleSchema: FastifySchema = {
  params: Type.Object({
    scheduleId: Type.String(),
  }),
  response: {
    200: Type.Object({
      data: Type.Object({
        message: Type.String(),
      }),
      links: Type.Object({
        self: Type.String(),
      }),
    }),
    404: errorResponse,
  },
};
