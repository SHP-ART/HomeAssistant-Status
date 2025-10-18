import { useEffect, useState } from 'react';
import { haService, type HAHistoryItem } from '../services/homeassistant';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

interface ChartData {
  timestamp: string;
  value: number;
}

export function HistoricalChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [availableEntities, setAvailableEntities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAvailableEntities();
  }, []);

  useEffect(() => {
    if (selectedEntity) {
      loadHistoricalData(selectedEntity);
    }
  }, [selectedEntity]);

  const loadAvailableEntities = async () => {
    try {
      const states = await haService.getStates();
      // Filter for sensors with numeric values
      const numericSensors = states
        .filter((entity) => {
          const domain = entity.entity_id.split('.')[0];
          const isNumeric = !isNaN(parseFloat(entity.state));
          return domain === 'sensor' && isNumeric;
        })
        .map((entity) => entity.entity_id);

      setAvailableEntities(numericSensors);

      // Auto-select first temperature or humidity sensor
      const preferredSensor =
        numericSensors.find((id) => id.includes('temperature')) ||
        numericSensors.find((id) => id.includes('humidity')) ||
        numericSensors[0];

      if (preferredSensor) {
        setSelectedEntity(preferredSensor);
      }
    } catch (err) {
      console.error('Error loading entities:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistoricalData = async (entityId: string) => {
    try {
      setLoading(true);
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      const history = await haService.getHistory(entityId, startTime, endTime);

      if (history && history[0]) {
        const data: ChartData[] = history[0]
          .filter((item) => !isNaN(parseFloat(item.state)))
          .map((item) => ({
            timestamp: new Date(item.last_changed).toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            value: parseFloat(item.state),
          }));

        // Reduce data points if too many (keep every nth point)
        const maxPoints = 50;
        if (data.length > maxPoints) {
          const step = Math.ceil(data.length / maxPoints);
          const reduced = data.filter((_, index) => index % step === 0);
          setChartData(reduced);
        } else {
          setChartData(data);
        }
      }

      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der historischen Daten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEntityName = (entityId: string): string => {
    return entityId
      .split('.')[1]
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading && availableEntities.length === 0) {
    return <div className="loading">Lade historische Daten...</div>;
  }

  if (availableEntities.length === 0) {
    return (
      <div className="historical-chart">
        <h2>Historische Daten</h2>
        <div className="info">Keine numerischen Sensoren gefunden</div>
      </div>
    );
  }

  return (
    <div className="historical-chart">
      <div className="chart-header">
        <div className="chart-title">
          <TrendingUp size={24} />
          <h2>Historische Daten (24h)</h2>
        </div>
        <select
          className="entity-select"
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
        >
          {availableEntities.map((entityId) => (
            <option key={entityId} value={entityId}>
              {getEntityName(entityId)}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="error">{error}</div>
      ) : loading ? (
        <div className="loading">Lade Daten...</div>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f3f4f6',
              }}
            />
            <Legend wrapperStyle={{ color: '#9ca3af' }} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name={getEntityName(selectedEntity)}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="info">Keine Daten verfügbar</div>
      )}
    </div>
  );
}
