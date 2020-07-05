/* tslint:disable */
/* eslint-disable */
interface Config {
  database: Database;
  http: Http;
  logger: Logger;
  ssh: Ssh;
  cognito: Cognito;
}
interface Cognito {
  poolData: PoolData;
  keys: Key[];
}
interface Key {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
  pem: string;
}
interface PoolData {
  UserPoolId: string;
  ClientId: string;
}
interface Ssh {
  enabled: boolean;
  forward: string;
  host: string;
}
interface Logger {
  level: string;
  filter: number;
  filename: string;
}
interface Http {
  port: number;
}
interface Database {
  url: string;
  options: Options;
  dbName: string;
}
interface Options {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
}