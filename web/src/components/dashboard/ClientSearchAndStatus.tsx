import { useEffect, useState } from 'react'; // Import useEffect and useState
import styled from 'styled-components'; // Import styled-components
import { deviceApi } from '../../utils/api/devices';

export const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  background: white;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  width: 100%;
  box-sizing: border-box;
`;

export const Stats = styled.div`
  display: flex;
  gap: 2rem;
  padding-right: 2rem;
  border-right: 1px solid #e1e1e1;
`;

export const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  span:first-child {
    font-size: 0.9rem;
    color: #64748b;
  }

  span:last-child {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
  }
`;

export const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem 1.5rem;
  font-size: 0.95rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #0cbab1;
    box-shadow: 0 0 0 2px rgba(12, 186, 177, 0.2);
  }

  &::placeholder {
    color: #94a3b8;
  }
`;

export const SystemStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-left: 2rem;
  border-left: 1px solid #e1e1e1;

  span {
    color: #64748b;
    font-size: 0.95rem;
  }
`;

export const StatusDot = styled.span<{ status?: 'online' | 'offline' }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${(props) =>
    props.status === 'offline' ? '#ef4444' : '#22c55e'};
  box-shadow: 0 0 0 4px
    ${(props) =>
      props.status === 'offline'
        ? 'rgba(239, 68, 68, 0.2)'
        : 'rgba(34, 197, 94, 0.2)'};
`;

interface ClientSearchAndStatusProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ClientSearchAndStatus: React.FC<ClientSearchAndStatusProps> = ({
  searchQuery,
  setSearchQuery,
}) => {
  const [connectedCount, setConnectedCount] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await deviceApi.getDevices();
        const devices = response?.data || [];
        const connected = devices.filter(
          (d: any) => d.status === 'connected'
        ).length;
        setConnectedCount(connected);
        setError(false);
      } catch (error) {
        console.error('Failed to fetch devices:', error);
        setError(true);
        setConnectedCount(0);
      }
    };
    fetchDevices();
  }, []);

  return (
    <Container>
      <Stats>
        <Stat>
          <span>Connected Devices</span>
          <span>{error ? '?' : connectedCount}</span>
        </Stat>
      </Stats>
      <SearchInput
        type="text"
        placeholder="Search clients"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <SystemStatus>
        <span>System status:</span>
        <StatusDot status={error ? 'offline' : 'online'}></StatusDot>
      </SystemStatus>
    </Container>
  );
};

export default ClientSearchAndStatus;
