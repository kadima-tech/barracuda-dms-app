import { useEffect, useState } from "react";
import { deviceApi } from "../../utils/api/devices";
import {
  Container,
  Stats,
  Stat,
  SearchInput,
  SystemStatus,
  StatusDot,
} from "../dashboard/ClientSearchAndStatus";

interface DeviceSearchAndStatusProps {
  onSearch?: (searchTerm: string) => void;
}

const DeviceSearchAndStatus = ({ onSearch }: DeviceSearchAndStatusProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [connectedCount, setConnectedCount] = useState(0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await deviceApi.getDevices();
        const devices = response;
        setConnectedCount(devices?.length || 0);
        setError(false);
      } catch (error) {
        console.error("Failed to fetch devices:", error);
        setError(true);
        setConnectedCount(0);
      }
    };
    fetchDevices();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  };

  return (
    <Container>
      <Stats>
        <Stat>
          <span>Total Devices</span>
          <span>{error ? "?" : "1"}</span>
        </Stat>
        <Stat>
          <span>Connected</span>
          <span>{error ? "?" : connectedCount}</span>
        </Stat>
      </Stats>
      <SearchInput
        type="text"
        placeholder="Search devices..."
        value={searchTerm}
        onChange={handleSearch}
      />
      <SystemStatus>
        <span>System status:</span>
        <StatusDot status={error ? "offline" : "online"}></StatusDot>
      </SystemStatus>
    </Container>
  );
};

export default DeviceSearchAndStatus;
