import { Type } from '@sinclair/typebox';
import { FastifySchema } from 'fastify';

const scheduleBase = {
  deviceId: Type.String(),
  videoUrl: Type.String(),
  startTime: Type.String(),
  endTime: Type.String(),
  repeat: Type.Optional(Type.Union([
    Type.Literal('daily'),
    Type.Literal('weekly'),
    Type.Literal('monthly'),
    Type.Literal('none')
  ])),
  cacheDuration: Type.Number()
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
    Type.Literal('error')
  ]),
  created: Type.String(),
  updated: Type.String()
});

export const createScheduleSchema: FastifySchema = {
  body: Type.Object(scheduleBase),
  response: {
    200: scheduleResponse
  }
};

export const updateScheduleSchema: FastifySchema = {
  params: Type.Object({
    scheduleId: Type.String()
  }),
  body: Type.Partial(Type.Object(scheduleBase)),
  response: {
    200: scheduleResponse
  }
};

export const getScheduleSchema: FastifySchema = {
  params: Type.Object({
    scheduleId: Type.String()
  }),
  response: {
    200: scheduleResponse
  }
};

export const getSchedulesSchema: FastifySchema = {
  querystring: Type.Object({
    deviceId: Type.Optional(Type.String()),
    status: Type.Optional(Type.String())
  }),
  response: {
    200: Type.Array(scheduleResponse)
  }
};

export const deleteScheduleSchema: FastifySchema = {
  params: Type.Object({
    scheduleId: Type.String()
  }),
  response: {
    200: Type.Object({
      message: Type.String()
    })
  }
};
