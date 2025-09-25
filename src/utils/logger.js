/* eslint-disable no-console */
const formatMessage = (level, message, ...details) => {
  const timestamp = new Date().toISOString()
  return [`[${timestamp}] [${level}] ${message}`, ...details]
}

export const logInfo = (message, ...details) => {
  console.info(...formatMessage('info', message, ...details))
}

export const logWarn = (message, ...details) => {
  console.warn(...formatMessage('warn', message, ...details))
}

export const logError = (message, ...details) => {
  console.error(...formatMessage('error', message, ...details))
}

export const logDebug = (message, ...details) => {
  if (import.meta.env?.DEV) {
    console.debug(...formatMessage('debug', message, ...details))
  }
}

export default {
  info: logInfo,
  warn: logWarn,
  error: logError,
  debug: logDebug
}
