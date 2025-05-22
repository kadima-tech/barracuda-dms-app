import { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import ControlPanel from './ControlPanel';
import { deviceApi } from '../../utils/api/devices';
import { ClientSelector } from './ClientSelector';

const OverviewContainer = styled.div`
  max-width: 1800px;
  margin: 0 auto;
  padding: 0 2rem 2rem;
`;

const DevicesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  width: 100%;
`;

const DeviceCard = styled.div<{ isSelected?: boolean; isExpanded?: boolean }>`
  border: 1px solid ${(props) => (props.isSelected ? '#0CBAB1' : '#e1e1e1')};
  border-radius: 12px;
  background-color: ${(props) => (props.isSelected ? '#f8f9ff' : 'white')};
  box-shadow: ${(props) =>
    props.isSelected
      ? '0 8px 24px rgba(12, 186, 177, 0.15)'
      : '0 4px 16px rgba(0, 0, 0, 0.04)'};
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  height: ${(props) => (props.isExpanded ? 'auto' : 'fit-content')};
  grid-column: ${(props) => (props.isExpanded ? 'span 2' : 'span 1')};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
    border-color: #0cbab1;
  }

  @media (max-width: 767px) {
    grid-column: span 1;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: white;
`;

const CompactInfo = styled.div`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  gap: 1.5rem;
  background-color: #f9fafb;
  border-top: 1px solid #f1f5f9;

  @media (max-width: 500px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const CompactMetric = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.95rem;
  color: #4b5563;
`;

const MetricIcon = styled.div`
  color: #0cbab1;
  display: flex;
  align-items: center;
`;

const MetricText = styled.span`
  font-weight: 500;
`;

const CardBody = styled.div<{ isExpanded: boolean }>`
  height: ${(props) => (props.isExpanded ? 'auto' : '0')};
  max-height: ${(props) => (props.isExpanded ? 'none' : '0')};
  padding: ${(props) => (props.isExpanded ? '1.5rem' : '0')};
  opacity: ${(props) => (props.isExpanded ? '1' : '0')};
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  border-top: ${(props) => (props.isExpanded ? '1px solid #f1f5f9' : 'none')};
  display: ${(props) => (props.isExpanded ? 'block' : 'none')};
  background-color: ${(props) =>
    props.isExpanded ? '#f9fafb' : 'transparent'};
`;

const MetricsSection = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #334155;
  font-size: 0.95rem;
  font-weight: 600;
`;

const SectionDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0cbab1;
  flex-shrink: 0;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
`;

const MetricCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 0.75rem;
  border-radius: 8px;
  background-color: #f8fafc;
  transition: all 0.2s ease;
`;

const MetricValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
  margin: 0.25rem 0;
`;

const MetricLabel = styled.div`
  font-size: 0.9rem;
  color: #64748b;
  text-align: center;
  margin-top: 0.25rem;
`;

const MainMetric = styled(MetricValue)`
  font-size: 3.5rem;
  text-align: center;
  margin: 1rem 0 0.5rem;
`;

const PreviewSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #f1f5f9;
`;

const PreviewFrame = styled.iframe`
  width: 100%;
  height: 200px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  margin-top: 1rem;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: #0cbab1;
  }
`;

const PreviewPlaceholder = styled.div`
  width: 100%;
  height: 200px;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 0.9rem;
  margin-top: 1rem;
  transition: all 0.2s ease-in-out;

  &:hover {
    border-color: #0cbab1;
    color: #0cbab1;
  }
`;

const ClientSection = styled.div`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #f1f5f9;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1rem;
  color: #334155;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 50rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: ${(props) => {
    switch (props.status.toLowerCase()) {
      case 'online':
      case 'connected':
        return '#e8f5e9';
      case 'offline':
      case 'disconnected':
        return '#ffebee';
      default:
        return '#fff3e0';
    }
  }};
  color: ${(props) => {
    switch (props.status.toLowerCase()) {
      case 'online':
      case 'connected':
        return '#2e7d32';
      case 'offline':
      case 'disconnected':
        return '#c62828';
      default:
        return '#ef6c00';
    }
  }};
`;

const SearchBar = styled.div`
  margin: 1rem 2rem;
  display: flex;
  gap: 1rem;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 0.75rem 1rem;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  font-size: 0.95rem;

  &:focus {
    outline: none;
    border-color: #0cbab1;
    box-shadow: 0 0 0 3px rgba(12, 186, 177, 0.1);
  }
`;

const FilterButton = styled.button`
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #4b5563;
  font-weight: 500;

  &:hover {
    background-color: #f8fafc;
    border-color: #0cbab1;
  }
`;

const Banner = styled.div`
  background: linear-gradient(135deg, #e7f7f6 0%, #f5fbfb 100%);
  padding: 2rem;
  margin: 1rem 2rem;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 16px rgba(12, 186, 177, 0.08);
  border: 1px solid rgba(12, 186, 177, 0.15);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(
        circle at 50% 50%,
        rgba(12, 186, 177, 0.08) 0,
        transparent 8px
      ),
      radial-gradient(
        circle at 50% 50%,
        rgba(12, 186, 177, 0.05) 0,
        transparent 12px
      );
    background-size: 60px 60px, 120px 120px;
    background-position: 0 0;
    opacity: 0.1;
    animation: floatingDots 180s ease-in-out infinite;
  }

  @keyframes floatingDots {
    0% {
      background-position: 0% 0%, 0% 0%;
    }
    50% {
      background-position: 100% 100%, 100% 100%;
    }
    100% {
      background-position: 0% 0%, 0% 0%;
    }
  }
`;

const BannerContent = styled.div`
  flex: 1;
`;

const BannerTitle = styled.h1`
  font-size: 1.8rem;
  margin: 0 0 0.5rem 0;
  color: #4a5568;
  font-weight: 600;
  letter-spacing: -0.5px;
`;

const BannerText = styled.p`
  font-size: 1rem;
  color: #4a5568;
  margin: 0;
  max-width: 600px;
  line-height: 1.5;
`;

const DeviceIcon = styled.div`
  color: #0cbab1;
  display: flex;
  align-items: center;
`;

const EmptyState = styled.div`
  grid-column: 1 / -1;
  padding: 3rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  border: 2px dashed #e2e8f0;

  h3 {
    color: #334155;
    margin-bottom: 1rem;
    font-weight: 600;
  }

  p {
    color: #64748b;
    max-width: 500px;
    margin: 0 auto;
  }
`;

const CardHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background-color: #f1f5f9;
    color: #ef4444;
  }
`;

interface Device {
  deviceId: string;
  status: string;
  lastHeartbeat: number;
  clientId?: string | null;
  name?: string;
  metrics: {
    temperature?: number;
    uptime?: number;
    cpuLoad?: number;
    memoryUsage?: number;
    diskUsage?: number;
    currentUrl?: string;
    powerStatus?: string;
    ipAddress?: string;
  };
}

const DeviceOverview = ({ searchQuery }: { searchQuery: string }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const prevDevicesRef = useRef<Device[]>([]);

  // Debounce function to avoid rapid state changes
  const useDebounce = (func: (...args: unknown[]) => void, delay: number) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback(
      (...args: unknown[]) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          func(...args);
        }, delay);
      },
      [func, delay]
    );
  };

  // Memoized merge function to prevent unnecessary re-renders
  const mergeDeviceData = useCallback(
    (oldDevices: Device[], newDevices: Device[] | { data: Device[] }) => {
      const mergedDevices = [...oldDevices];

      // Handle case where newDevices is an object with a data property
      let devicesArray: Device[] = [];

      if (Array.isArray(newDevices)) {
        devicesArray = newDevices;
      } else if (
        newDevices &&
        typeof newDevices === 'object' &&
        Array.isArray(newDevices.data)
      ) {
        devicesArray = newDevices.data;
      } else {
        // Use JSON.stringify to ensure arrays and objects are fully logged
        console.error(
          'newDevices is not an array or object with data array:',
          JSON.stringify(newDevices, null, 2) // null, 2 for pretty printing
        );
        return mergedDevices; // Return original devices without changes
      }

      // Process the devices array
      devicesArray.forEach((newDevice) => {
        const existingIndex = mergedDevices.findIndex(
          (device) => device.deviceId === newDevice.deviceId
        );

        if (existingIndex >= 0) {
          // Only update if there are actual changes to prevent re-renders
          if (
            JSON.stringify(mergedDevices[existingIndex]) !==
            JSON.stringify(newDevice)
          ) {
            mergedDevices[existingIndex] = {
              ...mergedDevices[existingIndex],
              ...newDevice,
              metrics: {
                ...mergedDevices[existingIndex].metrics,
                ...newDevice.metrics,
              },
            };
          }
        } else {
          mergedDevices.push(newDevice);
        }
      });

      return mergedDevices;
    },
    []
  );

  const fetchDevices = useCallback(async () => {
    try {
      const response = await deviceApi.getDevices();

      setDevices((prev) => {
        const updated = mergeDeviceData(prev, response);
        prevDevicesRef.current = updated;
        return updated;
      });

      if (loading) setLoading(false);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      if (loading) setLoading(false);
    }
  }, [loading, mergeDeviceData]);

  // Debounced fetch to prevent too frequent updates
  const debouncedFetch = useDebounce(fetchDevices, 300);

  useEffect(() => {
    // Initial fetch
    fetchDevices();

    // Regular updates
    const interval = setInterval(() => {
      debouncedFetch();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchDevices, debouncedFetch]);

  const handleClientAssignment = async (
    deviceId: string,
    clientId: string | null
  ) => {
    try {
      await deviceApi.assignClient(deviceId, clientId);
      // Optimistic update
      setDevices((prev) =>
        prev.map((device) =>
          device.deviceId === deviceId ? { ...device, clientId } : device
        )
      );
    } catch (error) {
      console.error('Failed to assign client:', error);
      // Revert to previous state if there was an error
      fetchDevices();
    }
  };

  // Format device ID to handle long IDs
  const formatDeviceId = useCallback((id: string) => {
    return id.length > 16 ? `${id.substring(0, 16)}...` : id;
  }, []);

  // Format metric values with memo
  const formatMetricValue = useCallback(
    (value: number | undefined, suffix: string = '') => {
      if (value === undefined || value === null) {
        return '-';
      }
      if (value === 0) {
        return '-';
      }
      return suffix ? `${value}${suffix}` : value;
    },
    []
  );

  // Format uptime to show hours and minutes
  const formatUptimeValue = useCallback((seconds: number | undefined) => {
    if (seconds === undefined || seconds === null || seconds === 0) {
      return '-';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) {
      return `${minutes}m`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  }, []);

  // Filter devices based on search query with memo
  const filteredDevices = devices.filter(
    (device) =>
      device.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add icon SVGs for metrics
  const CpuIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="3"
        stroke="#0CBAB1"
        strokeWidth="2"
      />
      <path d="M9 9h6v6H9z" stroke="#0CBAB1" strokeWidth="2" />
    </svg>
  );
  const MemoryIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="7"
        width="18"
        height="10"
        rx="2"
        stroke="#0CBAB1"
        strokeWidth="2"
      />
      <rect
        x="7"
        y="3"
        width="10"
        height="4"
        rx="1"
        stroke="#0CBAB1"
        strokeWidth="2"
      />
    </svg>
  );
  const TempIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 9V13M12 17H12.01M8.464 4.464A6 6 0 0 1 17 8v8a6 6 0 1 1-12 0V8a6 6 0 0 1 3.464-3.536z"
        stroke="#0CBAB1"
        strokeWidth="2"
      />
    </svg>
  );
  const PowerIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 2v10" stroke="#0CBAB1" strokeWidth="2" />
      <circle cx="12" cy="16" r="6" stroke="#0CBAB1" strokeWidth="2" />
    </svg>
  );
  const UptimeIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#0CBAB1" strokeWidth="2" />
      <path d="M12 6v6l4 2" stroke="#0CBAB1" strokeWidth="2" />
    </svg>
  );
  const IpIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="7"
        width="18"
        height="10"
        rx="2"
        stroke="#0CBAB1"
        strokeWidth="2"
      />
      <circle cx="7.5" cy="12" r="1.5" fill="#0CBAB1" />
      <circle cx="12" cy="12" r="1.5" fill="#0CBAB1" />
      <circle cx="16.5" cy="12" r="1.5" fill="#0CBAB1" />
    </svg>
  );

  // Tooltip for power status
  const PowerStatusWrapper = styled.div`
    position: relative;
    display: inline-block;
  `;
  const PowerTooltip = styled.div`
    visibility: hidden;
    background: #222;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 4px 8px;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    transform: translateX(-50%);
    opacity: 0;
    transition: opacity 0.2s;
    font-size: 0.85rem;
    white-space: nowrap;
    ${PowerStatusWrapper}:hover & {
      visibility: visible;
      opacity: 1;
    }
  `;

  return (
    <>
      <Banner>
        <BannerContent>
          <BannerTitle>Device Management</BannerTitle>
          <BannerText>
            Monitor and control your connected devices in real-time. Assign
            clients, track performance metrics, and manage content distribution
            from a single dashboard.
          </BannerText>
        </BannerContent>
      </Banner>

      <OverviewContainer>
        <DevicesGrid>
          {loading && (
            <EmptyState>
              <h3>Loading devices...</h3>
              <p>Retrieving device information from the system...</p>
            </EmptyState>
          )}

          {!loading && filteredDevices.length === 0 && (
            <EmptyState>
              <h3>No devices found</h3>
              <p>
                There are currently no devices matching your criteria. Try
                adjusting your search or check back later.
              </p>
            </EmptyState>
          )}

          {filteredDevices.map((device) => (
            <DeviceCard
              key={device.deviceId}
              isSelected={selectedDevice === device.deviceId}
              isExpanded={selectedDevice === device.deviceId}
              style={{
                minHeight: '110px',
                marginBottom: '1.2rem',
                boxShadow: '0 2px 8px rgba(12,186,177,0.06)',
                border: '1.5px solid #e1e1e1',
                padding: '1.1rem 1.2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                transition: 'box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onClick={() => {
                setSelectedDevice(
                  selectedDevice === device.deviceId ? null : device.deviceId
                );
              }}
            >
              {/* Reboot button (only on hover) */}
              <button
                className="reboot-btn"
                title="Reboot"
                aria-label="Reboot device"
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'white',
                  border: '1px solid #e1e1e1',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  transition: 'all 0.2s',
                  zIndex: 2,
                }}
                onClick={(e) => {
                  e.stopPropagation(); /* TODO: call reboot */
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4.93 4.93a10 10 0 1 1-1.41 1.41"
                    stroke="#0CBAB1"
                    strokeWidth="2"
                  />
                  <path d="M8 2v6h6" stroke="#0CBAB1" strokeWidth="2" />
                </svg>
              </button>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.8rem',
                  marginBottom: 8,
                  cursor: 'default',
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '1.05rem',
                    color: '#1e293b',
                    maxWidth: 120,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDeviceId(device.deviceId)}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="8"
                      fill={
                        device.status === 'connected' ? '#22C55E' : '#EF4444'
                      }
                    />
                  </svg>
                  <span
                    style={{
                      color:
                        device.status === 'connected' ? '#22C55E' : '#EF4444',
                      fontWeight: 500,
                      fontSize: '0.92rem',
                    }}
                  >
                    {device.status.toUpperCase()}
                  </span>
                </span>
              </div>
              {/* Metrics row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                  cursor: 'default',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.97rem',
                    color: '#334155',
                  }}
                >
                  <CpuIcon />
                  {device.metrics.cpuLoad !== undefined
                    ? formatMetricValue(Math.round(device.metrics.cpuLoad)) +
                      '%'
                    : '—'}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.97rem',
                    color: '#334155',
                  }}
                >
                  <MemoryIcon />
                  {device.metrics.memoryUsage !== undefined
                    ? formatMetricValue(
                        Number(device.metrics.memoryUsage.toFixed(2)),
                        '%'
                      )
                    : '—'}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.97rem',
                    color: '#334155',
                  }}
                >
                  <TempIcon />
                  {device.metrics.temperature !== undefined
                    ? formatMetricValue(device.metrics.temperature, '°C')
                    : '—'}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.97rem',
                    color: '#334155',
                  }}
                >
                  <PowerIcon />
                  {device.metrics.powerStatus ? (
                    <PowerStatusWrapper>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="8"
                          fill={
                            device.metrics.powerStatus === 'throttled=0x0'
                              ? '#22C55E'
                              : '#EF4444'
                          }
                        />
                      </svg>
                      <PowerTooltip>{device.metrics.powerStatus}</PowerTooltip>
                    </PowerStatusWrapper>
                  ) : (
                    '—'
                  )}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.97rem',
                    color: '#334155',
                  }}
                >
                  <UptimeIcon />
                  {device.metrics.uptime !== undefined
                    ? formatUptimeValue(device.metrics.uptime)
                    : '—'}
                </span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.97rem',
                    color: '#334155',
                  }}
                >
                  <IpIcon />
                  {device.metrics.ipAddress || '—'}
                </span>
              </div>
              {/* Expanded details (reuse existing CardBody) */}
              <CardBody
                isExpanded={selectedDevice === device.deviceId}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  style={{
                    marginTop: '2rem',
                    paddingTop: '2rem',
                    borderTop: '1px solid #f1f5f9',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <SectionHeader>
                    <SectionDot />
                    Device Control
                  </SectionHeader>
                  <ControlPanel
                    deviceId={device.deviceId}
                    deviceName={device.name || device.deviceId}
                  />
                </div>

                <PreviewSection onClick={(e) => e.stopPropagation()}>
                  <SectionHeader>
                    <SectionDot />
                    Current Content
                  </SectionHeader>

                  {device.metrics.currentUrl ? (
                    <PreviewFrame
                      src={device.metrics.currentUrl}
                      title={`Device ${device.deviceId} Preview`}
                      sandbox="allow-same-origin allow-scripts"
                    />
                  ) : (
                    <PreviewPlaceholder>
                      No content currently displayed
                    </PreviewPlaceholder>
                  )}
                </PreviewSection>

                <ClientSection onClick={(e) => e.stopPropagation()}>
                  <SectionHeader>
                    <SectionDot />
                    Assigned Client
                  </SectionHeader>

                  <ClientSelector
                    selectedClientId={device.clientId}
                    onSelect={(clientId) =>
                      handleClientAssignment(device.deviceId, clientId)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                </ClientSection>
              </CardBody>
            </DeviceCard>
          ))}
        </DevicesGrid>
      </OverviewContainer>
    </>
  );
};

export default DeviceOverview;
