const namespace = 'sentia'
const allowed = () => import.meta.env?.MODE !== 'production'

export const logWarn = (...args) => {
  if (allowed()) {
    console.warn(`[${namespace}]`, ...args)
  }
}

export const logError = (...args) => {
  if (allowed()) {
    console.error(`[${namespace}]`, ...args)
  }
}

export const logInfo = (...args) => {
  logWarn(...args)
}

export const logDebug = (...args) => {
  logWarn(...args)
}
