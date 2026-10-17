import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import i18n from "./lib/i18n";
import { toast } from "./lib/toast";
import "./lib/pwa";
import "./styles/globals.css";

registerSW({
  immediate: true,
  onOfflineReady: () => toast.success(i18n.t("pwa.offlineReady")),
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider>
        <div className="relative flex min-h-dvh flex-col bg-background text-foreground">
          <App />
        </div>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
);
