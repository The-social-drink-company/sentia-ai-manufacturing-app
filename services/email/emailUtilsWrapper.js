// ES Module wrapper for emailUtils.js
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const EmailUtils = require('./emailUtils.cjs');

export default EmailUtils;