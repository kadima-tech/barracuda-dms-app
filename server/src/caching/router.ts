import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";
import { cacheContent } from "./controller";
import { cacheContentSchema } from "./schema";
import { getCacheProgress } from "./service";

// Export Fastify plugin to define caching routes
const cacheRoutes = async (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) => {
  fastify.post(
    "/:scheduleId",
    { schema: cacheContentSchema },
    cacheContent
  );

  // Add new GET endpoint to check progress
  fastify.get(
    "/:scheduleId/progress/:deviceId",
    async (req: FastifyRequest<{
      Params: { scheduleId: string; deviceId: string }
    }>, reply: FastifyReply) => {
      const { scheduleId, deviceId } = req.params;
      const progress = getCacheProgress(deviceId, scheduleId);
      
      if (!progress) {
        return reply.status(404).send({ 
          error: 'No cache progress found for this schedule and device' 
        });
      }
      
      return reply.send({ data: progress });
    }
  );
};

export default (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
  done: () => void
) => {
  fastify.register(cacheRoutes, { prefix: "/cache" });
  done();
};