import { Context } from 'effect';

export interface ITime {
  timestamp: number;
}

export class TimeContext extends Context.Tag('TimeContext')<TimeContext, ITime>() {}
