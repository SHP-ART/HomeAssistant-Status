import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Settings, ArrowLeft } from 'lucide-react';
import { haService } from '../services/homeassistant';
import { ValueTile } from '../components/tiles/ValueTile';
import { ButtonTile } from '../components/tiles/ButtonTile';
import { ToggleTile } from '../components/tiles/ToggleTile';
import { MultiValueTile } from '../components/tiles/MultiValueTile';
import { defaultDashboardConfig, type DashboardConfig, type Tile } from '../types/dashboard';
import { Layout } from 'lucide-react';

export function AdminDashboard() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(defaultDashboardConfig);
  const [draggedTile, setDraggedTile] = useState<string | null>(null);

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

  const handleDragStart = (e: React.DragEvent, tileId: string) => {
    setDraggedTile(tileId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTileId: string) => {
    e.preventDefault();

    if (!draggedTile || draggedTile === targetTileId) {
      setDraggedTile(null);
      return;
    }

    const tiles = [...dashboardConfig.tiles];
    const draggedIndex = tiles.findIndex(t => t.id === draggedTile);
    const targetIndex = tiles.findIndex(t => t.id === targetTileId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedTile(null);
      return;
    }

    // Swap tiles
    const [removed] = tiles.splice(draggedIndex, 1);
    tiles.splice(targetIndex, 0, removed);

    // Update order
    tiles.forEach((tile, index) => {
      tile.order = index;
    });

    const newConfig = { ...dashboardConfig, tiles };
    setDashboardConfig(newConfig);
    localStorage.setItem('dashboard_config', JSON.stringify(newConfig));
    setDraggedTile(null);
  };

  const handleDragEnd = () => {
    setDraggedTile(null);
  };

  const renderTile = (tile: Tile) => {
    const tileContent = (() => {
      switch (tile.type) {
        case 'value':
          return <ValueTile tile={tile} />;
        case 'button':
          return <ButtonTile tile={tile} readOnly={false} />;
        case 'toggle':
          return <ToggleTile tile={tile} readOnly={false} />;
        case 'multi-value':
          return <MultiValueTile tile={tile} />;
        default:
          return null;
      }
    })();

    return (
      <div
        key={tile.id}
        className={`dashboard-tile ${draggedTile === tile.id ? 'dragging' : ''}`}
        data-size={tile.size || '1x1'}
        draggable
        onDragStart={(e) => handleDragStart(e, tile.id)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, tile.id)}
        onDragEnd={handleDragEnd}
      >
        {tileContent}
      </div>
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>
            <span style={{ color: '#3b82f6', marginRight: '0.5rem' }}>🔒</span>
            {dashboardConfig.title} - Admin
          </h1>
          <div className="header-actions">
            <div className={`connection-status ${connectionStatus}`}>
              <span className="status-dot"></span>
              {connectionStatus === 'connected' ? 'Verbunden' : 'Getrennt'}
            </div>
            <Link to="/admin" className="config-button" title="Zur Konfiguration">
              <Settings size={20} />
            </Link>
          </div>
        </div>
      </header>

      <main className="app-main">
        {isConfigured && connectionStatus === 'connected' ? (
          dashboardConfig.tiles.length > 0 ? (
            <>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>ℹ️</span>
                <div>
                  <strong style={{ color: '#3b82f6' }}>Admin-Dashboard</strong>
                  <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#9ca3af' }}>
                    Hier kannst du alle Geräte steuern. Dieses Dashboard ist nur im lokalen Netzwerk erreichbar.
                  </p>
                </div>
              </div>
              <div className="dashboard-tiles">
                {dashboardConfig.tiles
                  .sort((a, b) => a.order - b.order)
                  .map((tile) => renderTile(tile))}
              </div>
            </>
          ) : (
            <div className="empty-dashboard">
              <Layout size={64} />
              <h2>{dashboardConfig.title}</h2>
              <p>Dashboard ist noch nicht konfiguriert</p>
              <p className="help-text">
                Gehe zur Admin-Seite um Kacheln zu erstellen
              </p>
              <Link to="/admin" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                <Settings size={20} />
                Zur Konfiguration
              </Link>
            </div>
          )
        ) : (
          <div className="welcome-message">
            <h2>Willkommen zum Admin-Dashboard</h2>
            <p>
              {!isConfigured
                ? 'Dashboard wird konfiguriert...'
                : 'Verbindung zu Home Assistant fehlgeschlagen.'}
            </p>
            <Link to="/admin" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              <Settings size={20} />
              Zur Konfiguration
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
