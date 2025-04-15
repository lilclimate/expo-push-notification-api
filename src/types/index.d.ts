import { Context } from 'koa';
import { IUser } from '../models/User';

declare module 'koa' {
  interface Context {
    user?: IUser;
  }
} 