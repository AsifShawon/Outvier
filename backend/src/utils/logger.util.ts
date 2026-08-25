/**
 * logger.util.ts — Structured JSON Logger with Correlation IDs.
 * Provides structured, parseable JSON logs with ISO timestamps, log levels,
 * request tracing identifiers, error stack serialization, and context metadata.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  service?: string;
  [key: string]: any;
}

export class StructuredLogger {
  private static formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): string {
    const entry: Record<string, any> = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      service: context?.service || 'outvier-backend',
      environment: process.env.NODE_ENV || 'development',
      ...context,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return JSON.stringify(entry);
  }

  public static info(message: string, context?: LogContext): void {
    console.log(this.formatLog('info', message, context));
  }

  public static warn(message: string, context?: LogContext): void {
    console.warn(this.formatLog('warn', message, context));
  }

  public static error(message: string, context?: LogContext, error?: Error): void {
    console.error(this.formatLog('error', message, context, error));
  }

  public static debug(message: string, context?: LogContext): void {
    if (process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV === 'development') {
      console.debug(this.formatLog('debug', message, context));
    }
  }
}

export default StructuredLogger;
