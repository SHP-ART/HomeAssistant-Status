// Dashboard Konfiguration Typen

export type TileType = 'value' | 'button' | 'toggle' | 'multi-value';
export type TileSize = '1x1' | '2x1' | '1x2' | '2x2';

export interface BaseTile {
  id: string;
  type: TileType;
  title: string;
  entityId?: string;
  order: number;
  size?: TileSize;  // Größe der Kachel (default: 1x1)
}

export interface EntityConfig {
  entityId: string;
  label?: string;
  unit?: string;
}

export interface ValueTile extends BaseTile {
  type: 'value';
  entityId: string;
  unit?: string;
  icon?: string;
  showLabel?: boolean;
}

export interface MultiValueTile extends BaseTile {
  type: 'multi-value';
  entities: EntityConfig[];
  icon?: string;
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

export type Tile = ValueTile | MultiValueTile | ButtonTile | ToggleTile;

export interface DashboardConfig {
  title: string;
  tiles: Tile[];
}

export const defaultDashboardConfig: DashboardConfig = {
  title: 'Home Assistant Status',
  tiles: [],
};
