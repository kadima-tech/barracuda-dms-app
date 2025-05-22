import { useEffect, useState } from 'react';
import { deviceApi } from '../../utils/api/devices';
import {
  Container,
  Stats,
  Stat,
  SystemStatus,
  StatusDot,
  SearchInput,
} from '../dashboard/ClientSearchAndStatus';

interface DeviceSearchAndStatusProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const DeviceSearchAndStatus = ({
  searchQuery,
  setSearchQuery,
}: DeviceSearchAndStatusProps) => {
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
        placeholder="Search devices by ID or status..."
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

export default DeviceSearchAndStatus;
