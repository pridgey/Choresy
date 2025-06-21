import { Route, Router } from "@solidjs/router";
import { createMemo, lazy, Match, Suspense, Switch } from "solid-js";
import { usePocketbase } from "./context/PocketbaseProvider";
import { Text } from "./components/Text";
import { FullPageLoader } from "./compositions/FullPageLoader/FullPageLoader";

/* Lazy load views */
const Home = lazy(() => import("./views/Home"));
const Auth = lazy(() => import("./views/Auth"));
const Profile = lazy(() => import("./views/Profile"));

const App = () => {
  const pb = usePocketbase();

  const isLoggedIn = createMemo(() => {
    return pb?.authStore.isValid;
  });

  return (
    <Suspense fallback={<FullPageLoader />}>
      <Router>
        <Switch>
          {/* Auth Routes */}
          <Match when={isLoggedIn()}>
            <Route path="/" component={Home} />
            <Route path="/profile" component={Profile} />
          </Match>
          {/* Unauth Routes */}
          <Match when={!isLoggedIn()}>
            <Route path="*" component={Auth} />
          </Match>
        </Switch>
      </Router>
    </Suspense>
  );
};

export default App;
