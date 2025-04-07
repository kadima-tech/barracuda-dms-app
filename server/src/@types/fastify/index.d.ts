import fastifyCookie from '@fastify/cookie'; // This import is required for module augmentation
import { IContext } from '@kadima-tech/micro-service-base';
import fastify from 'fastify';
import { AuthorizationCode } from 'simple-oauth2';

declare module 'fastify' {
  interface FastifyRequest {
    userContext: IContext;
    getContext: () => IContext;
  }

  interface FastifySchema {
    tags: string[];
    operationId?: string;
  }
}
