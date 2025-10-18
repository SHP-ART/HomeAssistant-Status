import { useEffect, useState } from 'react';
import { haService, type HAEntity } from '../services/homeassistant';
import {
  Lightbulb,
  Thermometer,
  Droplets,
  Power,
  ToggleLeft,
  ToggleRight,
  Zap,
  Wind,
  Sun,
  Moon
} from 'lucide-react';

export function DeviceStatus() {
  const [entities, setEntities] = useState<HAEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEntities();
    const interval = setInterval(loadEntities, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadEntities = async () => {
    try {
      const states = await haService.getStates();
      // Filter for relevant entities (lights, switches, sensors)
      const filtered = states.filter((entity) => {
        const domain = entity.entity_id.split('.')[0];
        return ['light', 'switch', 'sensor', 'binary_sensor', 'climate'].includes(domain);
      });
      setEntities(filtered);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Geräte');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEntityIcon = (entityId: string, state: string) => {
    const domain = entityId.split('.')[0];
    const isOn = state === 'on';

    switch (domain) {
      case 'light':
        return isOn ? <Lightbulb className="icon-on" /> : <Lightbulb className="icon-off" />;
      case 'switch':
        return isOn ? <ToggleRight className="icon-on" /> : <ToggleLeft className="icon-off" />;
      case 'binary_sensor':
        return isOn ? <Zap className="icon-on" /> : <Zap className="icon-off" />;
      case 'sensor':
        if (entityId.includes('temperature')) return <Thermometer />;
        if (entityId.includes('humidity')) return <Droplets />;
        if (entityId.includes('power')) return <Power />;
        if (entityId.includes('wind')) return <Wind />;
        return <Sun />;
      case 'climate':
        return <Thermometer />;
      default:
        return <Power />;
    }
  };

  const getFriendlyName = (entity: HAEntity): string => {
    return entity.attributes.friendly_name || entity.entity_id;
  };

  const getStateDisplay = (entity: HAEntity): string => {
    const domain = entity.entity_id.split('.')[0];

    if (domain === 'sensor' || domain === 'climate') {
      const unit = entity.attributes.unit_of_measurement || '';
      return `${entity.state} ${unit}`.trim();
    }

    if (entity.state === 'on') return 'Ein';
    if (entity.state === 'off') return 'Aus';
    if (entity.state === 'unavailable') return 'Nicht verfügbar';

    return entity.state;
  };

  const getStateClass = (entity: HAEntity): string => {
    if (entity.state === 'unavailable') return 'state-unavailable';
    if (entity.state === 'on') return 'state-on';
    if (entity.state === 'off') return 'state-off';
    return 'state-neutral';
  };

  if (loading) {
    return <div className="loading">Lade Geräte...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const groupedEntities = entities.reduce((acc, entity) => {
    const domain = entity.entity_id.split('.')[0];
    if (!acc[domain]) acc[domain] = [];
    acc[domain].push(entity);
    return acc;
  }, {} as Record<string, HAEntity[]>);

  const domainNames: Record<string, string> = {
    light: 'Lichter',
    switch: 'Schalter',
    sensor: 'Sensoren',
    binary_sensor: 'Binäre Sensoren',
    climate: 'Klima',
  };

  return (
    <div className="device-status">
      <h2>Gerätestatus</h2>
      {Object.entries(groupedEntities).map(([domain, domainEntities]) => (
        <div key={domain} className="device-group">
          <h3>{domainNames[domain] || domain}</h3>
          <div className="device-grid">
            {domainEntities.slice(0, 12).map((entity) => (
              <div key={entity.entity_id} className={`device-card ${getStateClass(entity)}`}>
                <div className="device-icon">
                  {getEntityIcon(entity.entity_id, entity.state)}
                </div>
                <div className="device-info">
                  <div className="device-name">{getFriendlyName(entity)}</div>
                  <div className="device-state">{getStateDisplay(entity)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
