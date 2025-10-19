import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Eye } from 'lucide-react';
import type { Tile, TileType, TileSize, EntityConfig } from '../types/dashboard';
import { ValueTile } from './tiles/ValueTile';
import { MultiValueTile } from './tiles/MultiValueTile';
import { ButtonTile } from './tiles/ButtonTile';
import { ToggleTile } from './tiles/ToggleTile';

interface TileEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tile: Tile) => void;
  onDelete?: () => void;
  tile?: Tile;
}

export function TileEditor({ isOpen, onClose, onSave, onDelete, tile }: TileEditorProps) {
  const [type, setType] = useState<TileType>('value');
  const [title, setTitle] = useState('');
  const [entityId, setEntityId] = useState('');
  const [unit, setUnit] = useState('');
  const [service, setService] = useState('toggle');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('');
  const [size, setSize] = useState<TileSize>('1x1');
  const [entities, setEntities] = useState<EntityConfig[]>([{ entityId: '', label: '', unit: '' }]);

  useEffect(() => {
    if (tile) {
      setType(tile.type);
      setTitle(tile.title);
      setEntityId(tile.entityId || '');
      setSize(tile.size || '1x1');
      if (tile.type === 'value') {
        setUnit(tile.unit || '');
      }
      if (tile.type === 'button') {
        setService(tile.service);
        setColor(tile.color || '');
      }
      if (tile.type === 'multi-value') {
        setEntities(tile.entities || [{ entityId: '', label: '', unit: '' }]);
      }
      setIcon(tile.icon || '');
    } else {
      // Reset
      setType('value');
      setTitle('');
      setEntityId('');
      setUnit('');
      setService('toggle');
      setIcon('');
      setColor('');
      setSize('1x1');
      setEntities([{ entityId: '', label: '', unit: '' }]);
    }
  }, [tile, isOpen]);

  const handleSave = () => {
    // Validation for different tile types
    if (!title) return;
    if (type === 'multi-value') {
      // For multi-value, check if at least one entity is configured
      if (entities.length === 0 || !entities[0].entityId) return;
    } else {
      // For other types, entityId is required
      if (!entityId) return;
    }

    const baseTile = {
      id: tile?.id || `tile_${Date.now()}`,
      title,
      order: tile?.order || 0,
      icon: icon || undefined,
      size: size,
    };

    let newTile: Tile;

    switch (type) {
      case 'value':
        newTile = {
          ...baseTile,
          type: 'value',
          entityId,
          unit: unit || undefined,
          showLabel: true,
        };
        break;
      case 'button':
        newTile = {
          ...baseTile,
          type: 'button',
          entityId,
          service,
          color: color || undefined,
        };
        break;
      case 'toggle':
        newTile = {
          ...baseTile,
          type: 'toggle',
          entityId,
        };
        break;
      case 'multi-value':
        newTile = {
          ...baseTile,
          type: 'multi-value',
          entities: entities.filter(e => e.entityId.trim() !== ''),
        };
        break;
    }

    onSave(newTile);
    onClose();
  };

  const handleAddEntity = () => {
    setEntities([...entities, { entityId: '', label: '', unit: '' }]);
  };

  const handleRemoveEntity = (index: number) => {
    setEntities(entities.filter((_, i) => i !== index));
  };

  const handleEntityChange = (index: number, field: keyof EntityConfig, value: string) => {
    const newEntities = [...entities];
    newEntities[index] = { ...newEntities[index], [field]: value };
    setEntities(newEntities);
  };

  // Generate preview tile with current settings
  const getPreviewTile = (): Tile | null => {
    if (!title) return null;

    const baseTile = {
      id: 'preview',
      title: title || 'Vorschau',
      order: 0,
      icon: icon || undefined,
      size: size,
    };

    switch (type) {
      case 'value':
        return {
          ...baseTile,
          type: 'value',
          entityId: entityId || 'sensor.preview',
          unit: unit || '°C',
          showLabel: true,
        };
      case 'button':
        return {
          ...baseTile,
          type: 'button',
          entityId: entityId || 'script.preview',
          service: service,
          color: color || undefined,
        };
      case 'toggle':
        return {
          ...baseTile,
          type: 'toggle',
          entityId: entityId || 'light.preview',
        };
      case 'multi-value':
        const validEntities = entities.filter(e => e.entityId.trim() !== '');
        if (validEntities.length === 0) {
          return {
            ...baseTile,
            type: 'multi-value',
            entities: [
              { entityId: 'sensor.cpu', label: 'CPU', unit: '%' },
              { entityId: 'sensor.ram', label: 'RAM', unit: '%' },
            ],
          };
        }
        return {
          ...baseTile,
          type: 'multi-value',
          entities: validEntities,
        };
      default:
        return null;
    }
  };

  const previewTile = getPreviewTile();

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tile-editor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Plus size={24} />
            <h2>{tile ? 'Kachel bearbeiten' : 'Neue Kachel'}</h2>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body tile-editor-body">
          <div className="tile-editor-form">
            <div className="form-group">
              <label htmlFor="tile-type">Kachel-Typ</label>
              <select
                id="tile-type"
                value={type}
                onChange={(e) => setType(e.target.value as TileType)}
                className="form-input"
              >
                <option value="value">Wert-Anzeige</option>
                <option value="multi-value">Multi-Wert-Anzeige</option>
                <option value="toggle">Schalter (Toggle)</option>
                <option value="button">Taster (Button)</option>
              </select>
              <small>
                {type === 'value' && 'Zeigt einen Sensor-Wert an (z.B. Temperatur, Feuchtigkeit)'}
                {type === 'multi-value' && 'Zeigt mehrere Sensor-Werte in einer Kachel an'}
                {type === 'toggle' && 'Ein/Aus-Schalter für Geräte (Licht, Steckdose, etc.)'}
                {type === 'button' && 'Einmaliger Taster zum Ausführen einer Aktion'}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="tile-title">Titel</label>
              <input
                id="tile-title"
                type="text"
                placeholder="z.B. Wohnzimmer Temperatur"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tile-size">Kachelgröße</label>
              <select
                id="tile-size"
                value={size}
                onChange={(e) => setSize(e.target.value as TileSize)}
                className="form-input"
              >
                <option value="1x1">1x1 (Klein)</option>
                <option value="2x1">2x1 (Breit)</option>
                <option value="1x2">1x2 (Hoch)</option>
                <option value="2x2">2x2 (Groß)</option>
              </select>
              <small>Größe der Kachel im Dashboard-Raster</small>
            </div>

            {type !== 'multi-value' && (
              <div className="form-group">
                <label htmlFor="tile-entity">Entity ID</label>
                <input
                  id="tile-entity"
                  type="text"
                  placeholder="z.B. sensor.temperature_living_room"
                  value={entityId}
                  onChange={(e) => setEntityId(e.target.value)}
                  className="form-input"
                />
                <small>Die Entity ID aus Home Assistant (z.B. light.wohnzimmer, sensor.temperatur)</small>
              </div>
            )}

            {type === 'multi-value' && (
              <div className="form-group">
                <label>Entities</label>
                <div className="entities-list">
                  {entities.map((entity, index) => (
                    <div key={index} className="entity-item">
                      <div className="entity-fields">
                        <input
                          type="text"
                          placeholder="Entity ID (z.B. sensor.temperatur)"
                          value={entity.entityId}
                          onChange={(e) => handleEntityChange(index, 'entityId', e.target.value)}
                          className="form-input"
                        />
                        <input
                          type="text"
                          placeholder="Label (optional)"
                          value={entity.label || ''}
                          onChange={(e) => handleEntityChange(index, 'label', e.target.value)}
                          className="form-input"
                        />
                        <input
                          type="text"
                          placeholder="Einheit (optional, z.B. °C)"
                          value={entity.unit || ''}
                          onChange={(e) => handleEntityChange(index, 'unit', e.target.value)}
                          className="form-input"
                        />
                      </div>
                      {entities.length > 1 && (
                        <button
                          type="button"
                          className="btn-icon btn-danger"
                          onClick={() => handleRemoveEntity(index)}
                          title="Entfernen"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleAddEntity}
                >
                  <Plus size={18} />
                  Entity hinzufügen
                </button>
              </div>
            )}

            {type === 'value' && (
              <div className="form-group">
                <label htmlFor="tile-unit">Einheit (optional)</label>
                <input
                  id="tile-unit"
                  type="text"
                  placeholder="z.B. °C, %, W"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="form-input"
                />
              </div>
            )}

            {type === 'button' && (
              <>
                <div className="form-group">
                  <label htmlFor="tile-service">Aktion</label>
                  <select
                    id="tile-service"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="form-input"
                  >
                    <option value="turn_on">Einschalten</option>
                    <option value="turn_off">Ausschalten</option>
                    <option value="toggle">Umschalten</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="tile-color">Farbe (optional)</label>
                  <input
                    id="tile-color"
                    type="color"
                    value={color || '#3b82f6'}
                    onChange={(e) => setColor(e.target.value)}
                    className="form-input color-input"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="tile-icon">Icon (optional, Emoji)</label>
              <input
                id="tile-icon"
                type="text"
                placeholder="z.B. 🌡️, 💡, 🔌"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="form-input"
                maxLength={2}
              />
              <small>Du kannst ein Emoji als Icon verwenden</small>
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="tile-editor-preview">
            <div className="preview-header">
              <Eye size={20} />
              <h3>Live-Vorschau</h3>
            </div>
            <div className="preview-container">
              {previewTile ? (
                <div className="preview-tile" data-size={size}>
                  {previewTile.type === 'value' && <ValueTile tile={previewTile} />}
                  {previewTile.type === 'multi-value' && <MultiValueTile tile={previewTile} />}
                  {previewTile.type === 'button' && <ButtonTile tile={previewTile} readOnly={true} />}
                  {previewTile.type === 'toggle' && <ToggleTile tile={previewTile} readOnly={true} />}
                </div>
              ) : (
                <div className="preview-placeholder">
                  <Eye size={48} />
                  <p>Gib einen Titel ein, um die Vorschau zu sehen</p>
                </div>
              )}
              <small className="preview-hint">
                Die Vorschau zeigt Mock-Daten. Nach dem Speichern werden echte Daten von Home Assistant geladen.
              </small>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {tile && onDelete && (
            <button className="btn btn-danger" onClick={onDelete}>
              <Trash2 size={20} />
              Löschen
            </button>
          )}
          <div style={{ flex: 1 }}></div>
          <button className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={
              !title ||
              (type === 'multi-value'
                ? entities.length === 0 || !entities[0].entityId
                : !entityId)
            }
          >
            {tile ? 'Speichern' : 'Hinzufügen'}
          </button>
        </div>
      </div>
    </div>
  );
}
