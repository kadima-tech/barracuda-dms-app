"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = require("./controller");
const schema_1 = require("./schema");
const scheduleRoutes = (fastify, opts) => __awaiter(void 0, void 0, void 0, function* () {
    fastify.post("/", { schema: schema_1.createScheduleSchema }, controller_1.createSchedule);
    fastify.put("/:scheduleId", { schema: schema_1.updateScheduleSchema }, controller_1.updateSchedule);
    fastify.get("/:scheduleId", { schema: schema_1.getScheduleSchema }, controller_1.getSchedule);
    fastify.get("/", { schema: schema_1.getSchedulesSchema }, controller_1.getSchedules);
    fastify.delete("/:scheduleId", { schema: schema_1.deleteScheduleSchema }, controller_1.deleteSchedule);
});
exports.default = (fastify, opts, done) => {
    fastify.register(scheduleRoutes, { prefix: "/schedules" });
    done();
};
