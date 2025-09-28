import * as runtime from "react/jsx-runtime"

const jsxDEV = runtime.jsxDEV ?? runtime.jsx

export const Fragment = runtime.Fragment
export const jsx = runtime.jsx
export const jsxs = runtime.jsxs
export { jsxDEV }
export default {
  Fragment,
  jsx,
  jsxs,
  jsxDEV
}
