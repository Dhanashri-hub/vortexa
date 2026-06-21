import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl } from "@workspace/api-client-react";

if (import.meta.env.DEV) {
	setBaseUrl("http://localhost:3000");
}

createRoot(document.getElementById("root")!).render(<App />);
