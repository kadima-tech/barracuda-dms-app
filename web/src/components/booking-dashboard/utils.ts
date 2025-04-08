import { Meeting, RoomInfo, RoomStatusMessage } from './types';

// Timezone constant for Amsterdam
export const AMSTERDAM_TIMEZONE = 'Europe/Amsterdam';

// Get current time in Amsterdam timezone
export const getAmsterdamTime = (): Date => {
  // Get the current date
  const now = new Date();

  // Create a formatter using the Amsterdam timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: AMSTERDAM_TIMEZONE,
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

// Parse a time string in various formats and return a Date object
export const parseTime = (timeString: string): Date => {
  const now = getAmsterdamTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Handle time formats like "14:30" (24h) or "2:30 PM" (12h)
  const parts = timeString.split(/[:\s]/);
  let hours = parseInt(parts[0], 10);
  const minutes = parts.length > 1 ? parseInt(parts[1], 10) : 0;

  // Handle AM/PM if present
  if (
    parts.length > 2 &&
    parts[2]?.toUpperCase().includes('PM') &&
    hours < 12
  ) {
    hours += 12;
  } else if (
    parts.length > 2 &&
    parts[2]?.toUpperCase().includes('AM') &&
    hours === 12
  ) {
    hours = 0; // 12 AM is 0 hours in 24h format
  }

  // Create date with today's date and parsed time
  const result = new Date(today);
  result.setHours(hours, minutes);
  return result;
};

// Format a time string for display (e.g., "14:30" → "14:30")
export const formatTimeForDisplay = (timeInput: string | Date): string => {
  // If input is a Date object, format it directly
  if (timeInput instanceof Date) {
    const hours = timeInput.getHours().toString().padStart(2, '0');
    const minutes = timeInput.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // If the time is already in HH:MM format, return it with proper formatting
  if (typeof timeInput === 'string' && /^\d{1,2}:\d{2}$/.test(timeInput)) {
    // Ensure single-digit hours have leading zeros
    const [hours, minutes] = timeInput.split(':');
    return `${hours.padStart(2, '0')}:${minutes}`;
  }

  // Otherwise parse it and reformat
  const date = parseTime(timeInput as string);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Format time to display in Dutch 24-hour format
export const formatTimeInDutchFormat = (timeStr: string | Date): string => {
  try {
    let dateObj: Date;

    // Handle different input types
    if (typeof timeStr === 'string') {
      // If timeStr is already in 24-hour format, parse it directly
      dateObj = parseTime(timeStr);
    } else {
      // If already a Date object, use it directly
      dateObj = timeStr;
    }

    // Format to Dutch locale with 24-hour time
    return dateObj.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: AMSTERDAM_TIMEZONE,
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return typeof timeStr === 'string' ? timeStr : timeStr.toLocaleTimeString(); // Return original if parsing fails
  }
};

// Format date for display with timezone awareness
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: AMSTERDAM_TIMEZONE,
  });
};

// Get current Amsterdam time as a formatted string
export const getCurrentAmsterdamTimeFormatted = (): string => {
  return formatTimeForDisplay(getAmsterdamTime());
};

// Calculate end time based on current Amsterdam time and duration
export const calculateEndTime = (durationMinutes: number): Date => {
  const startTime = getAmsterdamTime();
  return new Date(startTime.getTime() + durationMinutes * 60000);
};

// Find current meeting in upcomingMeetings list
export const findCurrentMeeting = (
  upcomingMeetings: Meeting[]
): Meeting | undefined => {
  const now = getAmsterdamTime();
  return upcomingMeetings.find((m) => {
    const startTime = parseTime(m.startTime);
    const endTime = parseTime(m.endTime);
    return startTime <= now && endTime > now;
  });
};

// Find next upcoming meeting
export const findNextMeeting = (
  upcomingMeetings: Meeting[]
): Meeting | undefined => {
  const now = getAmsterdamTime();
  return upcomingMeetings
    .filter((m) => parseTime(m.startTime) > now)
    .sort(
      (a, b) =>
        parseTime(a.startTime).getTime() - parseTime(b.startTime).getTime()
    )[0];
};

// Calculate current time position in the day as percentage (focusing on business hours 9-17)
export const calculateTimePositionPercentage = (): number => {
  const now = getAmsterdamTime();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Focus specifically on business hours (9:00 - 17:00)
  const startHour = 9; // 9 AM
  const endHour = 17; // 5 PM
  const totalMinutes = (endHour - startHour) * 60;

  // Calculate minutes elapsed since start hour
  const currentMinutes = Math.max(0, (hours - startHour) * 60 + minutes);

  // Calculate position as percentage (clamped between 0-100%)
  return Math.max(0, Math.min(100, (currentMinutes / totalMinutes) * 100));
};

// Get room status message based on current availability
export const getRoomStatusMessage = (
  roomInfo: RoomInfo | null
): RoomStatusMessage => {
  if (!roomInfo) {
    return {
      status: 'available',
      title: 'Select a room',
      message: 'Choose from dropdown above',
    };
  }

  const currentMeeting =
    roomInfo.currentMeeting || findCurrentMeeting(roomInfo.upcomingMeetings);

  if (currentMeeting) {
    return {
      status: 'busy',
      title: 'In use',
      message: `Until ${formatTimeForDisplay(currentMeeting.endTime)}`,
    };
  } else if (roomInfo.availabilityStatus === 'busy') {
    const nextMeeting = findNextMeeting(roomInfo.upcomingMeetings);
    return {
      status: 'busy',
      title: 'Busy',
      message: nextMeeting
        ? `Next: ${formatTimeForDisplay(nextMeeting.startTime)}`
        : 'No upcoming meetings',
    };
  } else if (
    roomInfo.availabilityStatus === 'reserved' ||
    roomInfo.availableUntil
  ) {
    return {
      status: 'reserved',
      title: 'Available now',
      message: roomInfo.availableUntil
        ? `Until ${formatTimeForDisplay(roomInfo.availableUntil)}`
        : 'Limited time',
    };
  } else {
    return {
      status: 'available',
      title: 'Available',
      message: 'Rest of the day',
    };
  }
};
