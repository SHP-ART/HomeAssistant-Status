import { useEffect, useState } from 'react';
import { haService } from '../../services/homeassistant';
import type { ToggleTile as ToggleTileType } from '../../types/dashboard';
import { ToggleLeft, ToggleRight } from 'lucide-react';

interface ToggleTileProps {
  tile: ToggleTileType;
}

export function ToggleTile({ tile }: ToggleTileProps) {
  const [isOn, setIsOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadState();
    const interval = setInterval(loadState, 5000);
    return () => clearInterval(interval);
  }, [tile.entityId]);

  const loadState = async () => {
    try {
      const entity = await haService.getState(tile.entityId);
      setIsOn(entity.state === 'on');
      setLoading(false);
    } catch (error) {
      console.error('Error loading state:', error);
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (toggling) return;

    setToggling(true);
    try {
      const domain = tile.entityId.split('.')[0];
      await haService.callService(domain, 'toggle', {
        entity_id: tile.entityId,
      });
      // Optimistic update
      setIsOn(!isOn);
      // Reload after short delay to confirm
      setTimeout(loadState, 500);
    } catch (error) {
      console.error('Error toggling:', error);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className={`dashboard-tile toggle-tile ${isOn ? 'tile-on' : 'tile-off'}`}>
      <div className="tile-header">
        {tile.icon ? (
          <span className="tile-icon">{tile.icon}</span>
        ) : isOn ? (
          <ToggleRight size={20} />
        ) : (
          <ToggleLeft size={20} />
        )}
        <h3 className="tile-title">{tile.title}</h3>
      </div>
      <div className="tile-content">
        <button
          className={`tile-toggle-button ${isOn ? 'active' : ''}`}
          onClick={handleToggle}
          disabled={loading || toggling}
        >
          <div className="toggle-track">
            <div className="toggle-thumb"></div>
          </div>
          <span className="toggle-label">
            {loading ? 'Laden...' : toggling ? 'Schalte...' : isOn ? 'Ein' : 'Aus'}
          </span>
        </button>
      </div>
    </div>
  );
}
