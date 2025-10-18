import { useState, useEffect } from 'react';
import { haService } from '../services/homeassistant';
import { DeviceStatus } from '../components/DeviceStatus';
import { SystemMetrics } from '../components/SystemMetrics';
import { HistoricalChart } from '../components/HistoricalChart';
import { defaultConfig, type DashboardConfig } from '../components/DashboardSettings';
import { Layout } from 'lucide-react';

export function Dashboard() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(defaultConfig);

  useEffect(() => {
    // Load HA config from localStorage
    const savedConfig = localStorage.getItem('ha_config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        haService.configure(config);
        setIsConfigured(true);
        testConnection();
      } catch (error) {
        console.error('Error loading config:', error);
      }
    }

    // Load dashboard config from localStorage
    const savedDashboard = localStorage.getItem('dashboard_config');
    if (savedDashboard) {
      try {
        setDashboardConfig(JSON.parse(savedDashboard));
      } catch (error) {
        console.error('Error loading dashboard config:', error);
        setDashboardConfig(defaultConfig);
      }
    }
  }, []);

  const testConnection = async () => {
    try {
      const connected = await haService.testConnection();
      setConnectionStatus(connected ? 'connected' : 'disconnected');
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const hasAnyWidgetEnabled = () => {
    return Object.values(dashboardConfig.widgets).some((widget) => widget.enabled);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>{dashboardConfig.title}</h1>
          <div className="header-actions">
            <div className={`connection-status ${connectionStatus}`}>
              <span className="status-dot"></span>
              {connectionStatus === 'connected' ? 'Verbunden' : 'Getrennt'}
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        {isConfigured && connectionStatus === 'connected' ? (
          hasAnyWidgetEnabled() ? (
            <div className="dashboard">
              {dashboardConfig.widgets.systemMetrics.enabled && (
                <div className="dashboard-section">
                  <SystemMetrics />
                </div>
              )}
              {dashboardConfig.widgets.historicalChart.enabled && (
                <div className="dashboard-section">
                  <HistoricalChart />
                </div>
              )}
              {dashboardConfig.widgets.deviceStatus.enabled && (
                <div className="dashboard-section full-width">
                  <DeviceStatus />
                </div>
              )}
            </div>
          ) : (
            <div className="empty-dashboard">
              <Layout size={64} />
              <h2>{dashboardConfig.title}</h2>
              <p>Dashboard ist noch nicht konfiguriert</p>
              <p className="help-text">
                Der Administrator muss das Dashboard erst in der Admin-Seite einrichten
              </p>
            </div>
          )
        ) : (
          <div className="welcome-message">
            <h2>Willkommen zur Home Assistant Statusseite</h2>
            <p>
              {!isConfigured
                ? 'Dashboard wird konfiguriert...'
                : 'Verbindung zu Home Assistant fehlgeschlagen.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
