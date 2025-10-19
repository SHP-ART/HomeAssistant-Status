import { useState } from 'react';
import { haService } from '../../services/homeassistant';
import type { ButtonTile as ButtonTileType } from '../../types/dashboard';
import { Power } from 'lucide-react';

interface ButtonTileProps {
  tile: ButtonTileType;
  readOnly?: boolean;
}

export function ButtonTile({ tile, readOnly = false }: ButtonTileProps) {
  const [executing, setExecuting] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleClick = async () => {
    if (executing || readOnly) return;

    setExecuting(true);
    try {
      const domain = tile.entityId.split('.')[0];
      await haService.callService(domain, tile.service, {
        entity_id: tile.entityId,
      });
      setLastAction(new Date().toLocaleTimeString('de-DE'));
      setTimeout(() => setLastAction(null), 3000);
    } catch (error) {
      console.error('Error executing service:', error);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="dashboard-tile button-tile">
      <div className="tile-header">
        {tile.icon ? (
          <span className="tile-icon">{tile.icon}</span>
        ) : (
          <Power size={20} />
        )}
        <h3 className="tile-title">{tile.title}</h3>
      </div>
      <div className="tile-content">
        <button
          className={`tile-button ${tile.color || 'primary'}`}
          onClick={handleClick}
          disabled={executing || readOnly}
          style={tile.color ? { background: tile.color } : undefined}
          title={readOnly ? 'Nur im Admin-Bereich verfügbar' : undefined}
        >
          {executing ? 'Wird ausgeführt...' : readOnly ? '🔒 Gesperrt' : 'Ausführen'}
        </button>
        {readOnly && (
          <div className="tile-status" style={{ color: '#f59e0b' }}>
            ⚠️ Steuerung nur im Admin-Bereich
          </div>
        )}
        {!readOnly && lastAction && (
          <div className="tile-status">Zuletzt: {lastAction}</div>
        )}
      </div>
    </div>
  );
}
