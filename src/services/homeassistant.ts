import axios, { type AxiosInstance } from 'axios';

export interface HAConfig {
  url: string;
  token: string;
}

export interface HAEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

export interface HASystemHealth {
  cpu_percent?: number;
  memory_percent?: number;
  disk_use_percent?: number;
}

export interface HAHistoryItem {
  entity_id: string;
  state: string;
  attributes: Record<string, any>;
  last_changed: string;
  last_updated: string;
}

class HomeAssistantService {
  private client: AxiosInstance | null = null;
  private config: HAConfig | null = null;

  configure(config: HAConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.url,
      headers: {
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async testConnection(): Promise<boolean> {
    if (!this.client) {
      throw new Error('Home Assistant not configured');
    }
    try {
      const response = await this.client.get('/api/');
      return response.data.message === 'API running.';
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async getStates(): Promise<HAEntity[]> {
    if (!this.client) {
      throw new Error('Home Assistant not configured');
    }
    const response = await this.client.get<HAEntity[]>('/api/states');
    return response.data;
  }

  async getState(entityId: string): Promise<HAEntity> {
    if (!this.client) {
      throw new Error('Home Assistant not configured');
    }
    const response = await this.client.get<HAEntity>(`/api/states/${entityId}`);
    return response.data;
  }

  async getHistory(
    entityId?: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<HAHistoryItem[][]> {
    if (!this.client) {
      throw new Error('Home Assistant not configured');
    }

    const params = new URLSearchParams();
    if (startTime) {
      params.append('filter_entity_id', entityId || '');
    }

    const endpoint = entityId
      ? `/api/history/period${startTime ? `/${startTime.toISOString()}` : ''}`
      : '/api/history/period';

    const response = await this.client.get<HAHistoryItem[][]>(endpoint, {
      params: entityId ? { filter_entity_id: entityId } : undefined,
    });
    return response.data;
  }

  async getSystemHealth(): Promise<Record<string, any>> {
    if (!this.client) {
      throw new Error('Home Assistant not configured');
    }
    const response = await this.client.get('/api/system_health/info');
    return response.data;
  }

  async callService(
    domain: string,
    service: string,
    data?: Record<string, any>
  ): Promise<any> {
    if (!this.client) {
      throw new Error('Home Assistant not configured');
    }
    const response = await this.client.post(
      `/api/services/${domain}/${service}`,
      data
    );
    return response.data;
  }

  getConfig(): HAConfig | null {
    return this.config;
  }
}

export const haService = new HomeAssistantService();
