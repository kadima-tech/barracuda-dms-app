import styled from 'styled-components';

// Main container
export const DashboardContainer = styled.div<{ $isDark: boolean }>`
  display: flex;
  flex-direction: column;
  background: ${(props) =>
    props.$isDark
      ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
      : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'};
  color: ${(props) => (props.$isDark ? '#e2e8f0' : '#1e293b')};
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  padding: 20px;
  position: relative;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
  transition: background 0.3s ease;
`;

// Header components
export const Header = styled.div<{ $isDark: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
  padding: 20px;
  border-radius: 20px;
  background: ${(props) =>
    props.$isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
  border: 1px solid
    ${(props) =>
      props.$isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.8)'};
  box-shadow: ${(props) =>
    props.$isDark
      ? '0 4px 15px rgba(0, 0, 0, 0.3)'
      : '0 4px 15px rgba(148, 163, 184, 0.15)'};
  backdrop-filter: blur(8px);
  gap: 24px;
  transition: all 0.3s ease;

  @media (max-width: 1080px) {
    flex-direction: column;
    align-items: stretch;
    gap: 20px;
    padding: 16px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    gap: 16px;
  }
`;

export const RoomInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  max-width: 600px;

  @media (max-width: 1080px) {
    max-width: 100%;
    margin: 10px 0;
  }
`;

export const RoomSelector = styled.select<{ $isDark: boolean }>`
  background: ${(props) => (props.$isDark ? '#334155' : '#f1f5f9')};
  border: 1px solid ${(props) => (props.$isDark ? '#475569' : '#e2e8f0')};
  border-radius: 12px;
  color: ${(props) => (props.$isDark ? '#f8fafc' : '#334155')};
  padding: 12px 18px;
  margin-bottom: 16px;
  font-size: 16px;
  cursor: pointer;
  text-align: center;
  min-width: 260px;
  max-width: 400px;
  transition: all 0.2s ease;

  @media (max-width: 1080px) {
    min-width: 200px;
    max-width: 100%;
    width: 100%;
    margin-bottom: 12px;
  }

  @media (max-width: 480px) {
    padding: 10px 14px;
    font-size: 14px;
  }

  &:hover {
    background: ${(props) => (props.$isDark ? '#475569' : '#dbeafe')};
    border-color: ${(props) => (props.$isDark ? '#64748b' : '#93c5fd')};
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  }

  option {
    background: ${(props) => (props.$isDark ? '#1e293b' : '#ffffff')};
    font-size: 16px;
  }
`;

export const RoomName = styled.h1<{ $isDark: boolean }>`
  font-size: 40px;
  font-weight: 800;
  margin: 0;
  text-align: center;
  letter-spacing: -0.5px;
  background: ${(props) =>
    props.$isDark
      ? 'linear-gradient(90deg, #60a5fa 0%, #93c5fd 100%)'
      : 'linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)'};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: all 0.3s ease;

  @media (max-width: 1080px) {
    font-size: 32px;
  }

  @media (max-width: 480px) {
    font-size: 28px;
  }
`;

export const TimeInfo = styled.div<{ $isDark?: boolean }>`
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  padding: 16px 24px;
  border-radius: 16px;
  border: none;
  box-shadow: 0 6px 12px rgba(37, 99, 235, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  cursor: pointer;
  min-width: 260px;
  text-align: center;
  position: relative;

  @media (max-width: 1080px) {
    min-width: 0;
    width: 100%;
    font-size: 20px;
    padding: 14px 20px;
  }

  @media (max-width: 480px) {
    font-size: 18px;
    padding: 12px 16px;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(37, 99, 235, 0.4);
  }

  &::after {
    content: ${(props) => (props.$isDark ? '"🌙"' : '"☀️"')};
    position: absolute;
    top: -8px;
    right: -8px;
    background: ${(props) => (props.$isDark ? '#0f172a' : '#ffffff')};
    border: 2px solid #3b82f6;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

// Layout components
export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 20px;
  position: relative;
  z-index: 1;
  height: calc(100% - 80px);
  overflow: hidden;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

export const ControlPanel = styled.div<{ $isDark: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: ${(props) =>
    props.$isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
  border-radius: 20px;
  padding: 24px;
  border: 1px solid
    ${(props) =>
      props.$isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.8)'};
  box-shadow: ${(props) =>
    props.$isDark
      ? '0 8px 20px rgba(0, 0, 0, 0.3)'
      : '0 8px 20px rgba(148, 163, 184, 0.15)'};
  transition: all 0.3s ease;
  overflow-y: auto;
  backdrop-filter: blur(8px);

  @media (min-width: 768px) {
    width: 40%;
  }

  &:hover {
    box-shadow: ${(props) =>
      props.$isDark
        ? '0 10px 25px rgba(0, 0, 0, 0.4)'
        : '0 10px 25px rgba(148, 163, 184, 0.25)'};
    border-color: ${(props) =>
      props.$isDark ? 'rgba(100, 116, 139, 0.6)' : 'rgba(191, 219, 254, 0.6)'};
  }
`;

export const SchedulePanel = styled.div<{ $isDark: boolean }>`
  width: 100%;
  background: ${(props) =>
    props.$isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)'};
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  border: 1px solid
    ${(props) =>
      props.$isDark ? 'rgba(51, 65, 85, 0.8)' : 'rgba(226, 232, 240, 0.8)'};
  box-shadow: ${(props) =>
    props.$isDark
      ? '0 8px 20px rgba(0, 0, 0, 0.3)'
      : '0 8px 20px rgba(148, 163, 184, 0.15)'};
  transition: all 0.3s ease;
  overflow: hidden;
  margin-bottom: 20px;
  backdrop-filter: blur(8px);

  @media (min-width: 768px) {
    width: 60%;
    margin-bottom: 0;
  }

  &:hover {
    box-shadow: ${(props) =>
      props.$isDark
        ? '0 10px 25px rgba(0, 0, 0, 0.4)'
        : '0 10px 25px rgba(148, 163, 184, 0.25)'};
    border-color: ${(props) =>
      props.$isDark ? 'rgba(100, 116, 139, 0.6)' : 'rgba(191, 219, 254, 0.6)'};
  }
`;

// Status indicators
export const StatusIndicator = styled.div<{
  status: 'available' | 'busy' | 'reserved';
  $isDark?: boolean;
}>`
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 700;
  color: ${(props) =>
    props.status === 'available'
      ? props.$isDark
        ? '#34d399'
        : '#10b981'
      : props.status === 'busy'
      ? props.$isDark
        ? '#f87171'
        : '#ef4444'
      : props.$isDark
      ? '#fbbf24'
      : '#f59e0b'};
  margin-bottom: 18px;
  letter-spacing: 0.5px;
  text-transform: uppercase;

  &::before {
    content: '';
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: ${(props) =>
      props.status === 'available'
        ? props.$isDark
          ? '#34d399'
          : '#10b981'
        : props.status === 'busy'
        ? props.$isDark
          ? '#f87171'
          : '#ef4444'
        : props.$isDark
        ? '#fbbf24'
        : '#f59e0b'};
    margin-right: 12px;
    box-shadow: 0 0 0 4px
      ${(props) =>
        props.status === 'available'
          ? props.$isDark
            ? 'rgba(52, 211, 153, 0.15)'
            : 'rgba(16, 185, 129, 0.15)'
          : props.status === 'busy'
          ? props.$isDark
            ? 'rgba(248, 113, 113, 0.15)'
            : 'rgba(239, 68, 68, 0.15)'
          : props.$isDark
          ? 'rgba(251, 191, 36, 0.15)'
          : 'rgba(245, 158, 11, 0.15)'};
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0
        ${(props) =>
          props.status === 'available'
            ? props.$isDark
              ? 'rgba(52, 211, 153, 0.5)'
              : 'rgba(16, 185, 129, 0.5)'
            : props.status === 'busy'
            ? props.$isDark
              ? 'rgba(248, 113, 113, 0.5)'
              : 'rgba(239, 68, 68, 0.5)'
            : props.$isDark
            ? 'rgba(251, 191, 36, 0.5)'
            : 'rgba(245, 158, 11, 0.5)'};
    }
    70% {
      box-shadow: 0 0 0 8px
        ${(props) =>
          props.status === 'available'
            ? props.$isDark
              ? 'rgba(52, 211, 153, 0)'
              : 'rgba(16, 185, 129, 0)'
            : props.status === 'busy'
            ? props.$isDark
              ? 'rgba(248, 113, 113, 0)'
              : 'rgba(239, 68, 68, 0)'
            : props.$isDark
            ? 'rgba(251, 191, 36, 0)'
            : 'rgba(245, 158, 11, 0)'};
    }
    100% {
      box-shadow: 0 0 0 0
        ${(props) =>
          props.status === 'available'
            ? props.$isDark
              ? 'rgba(52, 211, 153, 0)'
              : 'rgba(16, 185, 129, 0)'
            : props.status === 'busy'
            ? props.$isDark
              ? 'rgba(248, 113, 113, 0)'
              : 'rgba(239, 68, 68, 0)'
            : props.$isDark
            ? 'rgba(251, 191, 36, 0)'
            : 'rgba(245, 158, 11, 0)'};
    }
  }
`;

export const AvailabilityInfo = styled.div<{ $isDark: boolean }>`
  font-size: 16px;
  color: ${(props) => (props.$isDark ? '#cbd5e1' : '#64748b')};
  margin-bottom: 12px;
  padding: 12px;
  background: ${(props) => (props.$isDark ? '#1e293b' : '#f0f9ff')};
  border-radius: 12px;
  border-left: 4px solid ${(props) => (props.$isDark ? '#60a5fa' : '#93c5fd')};
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 10px;
  }

  @media (max-width: 480px) {
    font-size: 13px;
    padding: 8px;
    margin-bottom: 8px;
  }
`;

// Booking components
export const ActionButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 12px;
`;

export const BookNowSection = styled.div`
  background: #f0fdf4;
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.08);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 10px 24px rgba(16, 185, 129, 0.15);
    transform: translateY(-2px);
    border-color: rgba(16, 185, 129, 0.4);
  }
`;

export const BookNowHeader = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #10b981;
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const DurationLabel = styled.div`
  font-size: 18px;
  color: #4b5563;
  font-weight: 600;
  margin-bottom: 8px;
`;

export const DurationControl = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 1.25rem;
`;

export const DurationButton = styled.button`
  background: #e2e8f0;
  border: none;
  border-radius: 12px;
  color: #334155;
  width: 52px;
  height: 52px;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background: #cbd5e1;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(1px);
  }
`;

export const DurationDisplay = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #334155;
  font-size: 18px;
  font-weight: 600;
  padding: 14px 22px;
  min-width: 90px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
`;

export const BookNowButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 16px;
  padding: 18px;
  color: white;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 6px 12px rgba(16, 185, 129, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.25);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.2);
  }
`;

// Meeting list components
export const MeetingsList = styled.div<{ $isDark?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
  overflow-y: auto;
  padding-right: 12px;
  transition: all 0.3s ease;
  background: ${(props) => (props.$isDark ? 'transparent' : 'transparent')};
  color: ${(props) => (props.$isDark ? '#e2e8f0' : 'inherit')};

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${(props) => (props.$isDark ? '#1e293b' : '#f1f5f9')};
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => (props.$isDark ? '#475569' : '#cbd5e1')};
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${(props) => (props.$isDark ? '#64748b' : '#94a3b8')};
  }
`;

export const MeetingItem = styled.div<{
  isActive?: boolean;
  $isDark?: boolean;
}>`
  display: flex;
  padding: 16px;
  border-radius: 16px;
  background: ${(props) => {
    if (props.$isDark) {
      return props.isActive ? '#1e40af30' : '#0f172a30';
    } else {
      return props.isActive ? '#eff6ff' : '#f8fafc';
    }
  }};
  border-left: 4px solid
    ${(props) => {
      if (props.$isDark) {
        return props.isActive ? '#3b82f6' : '#334155';
      } else {
        return props.isActive ? '#3b82f6' : '#e2e8f0';
      }
    }};
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px
    rgba(0, 0, 0, ${(props) => (props.$isDark ? '0.2' : '0.05')});

  &:hover {
    transform: translateX(2px) translateY(-2px);
    box-shadow: 0 6px 12px
      rgba(0, 0, 0, ${(props) => (props.$isDark ? '0.3' : '0.08')});
    border-left-color: ${(props) => {
      if (props.$isDark) {
        return props.isActive ? '#3b82f6' : '#60a5fa';
      } else {
        return props.isActive ? '#3b82f6' : '#93c5fd';
      }
    }};
  }
`;

export const MeetingTime = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-right: 16px;
  border-right: 1px solid #e2e8f0;
  min-width: 70px;
`;

export const MeetingTimeText = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #475569;
`;

export const MeetingDetails = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 20px;
  flex: 1;
`;

export const MeetingTitle = styled.div`
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
`;

export const MeetingInfo = styled.div`
  font-size: 16px;
  color: #64748b;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: '👤';
    font-size: 14px;
  }
`;

// Timeline components
export const TimelineContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 28px;
  padding: 20px 0;
  position: relative;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow-x: auto;
  justify-content: space-between;

  @media (max-width: 768px) {
    margin-top: 20px;
    padding: 15px 0;
    border-radius: 12px;
    min-width: 0;
    width: 100%;
  }

  @media (max-width: 480px) {
    margin-top: 15px;
    padding: 10px 0;
    border-radius: 10px;
    overflow-x: hidden;
  }
`;

export const TimeSlot = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 50px;

  @media (max-width: 1200px) {
    min-width: 45px;
  }

  @media (max-width: 768px) {
    min-width: 35px;
    flex: none;
  }

  @media (max-width: 480px) {
    min-width: 30px;
  }
`;

export const TimeLabel = styled.div`
  font-size: 14px;
  color: #64748b;
  margin-top: 14px;
  font-weight: 500;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 12px;
    margin-top: 10px;
  }

  @media (max-width: 480px) {
    font-size: 11px;
    margin-top: 8px;
  }
`;

export const TimelineLine = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 4px;
  background: #e2e8f0;
  z-index: 0;
`;

export const TimeMarker = styled.div<{ type: 'available' | 'busy' }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${(props) =>
    props.type === 'available' ? '#10b981' : '#ef4444'};
  position: relative;
  z-index: 1;
  box-shadow: 0 0 0 5px
    ${(props) =>
      props.type === 'available'
        ? 'rgba(16, 185, 129, 0.2)'
        : 'rgba(239, 68, 68, 0.2)'};
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.3);
    box-shadow: 0 0 0 7px
      ${(props) =>
        props.type === 'available'
          ? 'rgba(16, 185, 129, 0.3)'
          : 'rgba(239, 68, 68, 0.3)'};
  }

  @media (max-width: 768px) {
    width: 16px;
    height: 16px;
    box-shadow: 0 0 0 4px
      ${(props) =>
        props.type === 'available'
          ? 'rgba(16, 185, 129, 0.2)'
          : 'rgba(239, 68, 68, 0.2)'};
  }

  @media (max-width: 480px) {
    width: 12px;
    height: 12px;
    box-shadow: 0 0 0 3px
      ${(props) =>
        props.type === 'available'
          ? 'rgba(16, 185, 129, 0.2)'
          : 'rgba(239, 68, 68, 0.2)'};
  }
`;

export const CurrentTimeIndicator = styled.div`
  position: absolute;
  top: 0;
  width: 4px;
  height: 100%;
  background: #3b82f6;
  z-index: 2;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);

  &::after {
    content: '';
    position: absolute;
    top: -7px;
    left: -6px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
  }

  @media (max-width: 768px) {
    width: 3px;
    box-shadow: 0 0 6px rgba(59, 130, 246, 0.4);

    &::after {
      width: 14px;
      height: 14px;
      top: -6px;
      left: -5px;
    }
  }

  @media (max-width: 480px) {
    width: 2px;
    box-shadow: 0 0 4px rgba(59, 130, 246, 0.4);

    &::after {
      width: 10px;
      height: 10px;
      top: -5px;
      left: -4px;
    }
  }
`;

// Loading and error components
export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: #f8fafc;
  color: #0f172a;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;

  &::after {
    content: '...';
    animation: loadingDots 1.5s infinite;
    width: 24px;
    display: inline-block;
    text-align: left;
  }

  @keyframes loadingDots {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
    100% {
      content: '.';
    }
  }
`;

export const ErrorContainer = styled(LoadingContainer)`
  color: #ef4444;
  flex-direction: column;
  gap: 16px;

  &::after {
    content: none;
  }
`;

export const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  animation: shake 0.5s ease-in-out;

  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    20%,
    60% {
      transform: translateX(-10px);
    }
    40%,
    80% {
      transform: translateX(10px);
    }
  }
`;

// Theme toggle components
export const ThemeToggleContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const ToggleLabel = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 30px;
`;

export const ToggleInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: #3b82f6;
  }

  &:checked + span:before {
    transform: translateX(30px);
  }
`;

export const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: 0.4s;
  border-radius: 34px;

  &:before {
    position: absolute;
    content: '';
    height: 22px;
    width: 22px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;
