export interface ILoggerService {
  info(context: string, message: string): void;
  warn(context: string, message: string): void;
  error<E>(context: string, message: string, err?: E): void;
  debug(context: string, message: string): void;
}
