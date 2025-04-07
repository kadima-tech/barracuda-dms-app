import React from "react";
import {
  LoadingContainer,
  ErrorContainer,
  ErrorIcon,
} from "./StyledComponents.ts";

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({
  message = "Loading room information",
}) => {
  return (
    <LoadingContainer>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div style={{ width: "60px", height: "60px" }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: "100%", height: "100%" }}
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="#3b82f6"
              strokeWidth="2"
              opacity="0.3"
            />
            <path
              d="M12 2C6.48 2 2 6.48 2 12"
              stroke="#3b82f6"
              strokeWidth="2"
              strokeLinecap="round"
              style={{
                transformOrigin: "center",
                animation: "spin 1s linear infinite",
              }}
            />
          </svg>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
        <span>{message}</span>
      </div>
    </LoadingContainer>
  );
};

interface ErrorProps {
  message: string;
  onRetry?: () => void;
}

export const Error: React.FC<ErrorProps> = ({ message, onRetry }) => {
  return (
    <ErrorContainer>
      <ErrorIcon>⚠️</ErrorIcon>
      <div>{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "12px 16px",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "16px",
            boxShadow: "0 4px 6px rgba(59, 130, 246, 0.25)",
          }}
        >
          Request Admin Consent
        </button>
      )}
    </ErrorContainer>
  );
};

interface BookingStatusNotificationProps {
  message: string;
  isError: boolean;
  onClose?: () => void;
}

export const BookingStatusNotification: React.FC<
  BookingStatusNotificationProps
> = ({ message, isError, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        backgroundColor: isError ? "#fee2e2" : "#dcfce7",
        color: isError ? "#b91c1c" : "#166534",
        padding: "12px 20px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {isError ? (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="#b91c1c"
            strokeWidth="2"
          />
          <path
            d="M15 9L9 15"
            stroke="#b91c1c"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M9 9L15 15"
            stroke="#b91c1c"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
            stroke="#166534"
            strokeWidth="2"
          />
          <path
            d="M8 12L11 15L16 9"
            stroke="#166534"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {message}

      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            marginLeft: "8px",
            padding: "0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18"
              stroke={isError ? "#b91c1c" : "#166534"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 6L18 18"
              stroke={isError ? "#b91c1c" : "#166534"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
