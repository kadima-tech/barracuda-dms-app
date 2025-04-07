import { Static, Type } from '@sinclair/typebox';

// Schema for room information
export const RoomInfoSchema = Type.Object({
  roomName: Type.String(),
  location: Type.String(),
  currentTime: Type.String(),
  currentDate: Type.String(),
  availabilityStatus: Type.Union([
    Type.Literal('available'),
    Type.Literal('busy'),
    Type.Literal('reserved'),
  ]),
  currentMeeting: Type.Optional(
    Type.Object({
      id: Type.String(),
      title: Type.String(),
      startTime: Type.String(),
      endTime: Type.String(),
      organizer: Type.Optional(Type.String()),
      attendees: Type.Optional(Type.Number()),
    })
  ),
  upcomingMeetings: Type.Array(
    Type.Object({
      id: Type.String(),
      title: Type.String(),
      startTime: Type.String(),
      endTime: Type.String(),
      organizer: Type.Optional(Type.String()),
      attendees: Type.Optional(Type.Number()),
    })
  ),
  availableUntil: Type.Optional(Type.String()),
  availableFor: Type.Optional(Type.Number()),
});

export type RoomInfo = Static<typeof RoomInfoSchema>;

// Schema for Exchange API credentials
export const ExchangeCredentialsSchema = Type.Object({
  accessToken: Type.String(),
  refreshToken: Type.String(),
  expiresAt: Type.Number(),
});

export type ExchangeCredentials = Static<typeof ExchangeCredentialsSchema>;

// Schema for booking request
export const BookingRequestSchema = Type.Object({
  duration: Type.Number(),
  title: Type.Optional(Type.String()),
  startTime: Type.Optional(Type.String()),
  endTime: Type.Optional(Type.String()),
});

export type BookingRequest = Static<typeof BookingRequestSchema>;

// Schema for booking response
export const BookingResponseSchema = Type.Object({
  success: Type.Boolean(),
  meeting: Type.Optional(
    Type.Object({
      id: Type.String(),
      title: Type.String(),
      startTime: Type.String(),
      endTime: Type.String(),
      organizer: Type.Optional(Type.String()),
      attendees: Type.Optional(Type.Number()),
    })
  ),
  error: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
});

export type BookingResponse = Static<typeof BookingResponseSchema>;
