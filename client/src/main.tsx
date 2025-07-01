import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import { Provider } from "./provider.tsx";
import "./styles/globals.css";
import "./lib/i18n"; // Initialize i18n

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Provider>
        <div className="relative flex min-h-screen flex-col bg-background text-foreground">
          <App />
        </div>
      </Provider>
    </BrowserRouter>
  </React.StrictMode>,
);
