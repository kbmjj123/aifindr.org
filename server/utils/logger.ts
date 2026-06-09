type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

interface LogEntry {
  level: string
  time: string
  module: string
  message: string
  [key: string]: unknown
}

let currentMinLevel: LogLevel | null = null

function minLevel(): LogLevel {
  if (currentMinLevel) return currentMinLevel
  currentMinLevel = import.meta.dev ? 'debug' : 'info'
  return currentMinLevel
}

export function setLogLevel(level: LogLevel) {
  currentMinLevel = level
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_RANK[level] >= LEVEL_RANK[minLevel()]
}

function log(level: LogLevel, module: string, message: string, data?: Record<string, unknown>) {
  if (!shouldLog(level)) return

  const entry: LogEntry = {
    level: level.toUpperCase(),
    time: new Date().toISOString(),
    module,
    message,
    ...(data ? { ...data } : {}),
  }

  const str = JSON.stringify(entry)

  if (level === 'error') console.error(str)
  else if (level === 'warn') console.warn(str)
  else console.log(str)
}

export const logger = {
  debug: (module: string, message: string, data?: Record<string, unknown>) => log('debug', module, message, data),
  info:  (module: string, message: string, data?: Record<string, unknown>) => log('info',  module, message, data),
  warn:  (module: string, message: string, data?: Record<string, unknown>) => log('warn',  module, message, data),
  error: (module: string, message: string, data?: Record<string, unknown>) => log('error', module, message, data),
}
