import { useState, useEffect } from 'react';
import { Settings, X, Eye, EyeOff, GripVertical } from 'lucide-react';

export interface DashboardConfig {
  widgets: {
    systemMetrics: { enabled: boolean; order: number };
    historicalChart: { enabled: boolean; order: number };
    deviceStatus: { enabled: boolean; order: number };
  };
  title: string;
}

interface DashboardSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: DashboardConfig) => void;
  currentConfig: DashboardConfig;
}

const defaultConfig: DashboardConfig = {
  widgets: {
    systemMetrics: { enabled: false, order: 0 },
    historicalChart: { enabled: false, order: 1 },
    deviceStatus: { enabled: false, order: 2 },
  },
  title: 'Home Assistant Status',
};

export function DashboardSettings({
  isOpen,
  onClose,
  onSave,
  currentConfig,
}: DashboardSettingsProps) {
  const [config, setConfig] = useState<DashboardConfig>(currentConfig);

  useEffect(() => {
    setConfig(currentConfig);
  }, [currentConfig, isOpen]);

  const toggleWidget = (widget: keyof DashboardConfig['widgets']) => {
    setConfig((prev) => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [widget]: {
          ...prev.widgets[widget],
          enabled: !prev.widgets[widget].enabled,
        },
      },
    }));
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const widgetNames = {
    systemMetrics: 'System-Metriken',
    historicalChart: 'Historische Daten',
    deviceStatus: 'Gerätestatus',
  };

  const widgetDescriptions = {
    systemMetrics: 'CPU, RAM, Festplatten-Auslastung und Uptime',
    historicalChart: 'Verlaufsdaten der letzten 24 Stunden',
    deviceStatus: 'Status von Lichtern, Schaltern und Sensoren',
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content dashboard-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={24} />
            <h2>Dashboard Konfiguration</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="dashboard-title">Dashboard Titel</label>
            <input
              id="dashboard-title"
              type="text"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              className="form-input"
              placeholder="Home Assistant Status"
            />
            <small>Wird oben im Dashboard angezeigt</small>
          </div>

          <div className="form-group">
            <label>Widgets</label>
            <small style={{ marginBottom: '1rem', display: 'block' }}>
              Wähle aus, welche Widgets auf dem Dashboard angezeigt werden sollen
            </small>

            <div className="widget-list">
              {(Object.keys(config.widgets) as Array<keyof DashboardConfig['widgets']>).map(
                (widget) => (
                  <div
                    key={widget}
                    className={`widget-item ${config.widgets[widget].enabled ? 'enabled' : 'disabled'}`}
                  >
                    <div className="widget-drag-handle">
                      <GripVertical size={20} />
                    </div>
                    <div className="widget-info">
                      <div className="widget-name">{widgetNames[widget]}</div>
                      <div className="widget-description">{widgetDescriptions[widget]}</div>
                    </div>
                    <button
                      className="widget-toggle"
                      onClick={() => toggleWidget(widget)}
                      title={config.widgets[widget].enabled ? 'Ausblenden' : 'Einblenden'}
                    >
                      {config.widgets[widget].enabled ? (
                        <Eye size={20} />
                      ) : (
                        <EyeOff size={20} />
                      )}
                    </button>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="settings-info">
            <p>
              <strong>Tipp:</strong> Bei der ersten Einrichtung sind alle Widgets deaktiviert.
              Aktiviere nur die Widgets, die du benötigst.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

export { defaultConfig };
