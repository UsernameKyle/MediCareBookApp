import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Ant Design base styles
import "antd/dist/reset.css";
// Bootstrap base
import "bootstrap/dist/css/bootstrap.min.css";
// Global brand styles (must come after libraries to override)
import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
