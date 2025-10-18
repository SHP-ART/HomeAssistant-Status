import { useState, useEffect } from 'react';
import { haService } from '../services/homeassistant';
import { Settings, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export function ConfigModal({ isOpen, onClose, onSave }: ConfigModalProps) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const config = haService.getConfig();
    if (config) {
      setUrl(config.url);
      setToken(config.token);
    }
  }, [isOpen]);

  const handleTest = async () => {
    if (!url || !token) return;

    setTesting(true);
    setTestResult(null);
    setErrorMessage('');

    try {
      haService.configure({ url, token });
      const result = await haService.testConnection();
      setTestResult(result ? 'success' : 'error');
      if (!result) {
        setErrorMessage('API-Antwort nicht korrekt. Bitte überprüfe die URL.');
      }
    } catch (error: any) {
      setTestResult('error');

      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        setErrorMessage('CORS-Fehler: Bitte konfiguriere CORS in Home Assistant (siehe unten).');
      } else if (error.response?.status === 401) {
        setErrorMessage('Authentifizierung fehlgeschlagen. Bitte überprüfe deinen Access Token.');
      } else if (error.response?.status === 404) {
        setErrorMessage('API nicht gefunden. Bitte überprüfe die URL.');
      } else {
        setErrorMessage(`Fehler: ${error.message || 'Unbekannter Fehler'}`);
      }
      console.error('Connection error:', error);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!url || !token) return;

    haService.configure({ url, token });
    localStorage.setItem('ha_config', JSON.stringify({ url, token }));
    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={24} />
            <h2>Home Assistant Konfiguration</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="ha-url">Home Assistant URL</label>
            <input
              id="ha-url"
              type="text"
              placeholder="http://192.168.1.100:8123"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="form-input"
            />
            <small>Die URL deiner Home Assistant Instanz (inkl. Port)</small>
            {window.location.protocol === 'https:' && url.startsWith('http://') && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '4px',
                fontSize: '0.875rem',
                color: '#f59e0b'
              }}>
                ⚠️ Warnung: Du verwendest HTTPS, aber die HA-URL ist HTTP.
                Mixed Content wird vom Browser blockiert. Verwende HTTPS für Home Assistant oder einen Reverse Proxy.
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="ha-token">Long-Lived Access Token</label>
            <input
              id="ha-token"
              type="password"
              placeholder="Token eingeben..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="form-input"
            />
            <small>
              Erstelle einen Token in deinem Home Assistant Profil unter "Long-Lived Access Tokens"
            </small>
          </div>

          {testResult && (
            <div className={`test-result ${testResult}`}>
              {testResult === 'success' ? (
                <>
                  <CheckCircle size={20} />
                  <span>Verbindung erfolgreich!</span>
                </>
              ) : (
                <>
                  <AlertCircle size={20} />
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>
                      Verbindung fehlgeschlagen
                    </div>
                    <div style={{ fontSize: '0.875rem' }}>{errorMessage}</div>
                  </div>
                </>
              )}
            </div>
          )}

          {testResult === 'error' && errorMessage.includes('CORS') && (
            <div className="cors-help">
              <h4>CORS-Konfiguration für Home Assistant:</h4>
              <ol>
                <li>Öffne die Datei <code>configuration.yaml</code> in Home Assistant</li>
                <li>Füge folgende Zeilen hinzu:
                  <pre>{`http:
  cors_allowed_origins:
    - "http://localhost:5173"      # Entwicklung
    - "http://127.0.0.1:5173"       # Entwicklung
    - "${window.location.origin}"  # Production${window.location.origin.startsWith('http://localhost') ? '\n    - "https://deine-domain.de"   # Deine Domain' : ''}`}</pre>
                </li>
                <li>Starte Home Assistant neu</li>
                <li>Versuche die Verbindung erneut</li>
              </ol>
              <p><strong>Wichtig:</strong> Verwende für Production immer HTTPS!</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handleTest}
            disabled={!url || !token || testing}
          >
            {testing ? 'Teste...' : 'Verbindung testen'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!url || !token}
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}
