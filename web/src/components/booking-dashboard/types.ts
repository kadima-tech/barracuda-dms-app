// Theme types
export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

// Data types
export interface Room {
  id: string;
  name: string;
  capacity: string | number;
  email: string;
}

export interface RoomInfo {
  id?: string; // Room ID for API operations
  roomName: string;
  currentTime: string;
  currentDate: string;
  availabilityStatus: 'available' | 'busy' | 'reserved';
  currentMeeting?: Meeting;
  upcomingMeetings: Meeting[];
  availableUntil?: string;
  availableFor?: number; // minutes
}

export interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  organizer?: string;
  attendees?: number;
}

export interface RoomStatusMessage {
  status: 'available' | 'busy' | 'reserved';
  title: string;
  message: string;
}

export interface BookingStatus {
  message: string;
  isError: boolean;
}

// Exchange API response structure for Meeting
export interface ExchangeMeeting {
  id: string;
  title: string;
  organizer?: {
    emailAddress?: {
      name?: string;
      address?: string;
    };
  };
  attendees?: Array<{
    emailAddress?: {
      name?: string;
      address?: string;
    };
    type?: string;
  }>;
  start?: {
    dateTime?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    timeZone?: string;
  };
}

// Type for booking results
export interface BookingResult {
  success: boolean;
  meeting?: ExchangeMeeting;
  error?: string;
}
