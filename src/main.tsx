import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import "antd/dist/reset.css";
import "./index.css";
import App from "./App";

import { Provider } from "react-redux";
import { store } from "./app/store";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <>
    <Provider store={store}>
      <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#F97316", // orange
          colorInfo: "#0B3A6A", // navy
          colorBgBase: "#0B1220", // deep navy background
          colorBgContainer: "#111827", // slate-900
          colorBgElevated: "#0F172A", // slate-900-ish
          colorTextBase: "#E5E7EB", // gray-200
          colorText: "#E5E7EB",
          colorTextSecondary: "#9CA3AF", // gray-400
          colorBorder: "#243044",
          borderRadius: 10,
        },
      }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
    </Provider>
  </>,
);
