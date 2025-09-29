import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ClerkProvider } from "@clerk/clerk-react"
import "./index.css"
import App from "./App-enterprise-reborn.jsx"

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.warn("Missing Publishable Key - Clerk features will be limited")
}

// Remove fallback loader once React loads
const fallbackLoader = document.getElementById("fallback-loader")
if (fallbackLoader) {
  fallbackLoader.style.display = "none"
}

console.log("[Clerk] Initializing with publishable key:", PUBLISHABLE_KEY?.substring(0, 20) + "...")

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
