import { FastifyReply, FastifyRequest } from 'fastify';
import * as service from './service';
import { CacheContentBody } from './schema';

/**
 * Cache content for a specific schedule
 */
export const cacheContent = async (
  req: FastifyRequest<{ 
    Params: { scheduleId: string }; 
    Body: CacheContentBody 
  }>,
  reply: FastifyReply
) => {
  const { scheduleId } = req.params;

  try {
    const result = await service.cacheContentForSchedule(scheduleId, req.body);
    return reply.status(200).send({ data: result });
  } catch (error) {
    return reply.status(404).send({
      error: error instanceof Error ? error.message : 'Failed to initiate content caching'
    });
  }
};