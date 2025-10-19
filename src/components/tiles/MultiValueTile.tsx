import { useEffect, useState } from 'react';
import { haService } from '../../services/homeassistant';
import type { MultiValueTile as MultiValueTileType } from '../../types/dashboard';
import { Activity } from 'lucide-react';

interface MultiValueTileProps {
  tile: MultiValueTileType;
}

interface EntityValue {
  entityId: string;
  value: string;
  loading: boolean;
}

export function MultiValueTile({ tile }: MultiValueTileProps) {
  const [values, setValues] = useState<EntityValue[]>([]);

  useEffect(() => {
    // Initialize values
    const initialValues = tile.entities.map((entity) => ({
      entityId: entity.entityId,
      value: '--',
      loading: true,
    }));
    setValues(initialValues);

    loadAllValues();
    const interval = setInterval(loadAllValues, 5000);
    return () => clearInterval(interval);
  }, [tile.entities]);

  const loadAllValues = async () => {
    const newValues = await Promise.all(
      tile.entities.map(async (entity) => {
        try {
          const state = await haService.getState(entity.entityId);
          const displayValue = entity.unit
            ? `${state.state} ${entity.unit}`
            : state.state;
          return {
            entityId: entity.entityId,
            value: displayValue,
            loading: false,
          };
        } catch (error) {
          console.error(`Error loading ${entity.entityId}:`, error);
          return {
            entityId: entity.entityId,
            value: 'Fehler',
            loading: false,
          };
        }
      })
    );
    setValues(newValues);
  };

  return (
    <div className="dashboard-tile multi-value-tile">
      <div className="tile-header">
        {tile.icon ? (
          <span className="tile-icon">{tile.icon}</span>
        ) : (
          <Activity size={20} />
        )}
        <h3 className="tile-title">{tile.title}</h3>
      </div>
      <div className="tile-content">
        <div className="multi-values">
          {tile.entities.map((entity, index) => {
            const valueData = values.find((v) => v.entityId === entity.entityId);
            return (
              <div key={entity.entityId} className="multi-value-item">
                {entity.label && (
                  <div className="multi-value-label">
                    {entity.label}
                  </div>
                )}
                <div className="multi-value-value">
                  {valueData?.loading ? (
                    <span className="tile-loading">...</span>
                  ) : (
                    valueData?.value || '--'
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
