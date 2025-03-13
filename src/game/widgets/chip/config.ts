import { Context } from 'effect';

export interface ChipConfig {
  size: number;
  gap: number;
  backgroundColor: string;
  columnCount: number;
  rowCount: number;
}

export class ChipConfigContext extends Context.Tag('ChipConfigContext')<
  ChipConfigContext,
  ChipConfig
>() {}
