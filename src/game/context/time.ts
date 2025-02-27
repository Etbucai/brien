import { Context } from 'effect';

export interface ITime {
  timestamp: number;
}

export class Time extends Context.Tag('Time')<Time, ITime>() {}
