import { API_BASE_URL } from '../utils/api/config';
import {
  Room,
  RoomInfo,
  BookingResult,
} from '../components/booking-dashboard/types';

/**
 * Check authentication status with the Exchange API
 * @returns Promise with authentication status
 */
export const checkAuthStatus = async (): Promise<{
  authenticated: boolean;
}> => {
  const response = await fetch(`${API_BASE_URL}/exchange/status`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(
      `Auth status check failed with HTTP status: ${response.status}`
    );
  }

  return await response.json();
};

/**
 * Get the authentication URL for Exchange API
 * @param adminConsent Whether to request admin consent
 * @returns The authentication URL
 */
export const getAuthUrl = (adminConsent: boolean = false): string => {
  const currentHost = window.location.hostname;
  const isLocalhost =
    currentHost === 'localhost' || currentHost === '127.0.0.1';

  if (isLocalhost) {
    return `${API_BASE_URL}/exchange/auth?admin_consent=${adminConsent}&t=${Date.now()}`;
  } else {
    return `${API_BASE_URL}/exchange/auth?admin_consent=${adminConsent}&t=${Date.now()}&return_host=${currentHost}`;
  }
};

/**
 * Get admin consent URL for Exchange API
 * @returns The admin consent URL
 */
export const getAdminConsentUrl = (): string => {
  const currentHost = window.location.hostname;
  return `${API_BASE_URL}/exchange/admin-consent?return_host=${currentHost}&t=${Date.now()}`;
};

/**
 * Fetch all available rooms
 * @returns Promise with array of rooms
 */
export const fetchRooms = async (): Promise<Room[]> => {
  const response = await fetch(`${API_BASE_URL}/exchange/rooms`, {
    credentials: 'include',
  });

  if (!response.ok) {
    // If unauthorized, throw a specific error
    if (response.status === 401 || response.status === 403) {
      throw new Error('UNAUTHORIZED');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  // Handle both formats the API might return
  const roomsData = data.rooms || data;
  return Array.isArray(roomsData) ? roomsData : [];
};

/**
 * Fetch details for a specific room
 * @param roomId The room ID to fetch details for
 * @returns Promise with room info
 */
export const fetchRoomInfo = async (roomId: string): Promise<RoomInfo> => {
  const response = await fetch(`${API_BASE_URL}/exchange/rooms/${roomId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const data = await response.json();

  // Verify the room data is valid
  if (!data || !data.roomName) {
    throw new Error('Invalid room data received');
  }

  return data;
};

/**
 * Book a room for a specified duration
 * @param roomId The room ID to book
 * @param duration Duration in minutes
 * @param title Optional meeting title
 * @returns Promise with booking result
 */
export const bookRoom = async (
  roomId: string,
  duration: number,
  title: string = 'Ad-hoc Meeting'
): Promise<BookingResult> => {
  try {
    const bookingData = {
      duration,
      title,
    };

    const response = await fetch(
      `${API_BASE_URL}/exchange/rooms/${roomId}/book`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
        credentials: 'include',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Booking failed with status ${response.status}`,
      };
    }

    return {
      success: true,
      meeting: data.meeting,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Cancel a meeting
 * @param roomId The room ID where the meeting is held
 * @param meetingId The ID of the meeting to cancel
 * @returns Promise with cancellation result
 */
export const cancelMeeting = async (
  roomId: string,
  meetingId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`[API] Cancelling meeting ${meetingId} in room ${roomId}`);

    // Note: The IDs are already URL encoded by the calling function
    const url = `${API_BASE_URL}/exchange/rooms/${roomId}/meetings/${meetingId}`;
    console.log(`[API] Request URL: ${url}`);

    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include',
    });

    console.log(`[API] Response status:`, response.status);

    if (!response.ok) {
      let errorData: { error?: string } = {};
      try {
        errorData = await response.json();
      } catch (jsonError) {
        console.error(`[API] Failed to parse error response:`, jsonError);
        // Fall back to empty object if JSON parsing fails
      }

      console.error(`[API] Error response:`, errorData);

      return {
        success: false,
        error:
          errorData.error ||
          `Cancellation failed with status ${response.status} (${response.statusText})`,
      };
    }

    console.log(`[API] Meeting successfully cancelled`);
    return { success: true };
  } catch (error) {
    console.error(`[API] Exception in cancelMeeting:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};

/**
 * Alternative approach to cancel a meeting (POST request with cancel action)
 * @param roomId The room ID where the meeting is held
 * @param meetingId The ID of the meeting to cancel
 * @returns Promise with cancellation result
 */
export const cancelMeeting2 = async (
  roomId: string,
  meetingId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(
      `[API] Using alternative method to cancel meeting ${meetingId}`
    );

    // Instead of DELETE request, use POST with cancel action
    const url = `${API_BASE_URL}/exchange/rooms/${roomId}/meetings/cancel`;
    console.log(`[API] Request URL: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ meetingId }),
      credentials: 'include',
    });

    console.log(`[API] Response status:`, response.status);

    if (!response.ok) {
      let errorData: { error?: string } = {};
      try {
        errorData = await response.json();
      } catch (jsonError) {
        console.error(`[API] Failed to parse error response:`, jsonError);
        // Fall back to empty object if JSON parsing fails
      }

      console.error(`[API] Error response:`, errorData);

      return {
        success: false,
        error:
          errorData.error ||
          `Cancellation failed with status ${response.status} (${response.statusText})`,
      };
    }

    console.log(`[API] Meeting successfully cancelled`);
    return { success: true };
  } catch (error) {
    console.error(`[API] Exception in cancelMeeting2:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
