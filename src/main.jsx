import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { ClerkProvider } from "@clerk/clerk-react"
import "./index.css"
import App from "./App-final.jsx"

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
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      navigate={(to) => window.location.href = to}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#2563eb",
          colorTextOnPrimaryBackground: "#ffffff",
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          colorInputText: "#1f2937",
          fontFamily: "\"Inter\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
          borderRadius: "0.5rem"
        },
        elements: {
          card: {
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
            border: "1px solid #e5e7eb"
          },
          headerTitle: {
            fontSize: "1.5rem",
            fontWeight: "600"
          },
          headerSubtitle: {
            color: "#6b7280"
          }
        }
      }}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)
