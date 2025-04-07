import styled from "styled-components";

export const Card = styled.div<{ type: string }>`
  background: white;
  border-radius: 12px;
  padding: 1.8rem;
  margin-bottom: 1.2rem;
  border: 1px solid #eee;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) => {
      switch (props.type) {
        case "critical":
          return "#EF4444";
        case "warning":
          return "#F59E0B";
        case "info":
          return "#3B82F6";
        case "admin":
          return "#0CBAB1";
        case "manager":
          return "#2563EB";
        default:
          return "#0CBAB1";
      }
    }};
  }
`;

export const CardInfo = styled.div`
  flex: 1;
`;

export const StatusTag = styled.span<{ type: string }>`
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  background: ${(props) => {
    switch (props.type) {
      case "critical":
        return "#FEE2E2";
      case "warning":
        return "#FEF3C7";
      case "info":
        return "#DBEAFE";
      case "admin":
        return "#E7F7F6";
      case "manager":
        return "#DBEAFE";
      default:
        return "#F3F4F6";
    }
  }};
  color: ${(props) => {
    switch (props.type) {
      case "critical":
        return "#DC2626";
      case "warning":
        return "#D97706";
      case "info":
        return "#2563EB";
      case "admin":
        return "#0CBAB1";
      case "manager":
        return "#2563EB";
      default:
        return "#6B7280";
    }
  }};
  display: inline-block;
`;

export const Message = styled.p`
  color: #4a5568;
  margin: 0.5rem 0;
  font-size: 1rem;
`;

export const MetaInfo = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  display: flex;
  gap: 1rem;
`;

export const ActionButton = styled.button`
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  border: 2px solid #0cbab1;
  background: white;
  color: #0cbab1;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;

  &:hover {
    background: #0cbab1;
    color: white;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(12, 186, 177, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
`;