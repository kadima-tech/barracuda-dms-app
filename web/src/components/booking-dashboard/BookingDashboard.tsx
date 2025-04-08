import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import { Room, RoomInfo, Meeting, BookingStatus } from './types';
import RoomHeader from './RoomHeader';
import BookingControlPanel from './BookingControlPanel';
import MeetingsListComponent from './MeetingsList';
import {
  Loading,
  Error,
  BookingStatusNotification,
} from './LoadingErrorComponents';
import {
  formatTimeInDutchFormat,
  getAmsterdamTime,
  calculateEndTime,
  getCurrentAmsterdamTimeFormatted,
  formatDateForDisplay,
} from './utils';
import * as ExchangeAPI from '../../services/exchange-api';
import {
  DashboardContainer,
  ContentWrapper,
  SchedulePanel,
} from './StyledComponents';

const BookingDashboard: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [searchParams, setSearchParams] = useSearchParams();
  const roomId = searchParams.get('roomId') || '';
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus | null>(
    null
  );

  // Function to navigate to a different room
  const handleRoomChange = useCallback(
    (newRoomId: string) => {
      setSearchParams({ roomId: newRoomId });
    },
    [setSearchParams]
  );

  // Check authentication and fetch rooms
  useEffect(() => {
    const checkAuthAndFetchRooms = async () => {
      try {
        setIsLoading(true);
        setError(null); // Reset error state

        // Check authentication status
        const authStatus = await ExchangeAPI.checkAuthStatus();

        if (!authStatus.authenticated) {
          // If not authenticated, redirect to auth page
          window.location.href = ExchangeAPI.getAuthUrl();
          return;
        }

        // Get available rooms
        const availableRooms = await ExchangeAPI.fetchRooms();
        setRooms(availableRooms);

        // If we have a roomId in the URL but it's not valid, clear it
        if (
          roomId &&
          !availableRooms.some((room: Room) => room.id === roomId)
        ) {
          setSearchParams({});
        }
      } catch (error) {
        const err = error as Error;
        setError(`Failed to load rooms: ${err.message || String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndFetchRooms();
  }, [roomId, setSearchParams]);

  // Function to refresh room information
  const refreshRoomInfo = useCallback(async () => {
    if (!roomId) return;

    try {
      console.log(`Refreshing room info for roomId: ${roomId}`);
      setIsLoading(true);

      const refreshedData = await ExchangeAPI.fetchRoomInfo(roomId);
      setRoomInfo(refreshedData);
      setError(null);
    } catch (e: unknown) {
      const err = e as Error;
      console.error('Error refreshing room info:', err);
      setError(`Error refreshing room data: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  // Fetch room info when room ID changes
  useEffect(() => {
    if (roomId) {
      refreshRoomInfo();

      // Set up auto-refresh every minute
      const intervalId = setInterval(() => refreshRoomInfo(), 60000);
      return () => clearInterval(intervalId);
    }
  }, [roomId, refreshRoomInfo]);

  // Handle booking request
  const handleBookNow = async (duration: number): Promise<void> => {
    if (!roomId) {
      setBookingStatus({
        message: 'Error: No room selected',
        isError: true,
      });
      return;
    }

    try {
      setBookingStatus({
        message: 'Booking room...',
        isError: false,
      });

      const result = await ExchangeAPI.bookRoom(roomId, duration);

      if (!result.success) {
        setBookingStatus({
          message: result.error || 'Booking failed',
          isError: true,
        });
        return;
      }

      // Success! Show success message
      setBookingStatus({
        message: 'Room booked successfully!',
        isError: false,
      });

      // Update UI immediately to reflect new booking
      if (roomInfo && result.meeting) {
        // Use Amsterdam time for consistent display
        const amsterdamNow = getAmsterdamTime();
        const formattedStartTime = formatTimeInDutchFormat(amsterdamNow);

        // Calculate end time based on Amsterdam timezone
        const endTime = calculateEndTime(duration);
        const formattedEndTime = formatTimeInDutchFormat(endTime);

        // Get organizer name and attendees count safely
        const organizerName =
          result.meeting.organizer?.emailAddress?.name || 'You';
        const attendeesCount = result.meeting.attendees?.length || 1;

        // Create a new meeting object based on the response
        const newMeeting: Meeting = {
          id: result.meeting.id || 'temp-id-' + Date.now(),
          title: result.meeting.title || 'Ad-hoc Meeting',
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          organizer: organizerName,
          attendees: attendeesCount,
        };

        // Create updated roomInfo with new meeting and updated status
        const updatedRoomInfo = {
          ...roomInfo,
          availabilityStatus: 'busy' as const,
          currentMeeting: newMeeting,
          upcomingMeetings: [newMeeting, ...roomInfo.upcomingMeetings],
        };

        // Update the state
        setRoomInfo(updatedRoomInfo);
      }

      // After 3 seconds, refresh the room info but preserve the meeting time
      setTimeout(() => {
        // Clear booking status
        setBookingStatus(null);

        // Refresh room info to get latest data from server
        refreshRoomInfo().then(() => {
          // If we just booked a meeting, make sure it's shown with correct times
          if (roomInfo && result.meeting && result.meeting.id) {
            setRoomInfo((prevRoomInfo) => {
              if (!prevRoomInfo) return prevRoomInfo;

              // Find our newly booked meeting in the updated list
              const justBookedMeeting = prevRoomInfo.upcomingMeetings.find(
                (meeting) => meeting.id === result.meeting?.id
              );

              // Create a new meeting object with the original booking details
              const amsterdamNow = getAmsterdamTime();
              const formattedStartTime = formatTimeInDutchFormat(amsterdamNow);
              const endTime = calculateEndTime(duration);
              const formattedEndTime = formatTimeInDutchFormat(endTime);

              const updatedMeeting: Meeting = {
                id: result.meeting?.id || 'temp-id-' + Date.now(),
                title: result.meeting?.title || 'Ad-hoc Meeting',
                startTime: formattedStartTime,
                endTime: formattedEndTime,
                organizer:
                  result.meeting?.organizer?.emailAddress?.name || 'You',
                attendees: result.meeting?.attendees?.length || 1,
              };

              // Ensure the meeting exists in the upcoming meetings list
              let updatedMeetings = [...prevRoomInfo.upcomingMeetings];
              if (justBookedMeeting) {
                // Update existing meeting
                updatedMeetings = updatedMeetings.map((meeting) =>
                  meeting.id === result.meeting?.id ? updatedMeeting : meeting
                );
              } else {
                // Add it if not present
                updatedMeetings = [updatedMeeting, ...updatedMeetings];
              }

              // Return updated roomInfo with consistent meeting information
              return {
                ...prevRoomInfo,
                availabilityStatus: 'busy' as const,
                currentMeeting: updatedMeeting,
                upcomingMeetings: updatedMeetings,
              };
            });
          }
        });
      }, 3000);
    } catch (e: unknown) {
      const err = e as Error;
      console.error('Error booking room:', err);
      setBookingStatus({
        message: `Error: ${err.message || String(err)}`,
        isError: true,
      });
    }
  };

  // Function to request admin consent
  const requestAdminConsent = async () => {
    try {
      const redirectUrl = window.location.href;
      const adminConsentUrl = ExchangeAPI.getAuthUrl(true);
      window.location.href = `${adminConsentUrl}&redirect_url=${encodeURIComponent(
        redirectUrl
      )}`;
    } catch (e: unknown) {
      const err = e as Error;
      setError(
        `Failed to request admin consent: ${err.message || String(err)}`
      );
    }
  };

  // Handle time info click (can be used for refreshing)
  const handleTimeInfoClick = () => {
    refreshRoomInfo();
  };

  // Render dashboard based on current state
  if (isLoading && !roomInfo) {
    return <Loading />;
  }

  if (error) {
    return <Error message={error} onRetry={requestAdminConsent} />;
  }

  // Create displayRoomInfo for RoomHeader
  const displayRoomInfo = roomInfo || {
    roomName: 'No Room Selected',
    currentTime: getCurrentAmsterdamTimeFormatted(),
    currentDate: formatDateForDisplay(getAmsterdamTime()),
    availabilityStatus: 'available' as const,
    upcomingMeetings: [],
  };

  return (
    <DashboardContainer $isDark={isDark}>
      <RoomHeader
        rooms={rooms}
        roomId={roomId}
        displayRoomInfo={displayRoomInfo}
        onRoomChange={handleRoomChange}
        onTimeInfoClick={handleTimeInfoClick}
      />

      <ContentWrapper>
        <BookingControlPanel roomInfo={roomInfo} onBookNow={handleBookNow} />

        <SchedulePanel $isDark={isDark}>
          <MeetingsListComponent roomInfo={roomInfo} />
        </SchedulePanel>
      </ContentWrapper>

      {bookingStatus && (
        <BookingStatusNotification
          message={bookingStatus.message}
          isError={bookingStatus.isError}
          onClose={() => setBookingStatus(null)}
        />
      )}
    </DashboardContainer>
  );
};

export default BookingDashboard;
