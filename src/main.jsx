import React from "react";

import ReactDOM
from "react-dom/client";

import App from "./App";

import "./i18n/i18n";
import "devextreme/dist/css/dx.light.css"; // Bắt buộc phải có để DataGrid không bị vỡ giao diện
ReactDOM
  .createRoot(
    document.getElementById("root")
  )
  .render(

    <React.StrictMode>
      <App />
    </React.StrictMode>
  );