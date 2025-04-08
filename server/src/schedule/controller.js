"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.deleteSchedule = exports.getSchedules = exports.getSchedule = exports.updateSchedule = exports.createSchedule = void 0;
const service = __importStar(require("./service"));
const createSchedule = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schedule = yield service.createSchedule(req.body);
        return reply.send({
            data: schedule,
            links: {
                self: `http://localhost:80/schedules/${schedule.id}`,
            },
        });
    }
    catch (error) {
        return reply.status(400).send({
            error: error instanceof Error ? error.message : 'Failed to create schedule',
        });
    }
});
exports.createSchedule = createSchedule;
const updateSchedule = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schedule = yield service.updateSchedule(req.params.scheduleId, req.body);
        return reply.send({
            data: schedule,
            links: {
                self: `http://localhost:80/schedules/${schedule.id}`,
            },
        });
    }
    catch (error) {
        return reply.status(404).send({
            error: error instanceof Error ? error.message : 'Failed to update schedule',
        });
    }
});
exports.updateSchedule = updateSchedule;
const getSchedule = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schedule = service.getSchedule(req.params.scheduleId);
        return reply.send({
            data: schedule,
            links: {
                self: `http://localhost:80/schedules/${schedule.id}`,
            },
        });
    }
    catch (error) {
        return reply.status(404).send({
            error: error instanceof Error ? error.message : 'Schedule not found',
        });
    }
});
exports.getSchedule = getSchedule;
const getSchedules = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schedules = service.getSchedules(req.query);
        return reply.send({
            data: schedules,
            links: {
                self: 'http://localhost:80/schedules',
            },
        });
    }
    catch (error) {
        return reply.status(500).send({
            error: error instanceof Error ? error.message : 'Failed to get schedules',
        });
    }
});
exports.getSchedules = getSchedules;
const deleteSchedule = (req, reply) => __awaiter(void 0, void 0, void 0, function* () {
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
    }
    catch (error) {
        return reply.status(404).send({
            error: error instanceof Error ? error.message : 'Failed to delete schedule',
        });
    }
});
exports.deleteSchedule = deleteSchedule;
