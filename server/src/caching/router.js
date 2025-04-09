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
const service_1 = require("./service");
// Export Fastify plugin to define caching routes
const cacheRoutes = (fastify, opts) => __awaiter(void 0, void 0, void 0, function* () {
    fastify.post("/:scheduleId", { schema: schema_1.cacheContentSchema }, controller_1.cacheContent);
    // Add new GET endpoint to check progress
    fastify.get("/:scheduleId/progress/:deviceId", (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
        const { scheduleId, deviceId } = req.params;
        const progress = (0, service_1.getCacheProgress)(deviceId, scheduleId);
        if (!progress) {
            return reply.status(404).send({
                error: 'No cache progress found for this schedule and device'
            });
        }
        return reply.send({ data: progress });
    }));
});
exports.default = (fastify, opts, done) => {
    fastify.register(cacheRoutes, { prefix: "/cache" });
    done();
};
