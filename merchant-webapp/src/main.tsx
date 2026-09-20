import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { OxygenUIThemeProvider, OxygenTheme } from "@wso2/oxygen-ui";
import { App } from "./App";

// Dev-only, dynamic-import-guarded (react-webapp's mock-mode.md). `DEV` and
// `MODE` are literals Vite substitutes at build time, so a production build
// proves this branch dead and drops the msw chunk entirely.
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.MODE !== "mock") return;
  const { startMockWorker } = await import("../mock/browser");
  await startMockWorker();
}

void enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <OxygenUIThemeProvider theme={OxygenTheme}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </OxygenUIThemeProvider>
    </StrictMode>,
  );
});
