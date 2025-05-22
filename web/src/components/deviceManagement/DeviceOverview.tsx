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
      <OverviewContainer>
        <DevicesGrid>
          {loading && <div>Loading devices...</div>}

          {!loading && filteredDevices.length === 0 && (
            <div>No devices found</div>
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
