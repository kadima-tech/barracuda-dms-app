import { createMicroService, logger } from '@kadima-tech/micro-service-base';

const setup = async () => {
  try {
    const { fastify, port } = await createMicroService({
      title: '<PROJECT_NAME> Service',
      routes: [],
      autoDetectHostname: true,
    });

    fastify.listen({ port, host: '::' });
  } catch (e) {
    logger.error('Failed to start service because of error: ', e);
    logger.error(e as Error);
  }
};

setup();
