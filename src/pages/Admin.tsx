import { useState, useEffect, useRef } from 'react';
import { Settings, Home, Plus, Edit2, Trash2, ChevronUp, ChevronDown, Download, Upload, LayoutDashboard } from 'lucide-react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleMoveTileUp = (tileId: string) => {
    const tiles = [...dashboardConfig.tiles].sort((a, b) => a.order - b.order);
    const index = tiles.findIndex((t) => t.id === tileId);

    if (index > 0) {
      // Swap with previous
      [tiles[index - 1], tiles[index]] = [tiles[index], tiles[index - 1]];

      // Update order
      tiles.forEach((tile, idx) => {
        tile.order = idx;
      });

      const newConfig = { ...dashboardConfig, tiles };
      saveDashboardConfig(newConfig);
    }
  };

  const handleMoveTileDown = (tileId: string) => {
    const tiles = [...dashboardConfig.tiles].sort((a, b) => a.order - b.order);
    const index = tiles.findIndex((t) => t.id === tileId);

    if (index < tiles.length - 1) {
      // Swap with next
      [tiles[index], tiles[index + 1]] = [tiles[index + 1], tiles[index]];

      // Update order
      tiles.forEach((tile, idx) => {
        tile.order = idx;
      });

      const newConfig = { ...dashboardConfig, tiles };
      saveDashboardConfig(newConfig);
    }
  };

  const handleExportDashboard = () => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      dashboard: dashboardConfig,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `ha-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportDashboard = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);

        // Validierung
        if (!importData.dashboard || !importData.dashboard.title || !Array.isArray(importData.dashboard.tiles)) {
          alert('Ungültige Datei: Dashboard-Struktur fehlt oder ist fehlerhaft.');
          return;
        }

        // Optional: Version Check
        if (importData.version && importData.version !== '1.0') {
          if (!confirm('Diese Datei wurde mit einer anderen Version erstellt. Trotzdem importieren?')) {
            return;
          }
        }

        // Import durchführen
        const imported = importData.dashboard as DashboardConfig;

        // Ensure all tiles have proper order
        imported.tiles.forEach((tile, index) => {
          if (tile.order === undefined) {
            tile.order = index;
          }
        });

        setDashboardConfig(imported);
        setDashboardTitle(imported.title);
        saveDashboardConfig(imported);

        alert(`Dashboard erfolgreich importiert!\n${imported.tiles.length} Kacheln wiederhergestellt.`);
      } catch (error) {
        console.error('Import error:', error);
        alert('Fehler beim Importieren: Ungültige JSON-Datei.');
      }
    };

    reader.readAsText(file);

    // Reset input so same file can be imported again
    event.target.value = '';
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Admin-Bereich</h1>
          <div className="header-actions">
            <Link to="/adminDashboard" className="config-button" title="Admin-Dashboard">
              <LayoutDashboard size={20} />
            </Link>
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

          <div className="admin-section">
            <div className="admin-card">
              <div className="admin-card-header">
                <Download size={24} />
                <h2>Backup & Wiederherstellung</h2>
              </div>
              <div className="admin-card-body">
                <p style={{ marginBottom: '1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
                  Sichere deine Dashboard-Konfiguration oder stelle sie wieder her
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleExportDashboard}
                  >
                    <Download size={20} />
                    Exportieren
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleImportClick}
                  >
                    <Upload size={20} />
                    Importieren
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportDashboard}
                  style={{ display: 'none' }}
                />
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
                  {dashboardConfig.tiles
                    .sort((a, b) => a.order - b.order)
                    .map((tile, index) => (
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
                              {tile.size && ` • ${tile.size}`}
                              {' • '}
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
                          onClick={() => handleMoveTileUp(tile.id)}
                          title="Nach oben"
                          disabled={index === 0}
                        >
                          <ChevronUp size={18} />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => handleMoveTileDown(tile.id)}
                          title="Nach unten"
                          disabled={index === dashboardConfig.tiles.length - 1}
                        >
                          <ChevronDown size={18} />
                        </button>
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
            <h3>Dashboard ansehen</h3>
            <p className="admin-preview-hint">
              Teste dein konfiguriertes Dashboard:
            </p>
            <div className="preview-frame" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/adminDashboard" className="btn btn-primary">
                <LayoutDashboard size={20} />
                Admin-Dashboard (Steuerung)
              </Link>
              <Link to="/" className="btn btn-secondary">
                <Home size={20} />
                Öffentliches Dashboard (Read-Only)
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
