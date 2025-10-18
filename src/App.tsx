import { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { haService } from './services/homeassistant';
import { ConfigModal } from './components/ConfigModal';
import { DeviceStatus } from './components/DeviceStatus';
import { SystemMetrics } from './components/SystemMetrics';
import { HistoricalChart } from './components/HistoricalChart';
import './App.css';

function App() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    // Load config from localStorage
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
    } else {
      setShowConfig(true);
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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Home Assistant Status</h1>
          <div className="header-actions">
            <div className={`connection-status ${connectionStatus}`}>
              <span className="status-dot"></span>
              {connectionStatus === 'connected' ? 'Verbunden' : 'Getrennt'}
            </div>
            <button
              className="config-button"
              onClick={() => setShowConfig(true)}
              title="Einstellungen"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {isConfigured && connectionStatus === 'connected' ? (
          <div className="dashboard">
            <div className="dashboard-section">
              <SystemMetrics />
            </div>
            <div className="dashboard-section">
              <HistoricalChart />
            </div>
            <div className="dashboard-section full-width">
              <DeviceStatus />
            </div>
          </div>
        ) : (
          <div className="welcome-message">
            <h2>Willkommen zur Home Assistant Statusseite</h2>
            <p>
              {!isConfigured
                ? 'Bitte konfiguriere deine Home Assistant Verbindung um zu starten.'
                : 'Verbindung zu Home Assistant fehlgeschlagen. Bitte überprüfe deine Einstellungen.'}
            </p>
            <button className="btn btn-primary" onClick={() => setShowConfig(true)}>
              Einstellungen öffnen
            </button>
          </div>
        )}
      </main>

      <ConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        onSave={handleConfigSave}
      />
    </div>
  );
}

export default App;
