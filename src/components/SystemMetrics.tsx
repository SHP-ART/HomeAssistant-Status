import { useEffect, useState } from 'react';
import { haService } from '../services/homeassistant';
import { Cpu, HardDrive, Activity, Clock } from 'lucide-react';

interface SystemMetric {
  label: string;
  value: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}

export function SystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [uptime, setUptime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const states = await haService.getStates();

      // Try to find system monitor sensors
      const cpuSensor = states.find(s =>
        s.entity_id.includes('processor_use') ||
        s.entity_id.includes('cpu_percent')
      );

      const memorySensor = states.find(s =>
        s.entity_id.includes('memory_use') ||
        s.entity_id.includes('memory_percent')
      );

      const diskSensor = states.find(s =>
        s.entity_id.includes('disk_use') ||
        s.entity_id.includes('disk_percent')
      );

      const uptimeSensor = states.find(s =>
        s.entity_id.includes('uptime')
      );

      const newMetrics: SystemMetric[] = [];

      if (cpuSensor) {
        newMetrics.push({
          label: 'CPU Auslastung',
          value: parseFloat(cpuSensor.state) || 0,
          unit: '%',
          icon: <Cpu size={24} />,
          color: getColorForPercentage(parseFloat(cpuSensor.state) || 0),
        });
      }

      if (memorySensor) {
        newMetrics.push({
          label: 'RAM Auslastung',
          value: parseFloat(memorySensor.state) || 0,
          unit: '%',
          icon: <Activity size={24} />,
          color: getColorForPercentage(parseFloat(memorySensor.state) || 0),
        });
      }

      if (diskSensor) {
        newMetrics.push({
          label: 'Festplatten Auslastung',
          value: parseFloat(diskSensor.state) || 0,
          unit: '%',
          icon: <HardDrive size={24} />,
          color: getColorForPercentage(parseFloat(diskSensor.state) || 0),
        });
      }

      if (uptimeSensor) {
        setUptime(formatUptime(uptimeSensor.state));
      }

      // If no sensors found, add placeholders
      if (newMetrics.length === 0) {
        newMetrics.push(
          {
            label: 'CPU Auslastung',
            value: 0,
            unit: '%',
            icon: <Cpu size={24} />,
            color: '#6b7280',
          },
          {
            label: 'RAM Auslastung',
            value: 0,
            unit: '%',
            icon: <Activity size={24} />,
            color: '#6b7280',
          },
          {
            label: 'Festplatten Auslastung',
            value: 0,
            unit: '%',
            icon: <HardDrive size={24} />,
            color: '#6b7280',
          }
        );
      }

      setMetrics(newMetrics);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der System-Metriken');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getColorForPercentage = (percentage: number): string => {
    if (percentage < 50) return '#10b981'; // green
    if (percentage < 75) return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  const formatUptime = (uptimeValue: string): string => {
    // Try to parse if it's a number (minutes or hours)
    const num = parseFloat(uptimeValue);
    if (!isNaN(num)) {
      const days = Math.floor(num / 1440);
      const hours = Math.floor((num % 1440) / 60);
      const minutes = Math.floor(num % 60);

      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }
    return uptimeValue;
  };

  if (loading) {
    return <div className="loading">Lade System-Metriken...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="system-metrics">
      <h2>System-Metriken</h2>
      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-header">
              <div className="metric-icon" style={{ color: metric.color }}>
                {metric.icon}
              </div>
              <div className="metric-label">{metric.label}</div>
            </div>
            <div className="metric-value">
              {metric.value.toFixed(1)}{metric.unit}
            </div>
            <div className="metric-progress">
              <div
                className="metric-progress-bar"
                style={{
                  width: `${Math.min(metric.value, 100)}%`,
                  backgroundColor: metric.color,
                }}
              />
            </div>
          </div>
        ))}
        {uptime && (
          <div className="metric-card">
            <div className="metric-header">
              <div className="metric-icon" style={{ color: '#3b82f6' }}>
                <Clock size={24} />
              </div>
              <div className="metric-label">Uptime</div>
            </div>
            <div className="metric-value">{uptime}</div>
          </div>
        )}
      </div>
    </div>
  );
}
