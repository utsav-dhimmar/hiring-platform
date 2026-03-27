/**
 * Application entry point.
 * Initializes React root, Redux store, and renders the main App component.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store";
// import "bootstrap/dist/css/bootstrap.min.css";
import "@/styles/index.css";
import App from "@/App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
