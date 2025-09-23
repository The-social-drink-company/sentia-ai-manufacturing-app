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
export default devLog;
