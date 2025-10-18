import { useState, useEffect } from 'react';
import { Settings, Layout, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { haService } from '../services/homeassistant';
import { ConfigModal } from '../components/ConfigModal';
import { DashboardSettings, defaultConfig, type DashboardConfig } from '../components/DashboardSettings';

export function Admin() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showDashboardSettings, setShowDashboardSettings] = useState(false);
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

  const handleConfigSave = () => {
    setIsConfigured(true);
    testConnection();
  };

  const handleDashboardSave = (config: DashboardConfig) => {
    setDashboardConfig(config);
    localStorage.setItem('dashboard_config', JSON.stringify(config));
  };

  const hasAnyWidgetEnabled = () => {
    return Object.values(dashboardConfig.widgets).some((widget) => widget.enabled);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Admin-Bereich</h1>
          <div className="header-actions">
            <Link to="/" className="config-button" title="Zur Statusseite">
              <Home size={20} />
            </Link>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="admin-container">
          <div className="admin-section">
            <div className="admin-card">
              <div className="admin-card-header">
                <Settings size={24} />
                <h2>Home Assistant Verbindung</h2>
              </div>
              <div className="admin-card-body">
                <div className="admin-status">
                  <span className="admin-label">Status:</span>
                  <div className={`connection-status ${connectionStatus}`}>
                    <span className="status-dot"></span>
                    {connectionStatus === 'connected' ? 'Verbunden' : 'Getrennt'}
                  </div>
                </div>
                {isConfigured && (
                  <div className="admin-info">
                    <span className="admin-label">URL:</span>
                    <span>{haService.getConfig()?.url}</span>
                  </div>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => setShowConfig(true)}
                >
                  <Settings size={20} />
                  {isConfigured ? 'Verbindung bearbeiten' : 'Verbindung einrichten'}
                </button>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <Layout size={24} />
                <h2>Dashboard Konfiguration</h2>
              </div>
              <div className="admin-card-body">
                <div className="admin-info">
                  <span className="admin-label">Titel:</span>
                  <span>{dashboardConfig.title}</span>
                </div>
                <div className="admin-info">
                  <span className="admin-label">Aktive Widgets:</span>
                  <span>
                    {hasAnyWidgetEnabled()
                      ? Object.entries(dashboardConfig.widgets)
                          .filter(([_, widget]) => widget.enabled)
                          .length + ' aktiviert'
                      : 'Keine Widgets aktiviert'}
                  </span>
                </div>
                <div className="widget-status-list">
                  {Object.entries(dashboardConfig.widgets).map(([key, widget]) => (
                    <div key={key} className="widget-status-item">
                      <span className={`widget-status-dot ${widget.enabled ? 'enabled' : 'disabled'}`}></span>
                      <span>{
                        key === 'systemMetrics' ? 'System-Metriken' :
                        key === 'historicalChart' ? 'Historische Daten' :
                        'Gerätestatus'
                      }</span>
                    </div>
                  ))}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowDashboardSettings(true)}
                >
                  <Layout size={20} />
                  Dashboard bearbeiten
                </button>
              </div>
            </div>
          </div>

          <div className="admin-preview">
            <h3>Vorschau</h3>
            <p className="admin-preview-hint">
              So sieht das Dashboard für Besucher aus:
            </p>
            <div className="preview-frame">
              <Link to="/" className="btn btn-secondary">
                <Home size={20} />
                Dashboard ansehen
              </Link>
            </div>
          </div>
        </div>
      </main>

      <ConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        onSave={handleConfigSave}
      />

      <DashboardSettings
        isOpen={showDashboardSettings}
        onClose={() => setShowDashboardSettings(false)}
        onSave={handleDashboardSave}
        currentConfig={dashboardConfig}
      />
    </div>
  );
}
