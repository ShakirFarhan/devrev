import Redis from 'ioredis';
import * as Config from '../config/index';
const pub = new Redis({
  host: Config.REDIS_HOST as string,
  port: Config.REDIS_PORT as unknown as number,
  username: Config.REDIS_USERNAME as string,
  password: Config.REDIS_PASSWORD as string,
});
const sub = new Redis({
  host: Config.REDIS_HOST as string,
  port: Config.REDIS_PORT as unknown as number,
  username: Config.REDIS_USERNAME as string,
  password: Config.REDIS_PASSWORD as string,
});
export { pub, sub };
