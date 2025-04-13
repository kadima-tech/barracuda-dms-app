'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Header } from '../components/common/Header';
import { Wrapper } from '../components/layout/Wrapper';
import ClientOnly from '../components/common/ClientOnly';

interface Alert {
  id: string;
  deviceId: string;
  type: 'warning' | 'critical' | 'info';
  message: string;
  timestamp: number;
  status: 'new' | 'acknowledged' | 'resolved';
  metrics?: {
    [key: string]: number;
  };
}

const Banner = styled.div`
  background: #ffffff;
  padding: 3rem;
  margin: 2rem 2rem 3rem 2rem;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.03);
`;

const BannerTitle = styled.h1`
  font-size: 2.4rem;
  margin: 0 0 0.5rem 0;
  color: #1a1a1a;
  font-weight: 700;
`;

const BannerText = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin: 0;
  max-width: 600px;
  line-height: 1.6;
`;

const AlertsContainer = styled.div`
  padding: 0 2rem 2rem 2rem;
`;

const AlertCard = styled.div<{ type: string }>`
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
        case 'critical':
          return '#EF4444';
        case 'warning':
          return '#F59E0B';
        case 'info':
          return '#3B82F6';
        default:
          return '#0CBAB1';
      }
    }};
  }
`;

const AlertInfo = styled.div`
  flex: 1;
`;

const AlertType = styled.span<{ type: string }>`
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  background: ${(props) => {
    switch (props.type) {
      case 'critical':
        return '#FEE2E2';
      case 'warning':
        return '#FEF3C7';
      case 'info':
        return '#DBEAFE';
      default:
        return '#E7F7F6';
    }
  }};
  color: ${(props) => {
    switch (props.type) {
      case 'critical':
        return '#DC2626';
      case 'warning':
        return '#D97706';
      case 'info':
        return '#2563EB';
      default:
        return '#0CBAB1';
    }
  }};
  transform: rotate(-2deg);
  display: inline-block;
  transition: transform 0.2s ease;

  &:hover {
    transform: rotate(2deg);
  }
`;

const AlertMessage = styled.p`
  color: #4a5568;
  margin: 0.5rem 0;
  font-size: 1rem;
`;

const AlertMeta = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  display: flex;
  gap: 1rem;
`;

const ActionButton = styled.button`
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  border: 2px solid #0cbab1;
  background: white;
  color: #0cbab1;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;

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

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockAlerts: Alert[] = [
      {
        id: '1',
        deviceId: 'DEV001',
        type: 'critical',
        message: 'Device temperature exceeding critical threshold (85°C)',
        timestamp: Date.now(),
        status: 'new',
        metrics: { temperature: 85 },
      },
      {
        id: '2',
        deviceId: 'DEV002',
        type: 'warning',
        message: 'Device uptime exceeding recommended maintenance interval',
        timestamp: Date.now() - 86400000,
        status: 'acknowledged',
        metrics: { uptime: 8760 },
      },
      {
        id: '3',
        deviceId: 'DEV003',
        type: 'info',
        message: 'Device memory usage approaching 80% capacity',
        timestamp: Date.now() - 172800000,
        status: 'new',
        metrics: { memoryUsage: 80 },
      },
    ];
    setAlerts(mockAlerts);
  }, []);

  const handleAcknowledge = (alertId: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId
          ? { ...alert, status: 'acknowledged' as const }
          : alert
      )
    );
  };

  const handleResolve = (alertId: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId ? { ...alert, status: 'resolved' as const } : alert
      )
    );
  };

  return (
    <ClientOnly fallback={<div>Loading alerts...</div>}>
      <Wrapper
        header={<Header />}
        contentBoxPrimary={[
          <Banner key="banner">
            <div>
              <BannerTitle>System Alerts</BannerTitle>
              <BannerText>
                Monitor and manage system alerts, warnings, and critical
                notifications for your devices.
              </BannerText>
            </div>
          </Banner>,
          <AlertsContainer key="alerts">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} type={alert.type}>
                <AlertInfo>
                  <AlertType type={alert.type}>
                    {alert.type.toUpperCase()}
                  </AlertType>
                  <AlertMessage>{alert.message}</AlertMessage>
                  <AlertMeta>
                    <span>Device: {alert.deviceId}</span>
                    <span>•</span>
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span>Status: {alert.status}</span>
                  </AlertMeta>
                </AlertInfo>
                <div>
                  {alert.status === 'new' && (
                    <ActionButton onClick={() => handleAcknowledge(alert.id)}>
                      Acknowledge
                    </ActionButton>
                  )}
                  {alert.status === 'acknowledged' && (
                    <ActionButton onClick={() => handleResolve(alert.id)}>
                      Resolve
                    </ActionButton>
                  )}
                </div>
              </AlertCard>
            ))}
          </AlertsContainer>,
        ]}
      />
    </ClientOnly>
  );
};

export default Alerts;
