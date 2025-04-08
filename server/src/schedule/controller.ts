import { FastifyRequest, FastifyReply } from 'fastify';
import * as service from './service';
import { CreateScheduleRequest, UpdateScheduleRequest } from './types';

export const createSchedule = async (
  req: FastifyRequest<{ Body: CreateScheduleRequest }>,
  reply: FastifyReply
) => {
  try {
    const schedule = await service.createSchedule(req.body);
    return reply.send({
      data: schedule,
      links: {
        self: `http://localhost:80/schedules/${schedule.id}`,
      },
    });
  } catch (error) {
    return reply.status(400).send({
      error:
        error instanceof Error ? error.message : 'Failed to create schedule',
    });
  }
};

export const updateSchedule = async (
  req: FastifyRequest<{
    Params: { scheduleId: string };
    Body: UpdateScheduleRequest;
  }>,
  reply: FastifyReply
) => {
  try {
    const schedule = await service.updateSchedule(
      req.params.scheduleId,
      req.body
    );
    return reply.send({
      data: schedule,
      links: {
        self: `http://localhost:80/schedules/${schedule.id}`,
      },
    });
  } catch (error) {
    return reply.status(404).send({
      error:
        error instanceof Error ? error.message : 'Failed to update schedule',
    });
  }
};

export const getSchedule = async (
  req: FastifyRequest<{ Params: { scheduleId: string } }>,
  reply: FastifyReply
) => {
  try {
    const schedule = service.getSchedule(req.params.scheduleId);
    return reply.send({
      data: schedule,
      links: {
        self: `http://localhost:80/schedules/${schedule.id}`,
      },
    });
  } catch (error) {
    return reply.status(404).send({
      error: error instanceof Error ? error.message : 'Schedule not found',
    });
  }
};

export const getSchedules = async (
  req: FastifyRequest<{
    Querystring: { deviceId?: string; status?: string };
  }>,
  reply: FastifyReply
) => {
  try {
    const schedules = service.getSchedules(req.query);
    return reply.send({
      data: schedules,
      links: {
        self: 'http://localhost:80/schedules',
      },
    });
  } catch (error) {
    return reply.status(500).send({
      error: error instanceof Error ? error.message : 'Failed to get schedules',
    });
  }
};

export const deleteSchedule = async (
  req: FastifyRequest<{ Params: { scheduleId: string } }>,
  reply: FastifyReply
) => {
  try {
    service.deleteSchedule(req.params.scheduleId);
    return reply.send({
      data: {
        message: 'Schedule deleted successfully',
      },
      links: {
        self: `http://localhost:80/schedules/${req.params.scheduleId}`,
      },
    });
  } catch (error) {
    return reply.status(404).send({
      error:
        error instanceof Error ? error.message : 'Failed to delete schedule',
    });
  }
};
