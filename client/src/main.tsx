import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { AthenaErrorBoundary } from "./app/AthenaErrorBoundary";
import { I18nProvider } from "./i18n/I18nProvider";
import { registerServiceWorker } from "./shared/lib/serviceWorker";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("athena_root_missing");
}

delete rootElement.dataset.athenaBootstrap;

createRoot(rootElement).render(
  <StrictMode>
    <AthenaErrorBoundary>
      <I18nProvider>
        <App />
      </I18nProvider>
    </AthenaErrorBoundary>
  </StrictMode>,
);

window.dispatchEvent(new Event("athena:bootstrapped"));

registerServiceWorker();
