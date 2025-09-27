// Development logging utility
const devLog = {
  log: (...args) => {},
  info: (...args) => {},
  warn: (...args) => {},
  error: (...args) => {},
  debug: (...args) => {},
  table: (_data) => {},
  time: (_label) => {},
  timeEnd: (_label) => {},
  group: (_label) => {},
  groupCollapsed: (_label) => {},
  groupEnd: () => {}
};

// Export both as default and named export for compatibility
export default devLog;
export { devLog };
