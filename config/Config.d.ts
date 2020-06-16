/* tslint:disable */
/* eslint-disable */
interface Config {
  database: Database;
  http: Http;
  logger: Logger;
  ssh: Ssh;
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
  sender: string;
}
interface Options {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
}