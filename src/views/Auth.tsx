import { createSignal, Match, Show, Switch } from "solid-js";
import { Input } from "../components/Input";
import { usePocketbase } from "../context/PocketbaseProvider";
import styles from "./../styles/Auth.module.css";
import { Button } from "../components/Button";
import { Text } from "../components/Text";
import { ClientResponseError } from "pocketbase";

/**
 * Auth View Component - Handles login and registration to the application
 */
const Auth = () => {
  const pb = usePocketbase();

  const [showRegister, setShowRegister] = createSignal(false);
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [loginError, setLoginError] = createSignal("");
  // Registration state
  const [passwordConfirm, setPasswordConfirm] = createSignal("");
  const [username, setUsername] = createSignal("");
  const [registerError, setRegisterError] = createSignal<
    Record<string, Record<string, string>>
  >({});

  return (
    <main class={styles.background}>
      <h1 class={styles.logo}>Choresy</h1>
      <Switch>
        <Match when={!showRegister()}>
          <Show when={!!loginError()}>
            <Text Align="center" Color="white" FontWeight="bold">
              {loginError()}
            </Text>
          </Show>
          <Input
            Label="Email"
            LabelColor="white"
            Name="email"
            OnChange={setEmail}
            Type="email"
            Variant="inline"
          />
          <Input
            Label="Password"
            LabelColor="white"
            Name="password"
            OnChange={setPassword}
            Type="password"
            Variant="inline"
          />
          <div class={styles.buttonbar}>
            <Button
              Color="secondary"
              OnClick={async () => {
                try {
                  await pb
                    ?.collection("users")
                    .authWithPassword(email(), password());

                  window.location.reload();
                } catch (err) {
                  setLoginError("An error occurred during login.");
                }
              }}
            >
              Login
            </Button>
            <Button
              Color="white"
              OnClick={() => {
                setShowRegister(true);
              }}
              Variant="outlined"
            >
              Go To Register
            </Button>
          </div>
        </Match>
        <Match when={showRegister()}>
          <Show when={!!registerError().generic}>
            <Text Align="center" Color="white" FontWeight="bold">
              {registerError().generic.message}
            </Text>
          </Show>
          <Input
            DefaultValue={email()}
            Error={registerError().email?.message}
            Label="Email"
            LabelColor="white"
            Name="email"
            OnChange={setEmail}
            Type="email"
            Variant="inline"
          />
          <Input
            DefaultValue={username()}
            Error={registerError().name?.message}
            Label="Username"
            LabelColor="white"
            Name="username"
            OnChange={setUsername}
            Variant="inline"
          />
          <Input
            DefaultValue={password()}
            Error={registerError().password?.message}
            Label="Password"
            LabelColor="white"
            Name="password"
            OnChange={setPassword}
            Type="password"
            Variant="inline"
          />
          <Input
            DefaultValue={passwordConfirm()}
            Error={registerError().passwordConfirm?.message}
            Label="Confirm Password"
            LabelColor="white"
            Name="confirm"
            OnChange={setPasswordConfirm}
            Type="password"
            Variant="inline"
          />
          <div class={styles.buttonbar}>
            <Button
              Color="secondary"
              OnClick={async () => {
                try {
                  await pb?.collection("users").create({
                    email: email(),
                    password: password(),
                    passwordConfirm: passwordConfirm(),
                    name: username(),
                  });

                  setRegisterError({});
                  setLoginError("Successfully Registered. Please Login.");
                  setShowRegister(false);
                } catch (err) {
                  const resError = err as ClientResponseError;
                  console.error(resError.data.data);

                  setRegisterError(resError.data.data);
                }
              }}
            >
              Register
            </Button>
            <Button
              Color="white"
              OnClick={() => {
                setShowRegister(false);
              }}
              Variant="outlined"
            >
              Go To Login
            </Button>
          </div>
        </Match>
      </Switch>
    </main>
  );
};

export default Auth;
