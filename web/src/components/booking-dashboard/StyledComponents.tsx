import styled from "styled-components";

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
    props.$isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.9)"};
  border: 1px solid
    ${(props) =>
      props.$isDark ? "rgba(51, 65, 85, 0.8)" : "rgba(226, 232, 240, 0.8)"};
  box-shadow: ${(props) =>
    props.$isDark
      ? "0 4px 15px rgba(0, 0, 0, 0.3)"
      : "0 4px 15px rgba(148, 163, 184, 0.15)"};
  backdrop-filter: blur(8px);
  flex-wrap: wrap;
  gap: 16px;
  transition: all 0.3s ease;
`;

export const RoomInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const RoomSelector = styled.select<{ $isDark: boolean }>`
  background: ${(props) => (props.$isDark ? "#334155" : "#f1f5f9")};
  border: 1px solid ${(props) => (props.$isDark ? "#475569" : "#e2e8f0")};
  border-radius: 12px;
  color: ${(props) => (props.$isDark ? "#f8fafc" : "#334155")};
  padding: 12px 18px;
  margin-bottom: 12px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) => (props.$isDark ? "#475569" : "#dbeafe")};
    border-color: ${(props) => (props.$isDark ? "#64748b" : "#93c5fd")};
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
  }

  option {
    background: ${(props) => (props.$isDark ? "#1e293b" : "#ffffff")};
    font-size: 16px;
  }
`;

export const RoomName = styled.h1<{ $isDark: boolean }>`
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
  background: ${(props) =>
    props.$isDark
      ? "linear-gradient(90deg, #60a5fa 0%, #93c5fd 100%)"
      : "linear-gradient(90deg, #1e40af 0%, #3b82f6 100%)"};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: all 0.3s ease;
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
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(37, 99, 235, 0.4);
  }

  &::after {
    content: ${(props) => (props.$isDark ? '"🌙"' : '"☀️"')};
    position: absolute;
    top: -8px;
    right: -8px;
    background: ${(props) => (props.$isDark ? "#0f172a" : "#ffffff")};
    border: 2px solid #3b82f6;
    border-radius: 50%;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
    }
    70% {
      box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
  }
`;

// Main dashboard components
export const DashboardContainer = styled.div<{ $isDark: boolean }>`
  display: flex;
  flex-direction: column;
  background: ${(props) =>
    props.$isDark
      ? "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)"
      : "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)"};
  color: ${(props) => (props.$isDark ? "#e2e8f0" : "#1e293b")};
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  padding: 20px;
  position: relative;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
  transition: background 0.3s ease;
`;

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

// Control panel components
export const ControlPanel = styled.div<{ $isDark: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: ${(props) =>
    props.$isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.9)"};
  border-radius: 20px;
  padding: 24px;
  border: 1px solid
    ${(props) =>
      props.$isDark ? "rgba(51, 65, 85, 0.8)" : "rgba(226, 232, 240, 0.8)"};
  box-shadow: ${(props) =>
    props.$isDark
      ? "0 8px 20px rgba(0, 0, 0, 0.3)"
      : "0 8px 20px rgba(148, 163, 184, 0.15)"};
  transition: all 0.3s ease;
  overflow-y: auto;
  backdrop-filter: blur(8px);

  @media (min-width: 768px) {
    width: 40%;
  }

  &:hover {
    box-shadow: ${(props) =>
      props.$isDark
        ? "0 10px 25px rgba(0, 0, 0, 0.4)"
        : "0 10px 25px rgba(148, 163, 184, 0.25)"};
    border-color: ${(props) =>
      props.$isDark ? "rgba(100, 116, 139, 0.6)" : "rgba(191, 219, 254, 0.6)"};
  }
`;

export const SchedulePanel = styled.div<{ $isDark: boolean }>`
  width: 100%;
  background: ${(props) =>
    props.$isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.9)"};
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  border: 1px solid
    ${(props) =>
      props.$isDark ? "rgba(51, 65, 85, 0.8)" : "rgba(226, 232, 240, 0.8)"};
  box-shadow: ${(props) =>
    props.$isDark
      ? "0 8px 20px rgba(0, 0, 0, 0.3)"
      : "0 8px 20px rgba(148, 163, 184, 0.15)"};
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
        ? "0 10px 25px rgba(0, 0, 0, 0.4)"
        : "0 10px 25px rgba(148, 163, 184, 0.25)"};
    border-color: ${(props) =>
      props.$isDark ? "rgba(100, 116, 139, 0.6)" : "rgba(191, 219, 254, 0.6)"};
  }
`;

export const StatusIndicator = styled.div<{
  status: "available" | "busy" | "reserved";
  $isDark?: boolean;
}>`
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 700;
  color: ${(props) =>
    props.status === "available"
      ? props.$isDark
        ? "#34d399"
        : "#10b981"
      : props.status === "busy"
      ? props.$isDark
        ? "#f87171"
        : "#ef4444"
      : props.$isDark
      ? "#fbbf24"
      : "#f59e0b"};
  margin-bottom: 18px;
  letter-spacing: 0.5px;
  text-transform: uppercase;

  &::before {
    content: "";
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: ${(props) =>
      props.status === "available"
        ? props.$isDark
          ? "#34d399"
          : "#10b981"
        : props.status === "busy"
        ? props.$isDark
          ? "#f87171"
          : "#ef4444"
        : props.$isDark
        ? "#fbbf24"
        : "#f59e0b"};
    margin-right: 12px;
    box-shadow: 0 0 0 4px
      ${(props) =>
        props.status === "available"
          ? props.$isDark
            ? "rgba(52, 211, 153, 0.15)"
            : "rgba(16, 185, 129, 0.15)"
          : props.status === "busy"
          ? props.$isDark
            ? "rgba(248, 113, 113, 0.15)"
            : "rgba(239, 68, 68, 0.15)"
          : props.$isDark
          ? "rgba(251, 191, 36, 0.15)"
          : "rgba(245, 158, 11, 0.15)"};
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0
        ${(props) =>
          props.status === "available"
            ? props.$isDark
              ? "rgba(52, 211, 153, 0.5)"
              : "rgba(16, 185, 129, 0.5)"
            : props.status === "busy"
            ? props.$isDark
              ? "rgba(248, 113, 113, 0.5)"
              : "rgba(239, 68, 68, 0.5)"
            : props.$isDark
            ? "rgba(251, 191, 36, 0.5)"
            : "rgba(245, 158, 11, 0.5)"};
    }
    70% {
      box-shadow: 0 0 0 8px
        ${(props) =>
          props.status === "available"
            ? props.$isDark
              ? "rgba(52, 211, 153, 0)"
              : "rgba(16, 185, 129, 0)"
            : props.status === "busy"
            ? props.$isDark
              ? "rgba(248, 113, 113, 0)"
              : "rgba(239, 68, 68, 0)"
            : props.$isDark
            ? "rgba(251, 191, 36, 0)"
            : "rgba(245, 158, 11, 0)"};
    }
    100% {
      box-shadow: 0 0 0 0
        ${(props) =>
          props.status === "available"
            ? props.$isDark
              ? "rgba(52, 211, 153, 0)"
              : "rgba(16, 185, 129, 0)"
            : props.status === "busy"
            ? props.$isDark
              ? "rgba(248, 113, 113, 0)"
              : "rgba(239, 68, 68, 0)"
            : props.$isDark
            ? "rgba(251, 191, 36, 0)"
            : "rgba(245, 158, 11, 0)"};
    }
  }
`;

export const AvailabilityInfo = styled.div<{ $isDark: boolean }>`
  font-size: 18px;
  color: ${(props) => (props.$isDark ? "#cbd5e1" : "#64748b")};
  margin-bottom: 18px;
  padding: 16px;
  background: ${(props) => (props.$isDark ? "#1e293b" : "#f0f9ff")};
  border-radius: 16px;
  border-left: 4px solid ${(props) => (props.$isDark ? "#60a5fa" : "#93c5fd")};
  transition: all 0.3s ease;
`;

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

// Loading and error components
export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  background: #f8fafc;
  color: #0f172a;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;

  &::after {
    content: "...";
    animation: loadingDots 1.5s infinite;
    width: 24px;
    display: inline-block;
    text-align: left;
  }

  @keyframes loadingDots {
    0% {
      content: ".";
    }
    33% {
      content: "..";
    }
    66% {
      content: "...";
    }
    100% {
      content: ".";
    }
  }
`;

export const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  background: #f8fafc;
  color: #ef4444;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
  flex-direction: column;
  gap: 16px;
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

export const NotificationContainer = styled.div<{ $isError: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: ${(props) => (props.$isError ? "#fee2e2" : "#dcfce7")};
  color: ${(props) => (props.$isError ? "#b91c1c" : "#166534")};
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 8px;
`;
