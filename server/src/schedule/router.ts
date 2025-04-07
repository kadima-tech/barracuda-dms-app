import { FastifyInstance, FastifyPluginOptions } from "fastify";
import {
  createSchedule,
  updateSchedule,
  getSchedule,
  getSchedules,
  deleteSchedule,
} from "./controller";
import {
  createScheduleSchema,
  updateScheduleSchema,
  getScheduleSchema,
  getSchedulesSchema,
  deleteScheduleSchema,
} from "./schema";

const scheduleRoutes = async (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
) => {
  fastify.post("/", { schema: createScheduleSchema }, createSchedule);
  fastify.put("/:scheduleId", { schema: updateScheduleSchema }, updateSchedule);
  fastify.get("/:scheduleId", { schema: getScheduleSchema }, getSchedule);
  fastify.get("/", { schema: getSchedulesSchema }, getSchedules);
  fastify.delete(
    "/:scheduleId",
    { schema: deleteScheduleSchema },
    deleteSchedule
  );
};

export default (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions,
  done: () => void
) => {
  fastify.register(scheduleRoutes, { prefix: "/schedules" });
  done();
};
