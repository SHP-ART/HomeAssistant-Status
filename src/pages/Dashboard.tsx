import { useState, useEffect } from 'react';
import { haService } from '../services/homeassistant';
import { ValueTile } from '../components/tiles/ValueTile';
import { ButtonTile } from '../components/tiles/ButtonTile';
import { ToggleTile } from '../components/tiles/ToggleTile';
import { MultiValueTile } from '../components/tiles/MultiValueTile';
import { defaultDashboardConfig, type DashboardConfig } from '../types/dashboard';
import { Layout } from 'lucide-react';

export function Dashboard() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(defaultDashboardConfig);

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
        const config = JSON.parse(savedDashboard);
        // Ensure tiles array exists (migration from old widget system)
        if (!config.tiles) {
          config.tiles = [];
        }
        setDashboardConfig(config);
      } catch (error) {
        console.error('Error loading dashboard config:', error);
        setDashboardConfig(defaultDashboardConfig);
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

  const renderTile = (tile: any) => {
    switch (tile.type) {
      case 'value':
        return <ValueTile key={tile.id} tile={tile} />;
      case 'button':
        return <ButtonTile key={tile.id} tile={tile} />;
      case 'toggle':
        return <ToggleTile key={tile.id} tile={tile} />;
      case 'multi-value':
        return <MultiValueTile key={tile.id} tile={tile} />;
      default:
        return null;
    }
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
          dashboardConfig.tiles.length > 0 ? (
            <div className="dashboard-tiles">
              {dashboardConfig.tiles.map((tile) => renderTile(tile))}
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
