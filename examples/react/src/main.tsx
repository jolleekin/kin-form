/// <reference types="vite/client" />
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DevtoolsProvider } from "@kintools/form-devtools-react";
import App from "./App.tsx";
import "./index.css";

// StrictMode/DevtoolsProvider are dev-only conveniences, not something a
// production build of the examples app should ship.
const app = import.meta.env.DEV
  ? (
    <StrictMode>
      <DevtoolsProvider>
        <App />
      </DevtoolsProvider>
    </StrictMode>
  )
  : <App />;

createRoot(document.getElementById("root")!).render(app);
