// Development logging utility
const devLog = {
  log: (...args) => {},
  info: (...args) => {},
  warn: (...args) => {},
  error: (...args) => {},
  debug: (...args) => {},
  table: (data) => {},
  time: (label) => {},
  timeEnd: (label) => {},
  group: (label) => {},
  groupCollapsed: (label) => {},
  groupEnd: () => {}
};

// Export both as default and named export for compatibility
export default devLog;
export { devLog };

