import React, { useState } from 'react';
import { RoomInfo } from './types';
import { useTheme } from './ThemeContext';
import { parseTime, formatTimeForDisplay } from './utils';
import {
  MeetingsListContainer,
  MeetingItem,
  MeetingTime,
  MeetingTimeText,
  MeetingDetails,
  MeetingTitle,
  MeetingInfo,
  TimelineContainer,
  TimelineLine,
  TimeSlot,
  TimeLabel,
  TimeMarker,
  CurrentTimeIndicator,
} from './StyledComponents';
import styled from 'styled-components';
import { cancelMeeting, cancelMeeting2 } from '../../services/exchange-api';

interface MeetingsListProps {
  roomInfo: RoomInfo | null;
}

// Add a button for canceling meetings
const CancelButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 8px;
  transition: background 0.2s;

  &:hover {
    background: #dc2626;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const MeetingsListComponent: React.FC<MeetingsListProps> = ({ roomInfo }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [cancellingMeetingId, setCancellingMeetingId] = useState<string | null>(
    null
  );

  // If no room info, return nothing
  if (!roomInfo) {
    return null;
  }

  // Determine current time
  const now = new Date();

  // Add this function to handle meeting cancellation
  const handleCancelMeeting = async (meetingId: string, roomId: string) => {
    if (!roomId || !meetingId) {
      console.error('Cannot cancel meeting: Missing roomId or meetingId');
      return;
    }

    console.log(`Attempting to cancel meeting ${meetingId} in room ${roomId}`);
    console.log(`Meeting ID details:`, {
      meetingId,
      length: meetingId.length,
      containsSlash: meetingId.includes('/'),
      containsPlus: meetingId.includes('+'),
      containsEquals: meetingId.includes('='),
    });

    setCancellingMeetingId(meetingId);

    try {
      console.log(`Making API call to cancel meeting...`);

      // Try the alternative method first (POST)
      console.log(`Trying alternative cancel method (POST)...`);
      const result2 = await cancelMeeting2(roomId, meetingId);

      if (result2.success) {
        console.log(`Successfully cancelled meeting using alternative method`);
        window.location.reload();
        return;
      }

      console.log(`Alternative method failed, trying original method...`);

      // Fallback to original method (DELETE)
      const encodedMeetingId = encodeURIComponent(meetingId);
      const encodedRoomId = encodeURIComponent(roomId);
      console.log(`Encoded meeting ID: ${encodedMeetingId}`);

      const result = await cancelMeeting(encodedRoomId, encodedMeetingId);
      console.log(`Cancel meeting API response:`, result);

      if (result.success) {
        console.log(`Successfully cancelled meeting ${meetingId}`);
        // Handle successful cancellation by filtering out the cancelled meeting
        // Let the parent component handle room refresh
        window.location.reload();
      } else {
        console.error(`Failed to cancel meeting: ${result.error}`);
        alert(`Failed to cancel meeting: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error cancelling meeting:`, error);
      alert(
        `Error cancelling meeting: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setCancellingMeetingId(null);
    }
  };

  return (
    <>
      <MeetingsListContainer $isDark={isDark}>
        {roomInfo.upcomingMeetings?.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px',
              color: '#64748b',
              textAlign: 'center',
              padding: '0 20px',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M16 14l-4 4l-4-4"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 10v8"
                stroke="#cbd5e1"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p style={{ marginTop: '16px', fontSize: '16px' }}>
              No meetings scheduled for this room today
            </p>
            <p style={{ fontSize: '14px' }}>
              The room is available for booking
            </p>
          </div>
        )}

        {/* Room meetings status - show but don't require button click */}
        {roomInfo.upcomingMeetings && roomInfo.upcomingMeetings.length > 0 && (
          <div
            style={{
              marginBottom: '16px',
              padding: '10px 16px',
              background: '#f0f9ff',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              border: '1px solid rgba(3, 105, 161, 0.1)',
            }}
          >
            <span
              style={{
                color: '#0369a1',
                fontWeight: '500',
                fontSize: '15px',
              }}
            >
              {roomInfo.upcomingMeetings.length
                ? `${roomInfo.upcomingMeetings.length} meetings found for today`
                : 'No meetings found for this room today'}
            </span>
          </div>
        )}

        {roomInfo.upcomingMeetings?.map((meeting) => {
          // Parse the meeting times using our updated parseTime function
          const startTime = parseTime(meeting.startTime);
          const endTime = parseTime(meeting.endTime);

          const isActive = startTime <= now && endTime > now;
          const isPast = endTime < now;

          // Show both past and current meetings
          return (
            <MeetingItem
              key={meeting.id}
              isActive={isActive}
              $isDark={isDark}
              style={{
                opacity: isActive ? 1 : 0.7,
                background: isActive
                  ? 'var(--active-meeting-bg)'
                  : 'var(--inactive-meeting-bg)',
                borderLeft: `4px solid ${
                  isActive
                    ? 'var(--active-meeting-border)'
                    : 'var(--inactive-meeting-border)'
                }`,
              }}
            >
              <MeetingTime $isDark={isDark}>
                <MeetingTimeText $isDark={isDark}>
                  {formatTimeForDisplay(meeting.startTime)}
                </MeetingTimeText>
                <div
                  style={{
                    height: '1px',
                    background: '#e2e8f0',
                    width: '20px',
                    margin: '4px 0',
                  }}
                ></div>
                <MeetingTimeText $isDark={isDark}>
                  {formatTimeForDisplay(meeting.endTime)}
                </MeetingTimeText>
              </MeetingTime>
              <MeetingDetails $isDark={isDark}>
                <MeetingTitle $isDark={isDark}>
                  {meeting.title}
                  {isActive && (
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        background: '#ef4444',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontWeight: '500',
                      }}
                    >
                      NOW
                    </span>
                  )}
                  {isPast && (
                    <span
                      style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        background: '#9ca3af',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        fontWeight: '500',
                      }}
                    >
                      ENDED
                    </span>
                  )}
                  {!isPast && (
                    <CancelButton
                      onClick={() =>
                        handleCancelMeeting(meeting.id, roomInfo?.id || '')
                      }
                      disabled={
                        cancellingMeetingId === meeting.id || !roomInfo?.id
                      }
                    >
                      {cancellingMeetingId === meeting.id
                        ? 'Cancelling...'
                        : 'Cancel'}
                    </CancelButton>
                  )}
                </MeetingTitle>
                <MeetingInfo $isDark={isDark}>
                  {meeting.organizer && (
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ marginRight: '4px' }}
                      >
                        <path
                          d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
                          fill="#94a3b8"
                        />
                        <path
                          d="M12 14C7.58172 14 4 17.5817 4 22H20C20 17.5817 16.4183 14 12 14Z"
                          fill="#94a3b8"
                        />
                      </svg>
                      {meeting.organizer}
                    </span>
                  )}
                  {meeting.attendees && meeting.organizer && (
                    <span style={{ margin: '0 6px' }}>•</span>
                  )}
                  {meeting.attendees && (
                    <span style={{ display: 'flex', alignItems: 'center' }}>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ marginRight: '4px' }}
                      >
                        <path
                          d="M16 21V19C16 16.7909 14.2091 15 12 15H5C2.79086 15 1 16.7909 1 19V21"
                          stroke="#94a3b8"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z"
                          stroke="#94a3b8"
                          strokeWidth="2"
                        />
                        <path
                          d="M20 21V19C20 16.7909 18.2091 15 16 15H15.5"
                          stroke="#94a3b8"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                        <path
                          d="M17.5 11C19.7091 11 21.5 9.20914 21.5 7C21.5 4.79086 19.7091 3 17.5 3"
                          stroke="#94a3b8"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      {meeting.attendees} attendees
                    </span>
                  )}
                </MeetingInfo>
              </MeetingDetails>
            </MeetingItem>
          );
        })}

        {/* Available time slot after meetings */}
        {roomInfo.upcomingMeetings?.length > 0 &&
          roomInfo.availabilityStatus !== 'busy' && (
            <MeetingItem
              $isDark={isDark}
              style={{
                marginTop: '16px',
                background: '#ecfdf5',
                borderLeft: '4px solid #10b981',
              }}
            >
              <MeetingTime $isDark={isDark}>
                <MeetingTimeText $isDark={isDark}>Now</MeetingTimeText>
                <div
                  style={{
                    height: '1px',
                    background: '#e2e8f0',
                    width: '20px',
                    margin: '4px 0',
                  }}
                ></div>
                <MeetingTimeText $isDark={isDark}>EOD</MeetingTimeText>
              </MeetingTime>
              <MeetingDetails $isDark={isDark}>
                <MeetingTitle
                  $isDark={isDark}
                  style={{
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                      fill="#10b981"
                    />
                  </svg>
                  Available for booking
                </MeetingTitle>
                <MeetingInfo $isDark={isDark} style={{ color: '#10b981' }}>
                  Room is free for the rest of the day
                </MeetingInfo>
              </MeetingDetails>
            </MeetingItem>
          )}
      </MeetingsListContainer>

      <TimelineContainer $isDark={isDark}>
        <TimelineLine $isDark={isDark} />
        {/* Position current time indicator based on business hours (9am-5pm) */}
        {(() => {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();

          // If current time is within business hours (9-17), calculate position
          if (currentHour >= 9 && currentHour <= 17) {
            // Calculate minutes since 9am
            const minutesSince9am = (currentHour - 9) * 60 + currentMinute;
            // Calculate percentage (0-100%) across the 8-hour (480 min) timespan
            const percentageOfDay = (minutesSince9am / 480) * 100;

            return (
              <CurrentTimeIndicator
                $isDark={isDark}
                style={{ left: `${percentageOfDay}%` }}
              />
            );
          }
          // If outside business hours, don't show the indicator
          return null;
        })()}

        {/* Generate timeline slots with consistent 24-hour format */}
        {(() => {
          // Show business hours 9am-5pm (09:00-17:00) on all screen sizes
          const timeSlots = [9, 10, 11, 12, 13, 14, 15, 16, 17];

          // Convert current meetings to an array for processing
          const allMeetings = [
            ...(roomInfo?.upcomingMeetings || []),
            ...(roomInfo?.currentMeeting ? [roomInfo.currentMeeting] : []),
          ];

          return timeSlots.map((hour) => {
            // Check if there are meetings overlapping with this hour
            const hasMeetingAtThisHour = allMeetings.some((meeting) => {
              // Get start and end times for the meeting
              const startTimeParts = meeting.startTime.split(/[:\s]/);
              const endTimeParts = meeting.endTime.split(/[:\s]/);

              let startHour = parseInt(startTimeParts[0]);
              let endHour = parseInt(endTimeParts[0]);

              // Handle 12-hour format with AM/PM if present
              if (startTimeParts.length > 2) {
                const startIsPM = startTimeParts[2]
                  ?.toUpperCase()
                  .includes('PM');
                if (startIsPM && startHour !== 12) {
                  startHour += 12;
                } else if (!startIsPM && startHour === 12) {
                  startHour = 0;
                }
              }

              if (endTimeParts.length > 2) {
                const endIsPM = endTimeParts[2]?.toUpperCase().includes('PM');
                if (endIsPM && endHour !== 12) {
                  endHour += 12;
                } else if (!endIsPM && endHour === 12) {
                  endHour = 0;
                }
              }

              // Also consider minutes to handle partial hour overlaps
              const startMinutes =
                startTimeParts.length > 1 ? parseInt(startTimeParts[1]) : 0;
              const endMinutes =
                endTimeParts.length > 1 ? parseInt(endTimeParts[1]) : 0;

              // Convert to total minutes for easier comparison
              const meetingStartMinutes = startHour * 60 + startMinutes;
              const meetingEndMinutes = endHour * 60 + endMinutes;
              const slotStartMinutes = hour * 60;
              const slotEndMinutes = (hour + 1) * 60;

              // Check if the meeting overlaps with this hour
              const hasOverlap =
                meetingStartMinutes < slotEndMinutes &&
                meetingEndMinutes > slotStartMinutes;

              return hasOverlap;
            });

            // Check if the current time is in this hour
            const now = new Date();
            const currentHour = now.getHours();
            const isCurrentHour = currentHour === hour;

            // Determine marker type based on meetings and current time
            let markerType: 'available' | 'busy' = 'available';

            if (hasMeetingAtThisHour) {
              markerType = 'busy';
            } else if (roomInfo?.availabilityStatus === 'busy') {
              // If room is marked as busy, mark the current and next hour as busy for better visibility
              if (isCurrentHour || hour === currentHour + 1) {
                markerType = 'busy';
              }
            } else if (roomInfo?.currentMeeting) {
              // If there's a current meeting, always mark it as busy
              const meetingStart = parseTime(roomInfo.currentMeeting.startTime);
              const meetingEnd = parseTime(roomInfo.currentMeeting.endTime);
              const hourStart = new Date(now);
              hourStart.setHours(hour, 0, 0, 0);
              const hourEnd = new Date(now);
              hourEnd.setHours(hour + 1, 0, 0, 0);

              // Check for overlap
              if (meetingStart < hourEnd && meetingEnd > hourStart) {
                markerType = 'busy';
              }
            }

            return (
              <TimeSlot key={hour} $isDark={isDark}>
                <TimeMarker $isDark={isDark} type={markerType} />
                <TimeLabel $isDark={isDark}>{`${
                  hour < 10 ? '0' : ''
                }${hour}:00`}</TimeLabel>
              </TimeSlot>
            );
          });
        })()}
      </TimelineContainer>
    </>
  );
};

export default MeetingsListComponent;
