"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingResponseSchema = exports.BookingRequestSchema = exports.ExchangeCredentialsSchema = exports.RoomInfoSchema = void 0;
const typebox_1 = require("@sinclair/typebox");
// Schema for room information
exports.RoomInfoSchema = typebox_1.Type.Object({
    roomName: typebox_1.Type.String(),
    location: typebox_1.Type.String(),
    currentTime: typebox_1.Type.String(),
    currentDate: typebox_1.Type.String(),
    availabilityStatus: typebox_1.Type.Union([
        typebox_1.Type.Literal('available'),
        typebox_1.Type.Literal('busy'),
        typebox_1.Type.Literal('reserved'),
    ]),
    currentMeeting: typebox_1.Type.Optional(typebox_1.Type.Object({
        id: typebox_1.Type.String(),
        title: typebox_1.Type.String(),
        startTime: typebox_1.Type.String(),
        endTime: typebox_1.Type.String(),
        organizer: typebox_1.Type.Optional(typebox_1.Type.String()),
        attendees: typebox_1.Type.Optional(typebox_1.Type.Number()),
    })),
    upcomingMeetings: typebox_1.Type.Array(typebox_1.Type.Object({
        id: typebox_1.Type.String(),
        title: typebox_1.Type.String(),
        startTime: typebox_1.Type.String(),
        endTime: typebox_1.Type.String(),
        organizer: typebox_1.Type.Optional(typebox_1.Type.String()),
        attendees: typebox_1.Type.Optional(typebox_1.Type.Number()),
    })),
    availableUntil: typebox_1.Type.Optional(typebox_1.Type.String()),
    availableFor: typebox_1.Type.Optional(typebox_1.Type.Number()),
});
// Schema for Exchange API credentials
exports.ExchangeCredentialsSchema = typebox_1.Type.Object({
    accessToken: typebox_1.Type.String(),
    refreshToken: typebox_1.Type.String(),
    expiresAt: typebox_1.Type.Number(),
});
// Schema for booking request
exports.BookingRequestSchema = typebox_1.Type.Object({
    duration: typebox_1.Type.Number(),
    title: typebox_1.Type.Optional(typebox_1.Type.String()),
    startTime: typebox_1.Type.Optional(typebox_1.Type.String()),
    endTime: typebox_1.Type.Optional(typebox_1.Type.String()),
});
// Schema for booking response
exports.BookingResponseSchema = typebox_1.Type.Object({
    success: typebox_1.Type.Boolean(),
    meeting: typebox_1.Type.Optional(typebox_1.Type.Object({
        id: typebox_1.Type.String(),
        title: typebox_1.Type.String(),
        startTime: typebox_1.Type.String(),
        endTime: typebox_1.Type.String(),
        organizer: typebox_1.Type.Optional(typebox_1.Type.String()),
        attendees: typebox_1.Type.Optional(typebox_1.Type.Number()),
    })),
    error: typebox_1.Type.Optional(typebox_1.Type.String()),
    status: typebox_1.Type.Optional(typebox_1.Type.String()),
});
