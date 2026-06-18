import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./styles/globals.css";
import { CompactViewProvider } from "./contexts/CompactViewContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AuthProvider } from "./contexts/AuthContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <SettingsProvider>
      <CompactViewProvider>
        <App />
      </CompactViewProvider>
    </SettingsProvider>
  </AuthProvider>
);