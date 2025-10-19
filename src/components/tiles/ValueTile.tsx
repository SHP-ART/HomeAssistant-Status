import { useEffect, useState } from 'react';
import { haService } from '../../services/homeassistant';
import type { ValueTile as ValueTileType } from '../../types/dashboard';
import { Activity } from 'lucide-react';

interface ValueTileProps {
  tile: ValueTileType;
}

export function ValueTile({ tile }: ValueTileProps) {
  const [value, setValue] = useState<string>('--');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadValue();
    const interval = setInterval(loadValue, 5000);
    return () => clearInterval(interval);
  }, [tile.entityId]);

  const loadValue = async () => {
    try {
      const entity = await haService.getState(tile.entityId);
      const displayValue = tile.unit
        ? `${entity.state} ${tile.unit}`
        : entity.state;
      setValue(displayValue);
      setLoading(false);
    } catch (error) {
      console.error('Error loading value:', error);
      setValue('Fehler');
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-tile value-tile">
      <div className="tile-header">
        {tile.icon ? (
          <span className="tile-icon">{tile.icon}</span>
        ) : (
          <Activity size={20} />
        )}
        <h3 className="tile-title">{tile.title}</h3>
      </div>
      <div className="tile-content">
        <div className="tile-value">
          {loading ? (
            <span className="tile-loading">Laden...</span>
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  );
}
