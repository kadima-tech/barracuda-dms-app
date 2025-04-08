import {
  RoomInfo,
  ExchangeCredentials,
  BookingRequest,
  BookingResponse,
} from './schema';
import { config } from '../config';
import { logger } from '@kadima-tech/micro-service-base';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';

// Re-export config for use in other modules
export { config };

// In-memory storage for credentials (in a real app, use a database)
let exchangeCredentials: ExchangeCredentials | null = null;

// Configuration is now imported from config.ts with proper validation

// Add this interface near the top of the file with other types
interface CalendarEvent {
  id: string;
  subject: string;
  start: { dateTime: string };
  end: { dateTime: string };
  organizer?: { emailAddress?: { name?: string } };
  attendees?: any[];
  createdDateTime?: string;
  location?: { displayName?: string };
}

// Add this interface for the optional parameters
interface RoomInfoOptions {
  forceRefresh?: boolean;
  retryCount?: number;
  expandCalendarView?: boolean;
  includeAllDayMeetings?: boolean;
}

export class ExchangeService {
  private static instance: ExchangeService;
  private baseUrl = 'https://graph.microsoft.com/v1.0';

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): ExchangeService {
    if (!ExchangeService.instance) {
      ExchangeService.instance = new ExchangeService();
    }
    return ExchangeService.instance;
  }

  private getGraphClient(): Client {
    if (!exchangeCredentials?.accessToken) {
      throw new Error('No valid access token available');
    }

    return Client.initWithMiddleware({
      authProvider: {
        getAccessToken: async (): Promise<string> => {
          // Check if token is expired and refresh if needed
          if (
            exchangeCredentials &&
            exchangeCredentials.expiresAt < Date.now()
          ) {
            await this.refreshAccessToken();
          }
          return exchangeCredentials?.accessToken || '';
        },
      },
    });
  }

  async getRoomInfo(
    roomId: string,
    options?: RoomInfoOptions
  ): Promise<RoomInfo | null> {
    try {
      const opts = options || {};
      logger.info(
        `Getting room info for room ID: ${roomId}${
          opts.forceRefresh ? ' (FORCE REFRESH)' : ''
        }`
      );
      const graphClient = this.getGraphClient();

      // Calculate today's date range (based on local timezone)
      const now = new Date();
      logger.info(`Current date and time: ${now.toISOString()}`);

      // Get the current date at midnight in local time zone
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      // Get the end of today in local time zone
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      // Get the time zone offset (minutes)
      const timeZoneOffsetMinutes = now.getTimezoneOffset();

      // Convert local midnight to UTC for API call
      const startTime = new Date(todayStart.getTime());
      const endTime = new Date(todayEnd.getTime());

      logger.info(
        `Using local time range: ${todayStart.toLocaleString()} to ${todayEnd.toLocaleString()}`
      );
      logger.info(
        `Using UTC time range: ${startTime.toISOString()} to ${endTime.toISOString()}`
      );

      // Get room details first
      logger.info(`Fetching room details for ID: ${roomId}`);
      let room;
      let roomEmail;

      try {
        // First try to get room by ID from users endpoint
        room = await graphClient.api(`/users/${roomId}`).get();
        roomEmail = room.mail || room.userPrincipalName;
        logger.info(
          `Found room details for ${room.displayName} with email ${roomEmail}`
        );
      } catch (userError) {
        logger.error(`Error fetching room from /users endpoint:`, userError);

        // Try the places endpoint as fallback
        try {
          room = await graphClient.api(`/places/${roomId}`).get();
          roomEmail = room.emailAddress;
          logger.info(
            `Found room details from places API for ${room.displayName} with email ${roomEmail}`
          );
        } catch (placeError) {
          logger.error(
            `Error fetching room from /places endpoint:`,
            placeError
          );
          return null;
        }
      }

      if (!room) {
        logger.error('Could not find room details');
        return null;
      }

      // Determine room email - critical for calendar access
      if (!roomEmail) {
        logger.error('Room has no email address:', room);
        return null;
      }

      logger.info(`Using email ${roomEmail} for calendar access`);

      // Get calendar events for the room
      let allEvents: CalendarEvent[] = [];

      // Array to store promises for parallel execution of calendar fetching methods
      const calendarFetchPromises: Promise<any>[] = [];

      // ENHANCED: Add extended timeframe for full day meetings when force refresh is requested
      const expandedStartTime = opts.expandCalendarView
        ? new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0
          ).toISOString()
        : startTime.toISOString();

      // ENHANCED: Log the time range we're using for clarity
      logger.info(
        `Using time range: ${expandedStartTime} to ${endTime.toISOString()}`
      );

      // APPROACH 1: Direct calendar view of room's calendar
      calendarFetchPromises.push(
        (async () => {
          try {
            logger.info(`A1: Fetching events directly from room ${roomEmail}`);
            const roomEventsResponse = await graphClient
              .api(`/users/${roomEmail}/calendarView`)
              .select('subject,start,end,organizer,attendees,id,location')
              .query({
                startDateTime: expandedStartTime,
                endDateTime: endTime.toISOString(),
              })
              .orderby('start/dateTime')
              .top(100)
              .get();

            if (
              roomEventsResponse.value &&
              roomEventsResponse.value.length > 0
            ) {
              logger.info(
                `A1: Found ${roomEventsResponse.value.length} events in room calendar`
              );
              roomEventsResponse.value.forEach((event: any) => {
                // Avoid duplicates
                if (!allEvents.find((e) => e.id === event.id)) {
                  allEvents.push(event);
                  logger.info(
                    `A1: Added room event: ${event.subject} (${event.start.dateTime})`
                  );
                }
              });
            } else {
              logger.info('A1: No events found directly on room calendar');
            }
          } catch (directRoomError) {
            logger.error(
              'A1: Error accessing room calendar directly:',
              directRoomError
            );
          }
        })()
      );

      // APPROACH 2: Check the user's calendar for events with this room
      calendarFetchPromises.push(
        (async () => {
          try {
            logger.info(
              "A2: Checking user's calendar for events with this room"
            );
            const myEventsResponse = await graphClient
              .api('/me/calendarView')
              .select('subject,start,end,organizer,attendees,location,id')
              .query({
                startDateTime: expandedStartTime,
                endDateTime: endTime.toISOString(),
              })
              .orderby('start/dateTime')
              .get();

            if (myEventsResponse.value && myEventsResponse.value.length > 0) {
              logger.info(
                `A2: Found ${myEventsResponse.value.length} total events in user calendar`
              );

              // Filter events that involve this room
              for (const event of myEventsResponse.value) {
                logger.info(`A2: Checking event: ${event.subject}`);
                let isRoomEvent = false;
                let matchReason = '';

                // Check if room is mentioned in location
                if (
                  event.location?.displayName
                    ?.toLowerCase()
                    .includes(room.displayName.toLowerCase())
                ) {
                  isRoomEvent = true;
                  matchReason = 'location name match';
                }

                // Check room aliases (sometimes displayName varies)
                if (room.aliases && Array.isArray(room.aliases)) {
                  for (const alias of room.aliases) {
                    if (
                      event.location?.displayName
                        ?.toLowerCase()
                        .includes(alias.toLowerCase())
                    ) {
                      isRoomEvent = true;
                      matchReason = 'location alias match';
                      break;
                    }
                  }
                }

                // Check if room email is in location
                if (
                  event.location?.displayName
                    ?.toLowerCase()
                    .includes(roomEmail.toLowerCase())
                ) {
                  isRoomEvent = true;
                  matchReason = 'location email match';
                }

                // Check if room is an attendee
                if (event.attendees && Array.isArray(event.attendees)) {
                  for (const attendee of event.attendees) {
                    // Match by complete email
                    if (
                      attendee.emailAddress?.address?.toLowerCase() ===
                      roomEmail.toLowerCase()
                    ) {
                      isRoomEvent = true;
                      matchReason = 'attendee email exact match';
                      break;
                    }

                    // Match by email prefix (before @)
                    if (
                      roomEmail &&
                      attendee.emailAddress?.address &&
                      attendee.emailAddress.address
                        .toLowerCase()
                        .split('@')[0] === roomEmail.toLowerCase().split('@')[0]
                    ) {
                      isRoomEvent = true;
                      matchReason = 'attendee email prefix match';
                      break;
                    }

                    // Match by display name in attendee
                    if (
                      room.displayName &&
                      attendee.emailAddress?.name &&
                      attendee.emailAddress.name
                        .toLowerCase()
                        .includes(room.displayName.toLowerCase())
                    ) {
                      isRoomEvent = true;
                      matchReason = 'attendee name match';
                      break;
                    }

                    // Match any resource attendee (likely a room)
                    if (attendee.type === 'resource') {
                      isRoomEvent = true;
                      matchReason = 'resource attendee';
                      break;
                    }
                  }
                }

                // Add event if it involves this room and isn't already in our list
                if (isRoomEvent && !allEvents.find((e) => e.id === event.id)) {
                  allEvents.push(event);
                  logger.info(
                    `A2: Added event (${matchReason}): ${event.subject} (${event.start.dateTime})`
                  );
                }
              }
            } else {
              logger.info("A2: No events found in user's calendar");
            }
          } catch (userCalendarError) {
            logger.error(
              "A2: Error checking user's calendar:",
              userCalendarError
            );
          }
        })()
      );

      // APPROACH 3: List all calendar groups and calendars to find room calendars
      calendarFetchPromises.push(
        (async () => {
          try {
            logger.info('A3: Checking all calendar groups for room calendars');
            const calendarGroups = await graphClient
              .api('/me/calendarGroups')
              .get();

            for (const group of calendarGroups.value || []) {
              try {
                const calendars = await graphClient
                  .api(`/me/calendarGroups/${group.id}/calendars`)
                  .get();

                for (const calendar of calendars.value || []) {
                  // Check if this calendar might be related to our room
                  const calendarNameLower = calendar.name?.toLowerCase() || '';
                  const roomNameLower = room.displayName.toLowerCase();
                  const roomEmailPrefix = roomEmail.split('@')[0].toLowerCase();

                  if (
                    calendarNameLower.includes(roomNameLower) ||
                    calendarNameLower.includes(roomEmailPrefix)
                  ) {
                    logger.info(
                      `A3: Found potential room calendar: ${calendar.name}`
                    );

                    try {
                      const calEvents = await graphClient
                        .api(
                          `/me/calendarGroups/${group.id}/calendars/${calendar.id}/calendarView`
                        )
                        .select(
                          'subject,start,end,organizer,attendees,id,location'
                        )
                        .query({
                          startDateTime: expandedStartTime,
                          endDateTime: endTime.toISOString(),
                        })
                        .get();

                      if (calEvents.value && calEvents.value.length > 0) {
                        logger.info(
                          `A3: Found ${calEvents.value.length} events in calendar ${calendar.name}`
                        );

                        // Add these events if not already in our list
                        for (const event of calEvents.value) {
                          if (!allEvents.find((e) => e.id === event.id)) {
                            allEvents.push(event);
                            logger.info(
                              `A3: Added event from shared calendar: ${event.subject}`
                            );
                          }
                        }
                      }
                    } catch (calEventError) {
                      logger.error(
                        `A3: Error getting events from calendar ${calendar.name}:`,
                        calEventError
                      );
                    }
                  }
                }
              } catch (calendarError) {
                logger.error(
                  `A3: Error getting calendars for group ${group.name}:`,
                  calendarError
                );
              }
            }
          } catch (groupError) {
            logger.error('A3: Error getting calendar groups:', groupError);
          }
        })()
      );

      // APPROACH 4: Direct query using beta endpoint for better room data
      calendarFetchPromises.push(
        (async () => {
          try {
            // Some organizations have better results with the beta endpoint
            const betaClient = Client.initWithMiddleware({
              baseUrl: 'https://graph.microsoft.com/beta',
              authProvider: {
                getAccessToken: async (): Promise<string> => {
                  if (
                    exchangeCredentials &&
                    exchangeCredentials.expiresAt < Date.now()
                  ) {
                    await this.refreshAccessToken();
                  }
                  return exchangeCredentials?.accessToken || '';
                },
              },
            });

            // Try get events using beta endpoint
            logger.info(`A4: Trying beta API for room ${roomEmail}`);

            const betaEventsResponse = await betaClient
              .api(`/users/${roomEmail}/calendar/events`)
              .select('subject,start,end,organizer,attendees,id,location')
              .filter(
                `start/dateTime ge '${expandedStartTime}' and end/dateTime le '${endTime.toISOString()}'`
              )
              .orderby('start/dateTime')
              .top(100)
              .get();

            if (
              betaEventsResponse.value &&
              betaEventsResponse.value.length > 0
            ) {
              logger.info(
                `A4: Found ${betaEventsResponse.value.length} events using beta API`
              );

              for (const event of betaEventsResponse.value) {
                if (!allEvents.find((e) => e.id === event.id)) {
                  allEvents.push(event);
                  logger.info(
                    `A4: Added event from beta API: ${event.subject}`
                  );
                }
              }
            } else {
              logger.info('A4: No events found using beta API');
            }
          } catch (betaError) {
            logger.error('A4: Error using beta endpoint:', betaError);
          }
        })()
      );

      // Execute all calendar fetch operations in parallel
      await Promise.allSettled(calendarFetchPromises);

      // Log a summary of all events found
      logger.info(`Total events found across all methods: ${allEvents.length}`);
      if (allEvents.length > 0) {
        logger.info(
          'Event summary:',
          allEvents.map((e) => ({
            subject: e.subject,
            start: e.start.dateTime,
            end: e.end.dateTime,
          }))
        );

        // Add detailed event filtering debugging
        logger.info('DEBUG: Detailed event filtering:');
        const now = new Date();
        allEvents.forEach((event, index) => {
          const start = new Date(event.start.dateTime);
          const end = new Date(event.end.dateTime);
          const isUpcoming = start > now || (start <= now && end > now);

          logger.info(`DEBUG: Event ${index + 1}: ${event.subject}`);
          logger.info(`DEBUG:   - Start: ${start.toLocaleString()}`);
          logger.info(`DEBUG:   - End: ${end.toLocaleString()}`);
          logger.info(`DEBUG:   - Now: ${now.toLocaleString()}`);
          logger.info(`DEBUG:   - Is upcoming: ${isUpcoming}`);
          logger.info(
            `DEBUG:   - Reason: ${
              start > now
                ? 'Starts in future'
                : start <= now && end > now
                ? 'Currently ongoing'
                : 'Already ended'
            }`
          );
        });
      } else {
        logger.warn('NO EVENTS FOUND FOR ROOM - THIS IS LIKELY THE ISSUE');
      }

      // Format the response
      const currentTime = now.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const currentDate = now.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      // FIXED: Ensure strict room matching to avoid cross-room event contamination
      // Filter events to make sure they ACTUALLY belong to this specific room
      allEvents = allEvents.filter((event) => {
        // Check if this event is explicitly for this room
        let isForThisRoom = false;

        // Match by room email in attendees
        if (event.attendees && Array.isArray(event.attendees)) {
          const attendeeMatch = event.attendees.some(
            (attendee) =>
              attendee.emailAddress?.address?.toLowerCase() ===
                roomEmail.toLowerCase() ||
              (attendee.type === 'resource' &&
                attendee.emailAddress?.name?.toLowerCase() ===
                  room.displayName.toLowerCase())
          );

          if (attendeeMatch) {
            isForThisRoom = true;
          }
        }

        // Match by location name if not found in attendees
        if (!isForThisRoom && event.location && event.location.displayName) {
          const locationDisplayName = event.location.displayName.toLowerCase();
          isForThisRoom =
            locationDisplayName.includes(room.displayName.toLowerCase()) ||
            locationDisplayName.includes(roomEmail.toLowerCase());
        }

        return isForThisRoom;
      });

      logger.info(
        `After strict room filtering: ${allEvents.length} events remain specific to room ${room.displayName}`
      );

      // Determine availability status
      let availabilityStatus: 'available' | 'busy' | 'reserved' = 'available';
      let currentMeeting = null;
      let availableUntil = '';
      let availableFor = 0;

      // Get upcoming meetings (sorted by start time), including past meetings from today
      const upcomingMeetings = allEvents
        .filter((event) => {
          const start = new Date(event.start.dateTime);
          const end = new Date(event.end.dateTime);

          // Include all meetings from today (even past ones)
          const today = new Date();
          const startOfToday = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );

          // Get the end of today plus next day
          const endOfTomorrow = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + 1,
            23,
            59,
            59
          );

          // Add detailed logging for debugging this specific event
          logger.info(`DEBUG: Event: ${event.subject}`);
          logger.info(`DEBUG:   - Start: ${start.toLocaleString()}`);
          logger.info(`DEBUG:   - End: ${end.toLocaleString()}`);
          logger.info(`DEBUG:   - Now: ${today.toLocaleString()}`);

          // Check if the event is upcoming relative to now
          const isUpcoming = end > today;
          const reason = !isUpcoming
            ? 'Already ended'
            : start <= today && end > today
            ? 'Currently active'
            : 'Upcoming';

          logger.info(`DEBUG:   - Is upcoming: ${isUpcoming}`);
          logger.info(`DEBUG:   - Reason: ${reason}`);

          // Include meetings that are either currently happening or recently ended (within last 3 hours)
          const recentCutoff = new Date(today.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
          const isRecentEnded = end <= today && end >= recentCutoff;

          // Include if the meeting is today or tomorrow, or is recent
          return (
            start >= startOfToday || // Starts today or later
            end >= startOfToday || // Ends today or later
            (start <= today && end >= today) || // Currently happening
            isRecentEnded // Recently ended (within last 3 hours)
          );
        })
        .sort((a, b) => {
          return (
            new Date(a.start.dateTime).getTime() -
            new Date(b.start.dateTime).getTime()
          );
        })
        .map((event) => ({
          id: event.id,
          title: event.subject,
          startTime: new Date(event.start.dateTime).toLocaleTimeString(
            'nl-NL',
            {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }
          ),
          endTime: new Date(event.end.dateTime).toLocaleTimeString('nl-NL', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
          organizer: event.organizer?.emailAddress?.name,
          attendees: event.attendees?.length || 0,
        }));

      // Specifically find meetings that are currently happening or recently ended
      // This ensures we include the current meeting even if it technically ended
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago instead of 30 minutes

      currentMeeting = allEvents.find((event) => {
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);

        // Check if the meeting is currently active OR ended in the last 3 hours
        const isCurrentlyActive = now >= start && now < end;
        const recentlyEnded = end > threeHoursAgo && end <= now;

        // Also consider meetings created in the last hour
        const wasRecentlyCreated = event.createdDateTime
          ? now.getTime() - new Date(event.createdDateTime).getTime() <
            60 * 60 * 1000 // 1 hour
          : false;

        if (isCurrentlyActive) {
          logger.info(
            `Found CURRENTLY ACTIVE meeting: ${
              event.subject
            } (${start.toLocaleString()} - ${end.toLocaleString()})`
          );
        } else if (recentlyEnded) {
          logger.info(
            `Found RECENTLY ENDED meeting: ${
              event.subject
            } (ended ${end.toLocaleString()})`
          );
        } else if (wasRecentlyCreated) {
          logger.info(
            `Found RECENTLY CREATED meeting: ${event.subject} (created within last hour)`
          );
        }

        return isCurrentlyActive || recentlyEnded || wasRecentlyCreated;
      });

      // Check if there are any meetings today (regardless of whether they've ended)
      const hasMeetingsToday = allEvents.some((event) => {
        const start = new Date(event.start.dateTime);
        const today = new Date();
        return start.toDateString() === today.toDateString();
      });

      // Check if there are any upcoming meetings (not past ones)
      const upcomingMeetingsExist = allEvents.some((event) => {
        const start = new Date(event.start.dateTime);
        return start > now;
      });

      // If we found a current or recent meeting, mark the room as busy
      if (currentMeeting) {
        availabilityStatus = 'busy';
        logger.info(
          `Room is currently or recently busy with: ${currentMeeting.subject}`
        );
      } else if (hasMeetingsToday) {
        // If there were meetings today (even if they ended), mark room as busy
        availabilityStatus = 'busy';
        logger.info(`Room had meetings today, marking as busy`);
      } else if (upcomingMeetingsExist) {
        // If there are upcoming meetings but none today, mark as reserved
        availabilityStatus = 'reserved';
        logger.info(`Room has upcoming meetings, marking as reserved`);
      } else {
        availabilityStatus = 'available';
        logger.info(`Room is available - no current or upcoming meetings`);
      }

      // Find the next upcoming meeting
      const nextMeeting = allEvents
        .filter((event) => {
          const start = new Date(event.start.dateTime);
          return start > now;
        })
        .sort((a, b) => {
          return (
            new Date(a.start.dateTime).getTime() -
            new Date(b.start.dateTime).getTime()
          );
        })[0];

      if (nextMeeting) {
        // Calculate time until next meeting
        const nextMeetingStart = new Date(nextMeeting.start.dateTime);
        availableFor = Math.floor(
          (nextMeetingStart.getTime() - now.getTime()) / (1000 * 60)
        );

        // Format the time when the room will be busy
        availableUntil = nextMeetingStart.toLocaleTimeString('nl-NL', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        logger.info(
          `Room is available for ${availableFor} minutes until ${availableUntil}`
        );
      } else {
        logger.info(`Room is available for the rest of the day`);
      }

      logger.info(`Upcoming meetings: ${upcomingMeetings.length}`);
      if (upcomingMeetings.length > 0) {
        logger.info('Upcoming meetings details:', upcomingMeetings);
      } else {
        logger.warn('NO UPCOMING MEETINGS FOUND - THIS IS LIKELY THE ISSUE');
      }

      const roomInfo: RoomInfo = {
        roomName: room.displayName,
        location: room.location?.displayName || 'Unknown',
        currentTime: now.toLocaleTimeString('nl-NL', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        currentDate: now.toLocaleDateString([], {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }),
        availabilityStatus,
        upcomingMeetings,
        availableUntil,
        availableFor,
      };

      // Add additional fields if available
      if (currentMeeting) {
        roomInfo.currentMeeting = {
          id: currentMeeting.id,
          title: currentMeeting.subject,
          startTime: new Date(currentMeeting.start.dateTime).toLocaleTimeString(
            'nl-NL',
            {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }
          ),
          endTime: new Date(currentMeeting.end.dateTime).toLocaleTimeString(
            'nl-NL',
            {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            }
          ),
          organizer: currentMeeting.organizer?.emailAddress?.name,
          attendees: currentMeeting.attendees?.length || 0,
        };
      }

      return roomInfo;
    } catch (error) {
      logger.error('Error in getRoomInfo:', error);
      if (error instanceof Error) {
        logger.error('Error details:', {
          message: error.message,
          stack: error.stack,
        });
      }
      return null;
    }
  }

  async bookRoom(
    roomId: string,
    bookingRequest: BookingRequest
  ): Promise<BookingResponse> {
    try {
      logger.info(
        `Booking room ${roomId} for ${bookingRequest.duration} minutes`
      );

      // Find room in our list
      const rooms = await this.getAllRooms();
      const room = rooms.find((r) => r.id === roomId);
      if (!room) {
        logger.error(`Room with ID ${roomId} not found.`);
        throw new Error(`Room with ID ${roomId} not found.`);
      }

      // Helper to get current time in Amsterdam timezone - simplified version
      const getAmsterdamTime = () => {
        // Get the current date
        const now = new Date();

        // Create a formatter using the Amsterdam timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Europe/Amsterdam',
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
          second: 'numeric',
          hour12: false,
        });

        // Get the parts
        const parts = formatter.formatToParts(now);
        const dateParts: Record<string, number> = {};

        // Convert the parts into an object
        parts.forEach((part) => {
          if (part.type !== 'literal') {
            dateParts[part.type] = parseInt(part.value);
          }
        });

        // Create a date object with these parts (months are 0-indexed in JS)
        return new Date(
          dateParts.year || now.getFullYear(),
          (dateParts.month || 1) - 1,
          dateParts.day || now.getDate(),
          dateParts.hour || now.getHours(),
          dateParts.minute || now.getMinutes(),
          dateParts.second || now.getSeconds()
        );
      };

      // Use current time in Amsterdam timezone as the start time
      const now = getAmsterdamTime();

      logger.info(
        `Current Amsterdam time: ${now.toISOString()} (${now.getHours()}:${now.getMinutes()})`
      );
      logger.info(`Using current Amsterdam time as booking start time`);

      // Calculate end time based on duration
      const endTime = new Date(
        now.getTime() + bookingRequest.duration * 60 * 1000
      );
      logger.info(
        `Calculated end time: ${endTime.toLocaleString()} (${endTime.toISOString()})`
      );

      // Format times to 24-hour Dutch locale
      const startTimeFormatted = now.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const endTimeFormatted = endTime.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      logger.info(`Booking from ${startTimeFormatted} to ${endTimeFormatted}`);

      // Create an event
      const eventData = {
        subject: bookingRequest.title || 'Ad-hoc Meeting',
        start: {
          dateTime: now.toISOString(),
          timeZone: 'Europe/Amsterdam',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Europe/Amsterdam',
        },
        location: {
          displayName: room.name,
        },
        attendees: [
          {
            emailAddress: {
              address: room.email,
              name: room.name,
            },
            type: 'resource',
          },
        ],
        // Include the createdDateTime property and ensure it's set to now
        createdDateTime: now.toISOString(),
      };

      // Book the event
      logger.info(`Creating calendar event for ${room.email}`);

      // Log event details for debugging
      logger.info(`Event details: ${JSON.stringify(eventData, null, 2)}`);

      // Create the event in the user's calendar
      const graphClient = this.getGraphClient();
      const eventResult = await graphClient.api('/me/events').post(eventData);

      // Accept the meeting on behalf of the room
      if (eventResult && eventResult.id) {
        logger.info(`Meeting created with ID: ${eventResult.id}`);

        try {
          await graphClient
            .api(`/users/${room.email}/events/${eventResult.id}/accept`)
            .post({});
          logger.info(`Meeting accepted by room ${room.name}`);
        } catch (error) {
          logger.error(`Error accepting meeting: ${error}`);
          // Continue even if accept fails
        }
      }

      // Don't force refresh room info here - let client refresh when ready
      logger.info(`Successfully booked room ${room.name}`);

      return {
        success: true,
        meeting: {
          id: eventResult.id,
          title: bookingRequest.title || 'Ad-hoc Meeting',
          startTime: startTimeFormatted,
          endTime: endTimeFormatted,
          organizer: 'You', // Current user is the organizer
          attendees: 1, // Just count the room as an attendee
        },
      };
    } catch (error) {
      logger.error(`Error booking room: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get a room by its ID
   * @param roomId The room ID to find
   * @returns The room object or null if not found
   */
  async getRoomById(
    roomId: string
  ): Promise<{ id: string; name: string; email: string } | null> {
    try {
      // Get all rooms first
      const allRooms = await this.getAllRooms();

      // Find the room with the matching ID
      const room = allRooms.find((room) => room.id === roomId);

      if (!room) {
        logger.warn(`Room with ID ${roomId} not found`);
        return null;
      }

      return room;
    } catch (error) {
      logger.error(`Error getting room by ID: ${error}`);
      return null;
    }
  }

  /**
   * Cancel a meeting by its ID
   * @param roomId The room ID where the meeting is hosted
   * @param meetingId The ID of the meeting to cancel
   * @returns Object indicating success or failure
   */
  async cancelMeeting(
    roomId: string,
    meetingId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(
        `Attempting to cancel meeting ${meetingId} in room ${roomId}`
      );
      // Log more details about the meeting ID
      logger.info(`Meeting ID details:`, {
        length: meetingId.length,
        containsSlash: meetingId.includes('/'),
        containsPlus: meetingId.includes('+'),
        containsEquals: meetingId.includes('='),
      });

      // Get the room information
      const room = await this.getRoomById(roomId);
      if (!room) {
        logger.error(`Room ${roomId} not found`);
        return { success: false, error: 'Room not found' };
      }

      // Get a Microsoft Graph client
      const graphClient = await this.getGraphClient();
      if (!graphClient) {
        logger.error('Failed to get Microsoft Graph client');
        return { success: false, error: 'Authentication failed' };
      }

      try {
        // Delete the meeting
        logger.info(`Deleting meeting ${meetingId} from room ${room.name}`);
        logger.info(`Using API URL: /users/${room.email}/events/${meetingId}`);

        // Try with URL encoded meetingId if it contains special characters
        let apiUrl = `/users/${room.email}/events/${meetingId}`;

        await graphClient.api(apiUrl).delete();

        logger.info(`Successfully cancelled meeting ${meetingId}`);
        return { success: true };
      } catch (graphError: unknown) {
        logger.error(`Graph API error:`, graphError);

        // Try to provide more detailed error info
        const errorMessage =
          graphError &&
          typeof graphError === 'object' &&
          'message' in graphError
            ? String(graphError.message)
            : 'Unknown error';

        const errorCode =
          graphError && typeof graphError === 'object' && 'code' in graphError
            ? String(graphError.code)
            : 'Unknown code';

        return {
          success: false,
          error: `Microsoft Graph API error: ${errorCode} - ${errorMessage}`,
        };
      }
    } catch (error) {
      logger.error(`Error cancelling meeting: ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      if (!exchangeCredentials?.refreshToken) {
        logger.error('No refresh token available');
        return false;
      }

      logger.info('Refreshing access token');

      const params = new URLSearchParams();
      params.append('client_id', config.EXCHANGE_CLIENT_ID);
      params.append('client_secret', config.EXCHANGE_CLIENT_SECRET);
      params.append('refresh_token', exchangeCredentials.refreshToken);
      params.append('grant_type', 'refresh_token');
      params.append('scope', config.SCOPES.join(' '));

      const response = await fetch(
        `https://login.microsoftonline.com/${config.EXCHANGE_TENANT_ID}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          `HTTP error refreshing token! status: ${response.status}, error: ${errorText}`
        );
        return false;
      }

      const data = await response.json();
      logger.info('Successfully refreshed access token');

      // Update the credentials
      exchangeCredentials = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || exchangeCredentials.refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      return true;
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      return false;
    }
  }

  async setCredentials(credentials: ExchangeCredentials): Promise<void> {
    try {
      logger.info('Updating Exchange credentials');

      // Sanitize for logging (mask the tokens)
      const sanitizedCredentials = {
        accessToken: credentials.accessToken.substring(0, 10) + '...',
        refreshToken: credentials.refreshToken.substring(0, 10) + '...',
        expiresAt: credentials.expiresAt,
        expiresAtFormatted: new Date(credentials.expiresAt).toLocaleString(),
      };

      logger.info(
        `Credentials updated, expires at: ${sanitizedCredentials.expiresAtFormatted}`
      );

      // Actually set the credentials
      exchangeCredentials = {
        accessToken: credentials.accessToken,
        refreshToken: credentials.refreshToken,
        expiresAt: credentials.expiresAt,
      };

      logger.info('Credentials saved successfully');
    } catch (error) {
      logger.error('Error setting credentials:', error);
      throw error;
    }
  }

  public generateRandomString(length: number): string {
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  async getAuthorizationUrl(
    state?: string,
    isAdminConsent = false
  ): Promise<string> {
    // Generate a state parameter for security if not provided
    const stateParam = state || this.generateRandomString(32);

    // For admin consent, use a different endpoint and approach
    if (isAdminConsent) {
      logger.info('Creating admin consent URL');
      // Use the dedicated admin consent endpoint
      const adminConsentUrl = `https://login.microsoftonline.com/${config.EXCHANGE_TENANT_ID}/adminconsent`;

      const queryParams = new URLSearchParams({
        client_id: config.EXCHANGE_CLIENT_ID,
        redirect_uri: config.EXCHANGE_REDIRECT_URI,
        state: stateParam,
      });

      return `${adminConsentUrl}?${queryParams.toString()}`;
    }

    // Regular authorization flow
    logger.info('Creating regular authorization URL with state parameter');

    // Use the exact scopes shown in the Azure portal screenshot
    const scopes = [
      'https://graph.microsoft.com/Calendars.ReadWrite',
      'https://graph.microsoft.com/Place.Read.All',
      'https://graph.microsoft.com/User.Read',
      'offline_access',
    ];

    // Azure OAuth endpoint
    const authEndpoint = `https://login.microsoftonline.com/${config.EXCHANGE_TENANT_ID}/oauth2/v2.0/authorize`;

    // Create URL with properly encoded query parameters
    const queryParams = new URLSearchParams({
      client_id: config.EXCHANGE_CLIENT_ID,
      response_type: 'code',
      redirect_uri: config.EXCHANGE_REDIRECT_URI,
      scope: scopes.join(' '),
      state: stateParam,
      response_mode: 'query',
      // Always require consent to ensure permissions are explicitly granted
      prompt: 'consent',
    });

    logger.info(
      `Authorization URL created with scopes: ${scopes.join(
        ' '
      )} and consent prompt`
    );

    return `${authEndpoint}?${queryParams.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<boolean> {
    try {
      logger.info(
        `Attempting to exchange code for token at: https://login.microsoftonline.com/${config.EXCHANGE_TENANT_ID}/oauth2/v2.0/token`
      );

      logger.info(`Using redirect URI: ${config.EXCHANGE_REDIRECT_URI}`);

      // Use the exact same scopes for token exchange
      const scopes = [
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/Place.Read.All',
        'https://graph.microsoft.com/User.Read',
        'offline_access',
      ];

      // Set up request parameters for token exchange
      const params = new URLSearchParams({
        client_id: config.EXCHANGE_CLIENT_ID,
        client_secret: config.EXCHANGE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.EXCHANGE_REDIRECT_URI,
        scope: scopes.join(' '),
      });

      const requestPayload = params.toString();
      // Log the full request payload for debugging
      logger.info(`Full request payload: ${requestPayload}`);

      // Make token exchange request
      const response = await fetch(
        `https://login.microsoftonline.com/${config.EXCHANGE_TENANT_ID}/oauth2/v2.0/token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: requestPayload,
        }
      );

      // Parse token response
      const data = await response.json();

      // Handle unsuccessful responses (non-200)
      if (!response.ok) {
        logger.error(
          `Token exchange error (${response.status}): ${JSON.stringify(data)}`
        );
        return false;
      }

      // Process successful response
      const tokenData: ExchangeCredentials = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      // Store credentials securely
      await this.setCredentials(tokenData);
      logger.info('Token exchange successful');

      return true;
    } catch (error) {
      logger.error('Unhandled error in exchangeCodeForToken:', error);
      return false;
    }
  }

  async hasValidCredentials(): Promise<boolean> {
    if (!exchangeCredentials) {
      return false;
    }

    if (Date.now() >= exchangeCredentials.expiresAt - 60000) {
      return await this.refreshAccessToken();
    }

    return true;
  }

  async getAllRooms(): Promise<any[]> {
    try {
      logger.info('Getting all rooms');
      const graphClient = this.getGraphClient();

      // Let's try explicitly requesting Place findRooms
      // First try to get all place rooms from the organization
      try {
        logger.info(
          'Fetching places/microsoft.graph.room using place collection API'
        );
        const placeResponse = await graphClient
          .api('/places/microsoft.graph.room')
          .get();

        logger.info(
          `Retrieved ${placeResponse.value?.length || 0} rooms using place API`
        );

        if (placeResponse.value && placeResponse.value.length > 0) {
          // Map the rooms to a standardized format
          const rooms = placeResponse.value.map((room: any) => ({
            id: room.id,
            name: room.displayName,
            location: room.address?.city || 'Unknown Location',
            capacity: room.capacity || 'Unknown',
            email: room.emailAddress,
          }));
          return rooms;
        }
      } catch (placeError) {
        logger.error('Error fetching rooms via place API:', placeError);
        logger.info('Falling back to findRooms endpoint');
      }

      // Try the findRooms endpoint as fallback
      try {
        logger.info('Trying findRooms endpoint');
        const findRoomsResponse = await graphClient.api('/me/findRooms').get();

        logger.info(
          `Retrieved ${
            findRoomsResponse.value?.length || 0
          } rooms using findRooms API`
        );

        if (findRoomsResponse.value && findRoomsResponse.value.length > 0) {
          // Map the rooms to a standardized format
          const rooms = findRoomsResponse.value.map((room: any) => ({
            id: room.id || room.address,
            name: room.name,
            location: 'Unknown Location', // FindRooms doesn't provide location info
            capacity: 'Unknown', // FindRooms doesn't provide capacity
            email: room.address,
          }));
          return rooms;
        }
      } catch (findRoomsError) {
        logger.error('Error fetching rooms via findRooms API:', findRoomsError);
      }

      // Last resort - try to get all users that are rooms
      logger.info('Trying users API to identify rooms');
      const response = await graphClient
        .api('/users')
        .select('id,displayName,mail,userType')
        .filter("userType eq 'Room'")
        .get();

      logger.info(
        `Retrieved ${response.value?.length || 0} rooms using users API`
      );

      if (!response.value || response.value.length === 0) {
        logger.warn('No rooms found in the organization');
        return [];
      }

      // Map the response to a more usable format
      const rooms = response.value.map((room: any) => ({
        id: room.id,
        name: room.displayName,
        location: 'Unknown Location',
        capacity: 'Unknown',
        email: room.mail,
      }));

      return rooms;
    } catch (error) {
      logger.error('Error in getAllRooms:', error);
      if (error instanceof Error) {
        logger.error('Error details:', error.message);
      }
      throw error;
    }
  }
}

// Helper function to parse time strings in different formats
function parseTimeString(timeStr: string, referenceDate: Date): Date {
  const result = new Date(referenceDate);

  // Standardize the time string format (remove extra spaces)
  const formattedTimeStr = timeStr.trim().replace(/\s+/g, ' ');

  // Try to parse 24-hour format first (Dutch standard)
  const match24Hour = formattedTimeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match24Hour) {
    const hours = parseInt(match24Hour[1], 10);
    const minutes = parseInt(match24Hour[2], 10);

    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  // Try to handle formats like "9:30 PM" or "9:30PM" (12-hour format with AM/PM)
  const match12Hour = formattedTimeStr.match(
    /(\d{1,2}):(\d{2})(?:\s*)([APap][Mm])/i
  );
  if (match12Hour) {
    let hours = parseInt(match12Hour[1], 10);
    const minutes = parseInt(match12Hour[2], 10);
    const isPM = match12Hour[3].toUpperCase() === 'PM';

    // Handle 12-hour format conversion
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;

    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  // If no match, throw error with details
  throw new Error(
    `Unable to parse time string: ${timeStr} (formatted as: ${formattedTimeStr})`
  );
}
