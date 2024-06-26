export const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
}

export class Logger {
  static readonly LOG_LEVELS = LOG_LEVELS

  private logLevel = LOG_LEVELS.info
  private readonly loggerName: string = 'Logger'

  constructor (loggerName: string, logLevel: number = LOG_LEVELS.info) {
    this.logLevel = logLevel
    this.loggerName = loggerName
  }

  changeLogLevel (level: number | string): void {
    if (typeof level === 'string') {
      level = Number.parseInt(level, 10)
    }
    this.logLevel = level
  }

  private log (level: number, ...args: any[]): void {
    if (this.logLevel <= level) {
      console.log(`[${this.loggerName}]`, ...args)
    }
  }

  debug (...args: any[]): void { this.log(LOG_LEVELS.debug, ...args) }
  info (...args: any[]): void { this.log(LOG_LEVELS.info, ...args) }
  warn (...args: any[]): void { this.log(LOG_LEVELS.warn, ...args) }
  error (...args: any[]): void { this.log(LOG_LEVELS.error, ...args) }
}
