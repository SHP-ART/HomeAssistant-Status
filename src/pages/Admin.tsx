import { useState, useEffect } from 'react';
import { Settings, Home, Plus, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { haService } from '../services/homeassistant';
import { ConfigModal } from '../components/ConfigModal';
import { TileEditor } from '../components/TileEditor';
import { defaultDashboardConfig, type DashboardConfig, type Tile } from '../types/dashboard';

export function Admin() {
  const [isConfigured, setIsConfigured] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showTileEditor, setShowTileEditor] = useState(false);
  const [editingTile, setEditingTile] = useState<Tile | undefined>();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(defaultDashboardConfig);
  const [dashboardTitle, setDashboardTitle] = useState('Home Assistant Status');

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
        setDashboardTitle(config.title || 'Home Assistant Status');
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

  const handleConfigSave = () => {
    setIsConfigured(true);
    testConnection();
  };

  const saveDashboardConfig = (config: DashboardConfig) => {
    setDashboardConfig(config);
    localStorage.setItem('dashboard_config', JSON.stringify(config));
  };

  const handleTitleSave = () => {
    const newConfig = { ...dashboardConfig, title: dashboardTitle };
    saveDashboardConfig(newConfig);
  };

  const handleAddTile = () => {
    setEditingTile(undefined);
    setShowTileEditor(true);
  };

  const handleEditTile = (tile: Tile) => {
    setEditingTile(tile);
    setShowTileEditor(true);
  };

  const handleSaveTile = (tile: Tile) => {
    const tiles = editingTile
      ? dashboardConfig.tiles.map((t) => (t.id === tile.id ? tile : t))
      : [...dashboardConfig.tiles, tile];

    const newConfig = { ...dashboardConfig, tiles };
    saveDashboardConfig(newConfig);
  };

  const handleDeleteTile = (tileId: string) => {
    const tiles = dashboardConfig.tiles.filter((t) => t.id !== tileId);
    const newConfig = { ...dashboardConfig, tiles };
    saveDashboardConfig(newConfig);
    setShowTileEditor(false);
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
                <Settings size={24} />
                <h2>Dashboard Titel</h2>
              </div>
              <div className="admin-card-body">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    value={dashboardTitle}
                    onChange={(e) => setDashboardTitle(e.target.value)}
                    className="form-input"
                    placeholder="Dashboard Titel"
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleTitleSave}
                >
                  Titel speichern
                </button>
              </div>
            </div>
          </div>

          <div className="admin-card full-width">
            <div className="admin-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                <Plus size={24} />
                <h2>Dashboard Kacheln</h2>
              </div>
              <button className="btn btn-primary" onClick={handleAddTile}>
                <Plus size={20} />
                Neue Kachel
              </button>
            </div>
            <div className="admin-card-body">
              {dashboardConfig.tiles.length === 0 ? (
                <div className="empty-tiles">
                  <p>Noch keine Kacheln erstellt</p>
                  <p className="help-text">
                    Klicke auf "Neue Kachel" um deine erste Kachel hinzuzufügen
                  </p>
                </div>
              ) : (
                <div className="tiles-list">
                  {dashboardConfig.tiles.map((tile) => (
                    <div key={tile.id} className="tile-item">
                      <div className="tile-item-info">
                        {tile.icon && <span className="tile-item-icon">{tile.icon}</span>}
                        <div>
                          <div className="tile-item-title">{tile.title}</div>
                          <div className="tile-item-meta">
                            <span className="tile-item-type">
                              {tile.type === 'value' && '📊 Wert-Anzeige'}
                              {tile.type === 'multi-value' && '📊 Multi-Wert-Anzeige'}
                              {tile.type === 'toggle' && '🔘 Schalter'}
                              {tile.type === 'button' && '🔲 Taster'}
                            </span>
                            <span className="tile-item-entity">
                              {tile.type === 'multi-value'
                                ? `${tile.entities.length} Entities`
                                : tile.entityId}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="tile-item-actions">
                        <button
                          className="btn-icon"
                          onClick={() => handleEditTile(tile)}
                          title="Bearbeiten"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleDeleteTile(tile.id)}
                          title="Löschen"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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

      <TileEditor
        isOpen={showTileEditor}
        onClose={() => setShowTileEditor(false)}
        onSave={handleSaveTile}
        onDelete={editingTile ? () => handleDeleteTile(editingTile.id) : undefined}
        tile={editingTile}
      />
    </div>
  );
}
