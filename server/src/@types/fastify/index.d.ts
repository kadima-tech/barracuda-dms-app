import { Server as SocketIOServer } from "socket.io";
import fastify from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    io: SocketIOServer;
  }
}
