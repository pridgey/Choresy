/* @refresh reload */
import { lazy } from "solid-js";
import { render } from "solid-js/web";
import App from "./App";
import { PocketbaseProvider } from "./context/PocketbaseProvider";
import "./index.css";

/* Lazy load views */
const Home = lazy(() => import("./views/Home"));
const Login = lazy(() => import("./views/Auth"));

/* Establish root element and render*/
const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

render(
  () => (
    <PocketbaseProvider>
      <App />
    </PocketbaseProvider>
  ),
  root!
);
