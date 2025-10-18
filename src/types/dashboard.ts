// Dashboard Konfiguration Typen

export type TileType = 'value' | 'button' | 'toggle';

export interface BaseTile {
  id: string;
  type: TileType;
  title: string;
  entityId?: string;
  order: number;
}

export interface ValueTile extends BaseTile {
  type: 'value';
  entityId: string;
  unit?: string;
  icon?: string;
  showLabel?: boolean;
}

export interface ButtonTile extends BaseTile {
  type: 'button';
  entityId: string;
  service: string;  // z.B. "turn_on", "turn_off", "toggle"
  icon?: string;
  color?: string;
}

export interface ToggleTile extends BaseTile {
  type: 'toggle';
  entityId: string;
  icon?: string;
}

export type Tile = ValueTile | ButtonTile | ToggleTile;

export interface DashboardConfig {
  title: string;
  tiles: Tile[];
}

export const defaultDashboardConfig: DashboardConfig = {
  title: 'Home Assistant Status',
  tiles: [],
};
