import React, { useState } from 'react';
import { RoomInfo } from './types';
import { useTheme } from './ThemeContext';
import { getRoomStatusMessage } from './utils';
import {
  ControlPanel,
  StatusIndicator,
  AvailabilityInfo,
  ActionButtonsContainer,
  BookNowSection,
  BookNowHeader,
  DurationLabel,
  DurationControl,
  DurationButton,
  DurationDisplay,
  BookNowButton,
} from './StyledComponents';

interface BookingControlPanelProps {
  roomInfo: RoomInfo | null;
  onBookNow: (duration: number) => Promise<void>;
}

const BookingControlPanel: React.FC<BookingControlPanelProps> = ({
  roomInfo,
  onBookNow,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [meetingDuration, setMeetingDuration] = useState<number>(30);
  const [isBooking, setIsBooking] = useState<boolean>(false);

  const handleDecreaseDuration = () => {
    setMeetingDuration((prev) => Math.max(prev - 15, 15)); // Decrease by 15 minutes, min 15
  };

  const handleIncreaseDuration = () => {
    setMeetingDuration((prev) => Math.min(prev + 15, 120)); // Increase by 15 minutes, max 120
  };

  const handleBookNowClick = async () => {
    setIsBooking(true);
    try {
      await onBookNow(meetingDuration);
    } finally {
      setIsBooking(false);
    }
  };

  const roomStatusMessage = getRoomStatusMessage(roomInfo);

  return (
    <ControlPanel $isDark={isDark}>
      <StatusIndicator
        status={roomInfo?.availabilityStatus || 'available'}
        $isDark={isDark}
      >
        {!roomInfo
          ? 'SELECT A ROOM'
          : roomInfo.availabilityStatus === 'busy'
          ? 'BUSY'
          : 'AVAILABLE'}
      </StatusIndicator>

      {!roomInfo && (
        <AvailabilityInfo $isDark={isDark}>
          Please select a room from the dropdown above to view availability and
          booking options
        </AvailabilityInfo>
      )}

      {roomInfo && (
        <AvailabilityInfo $isDark={isDark}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div
              style={{
                color:
                  roomStatusMessage.status === 'busy'
                    ? isDark
                      ? '#f87171'
                      : '#ef4444'
                    : isDark
                    ? '#34d399'
                    : '#10b981',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.95em',
              }}
            >
              {roomStatusMessage.title}
            </div>
            <div
              style={{
                fontSize: '0.85em',
                color: isDark ? '#94a3b8' : '#6b7280',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {roomStatusMessage.message}
            </div>
          </div>
        </AvailabilityInfo>
      )}

      <ActionButtonsContainer>
        <BookNowSection>
          <BookNowHeader>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="#10b981"
            >
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
            </svg>
            Quick Booking
          </BookNowHeader>

          <DurationLabel>How long do you need the room?</DurationLabel>
          <DurationControl>
            <DurationButton onClick={handleDecreaseDuration}>-</DurationButton>
            <DurationDisplay>{meetingDuration} minutes</DurationDisplay>
            <DurationButton onClick={handleIncreaseDuration}>+</DurationButton>
          </DurationControl>

          <BookNowButton
            onClick={handleBookNowClick}
            disabled={roomInfo?.availabilityStatus === 'busy' || isBooking}
            style={{
              opacity:
                roomInfo?.availabilityStatus === 'busy' || isBooking ? 0.5 : 1,
              cursor:
                roomInfo?.availabilityStatus === 'busy' || isBooking
                  ? 'not-allowed'
                  : 'pointer',
              background:
                roomInfo?.availabilityStatus === 'reserved'
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
          >
            {isBooking ? (
              'Booking...'
            ) : roomInfo?.availabilityStatus === 'busy' ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z" />
                </svg>
                Room Not Available
              </>
            ) : roomInfo?.availabilityStatus === 'reserved' ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z" />
                </svg>
                Book Room Now (Limited Time)
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
                Book Room Now
              </>
            )}
          </BookNowButton>
        </BookNowSection>
      </ActionButtonsContainer>
    </ControlPanel>
  );
};

export default BookingControlPanel;
