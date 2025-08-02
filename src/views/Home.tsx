import {
  createSignal,
  Match,
  onCleanup,
  onMount,
  Show,
  Suspense,
  Switch,
} from "solid-js";
import { Flex } from "../components/Flex";
import { Text } from "../components/Text";
import { FamilyBar } from "../compositions/FamilyBar/FamilyBar";
import { NavBar } from "../compositions/Navbar/Navbar";
import { NoFamily } from "../compositions/NoFamily/NoFamily";
import { Tasks } from "../compositions/Tasks/Tasks";
import { usePocketbase, useUser } from "../context/PocketbaseProvider";
import styles from "./../styles/Home.module.css";
import { FaSolidClockRotateLeft } from "solid-icons/fa";
import { Button } from "../components/Button";
import { FamilyHistory } from "../compositions/FamilyHistory";

const Home = () => {
  const user = useUser();
  const pb = usePocketbase();

  // Controls the visibility of the family history modal
  const [showHistory, setShowHistory] = createSignal(false);

  // Subscribe to the user collection to refresh the page when the user is updated
  onMount(async () => {
    await pb?.collection("users").subscribe(user?.id ?? "unknown", async () => {
      await pb.collection("users").authRefresh();
      window.location.reload();
    });
  });

  onCleanup(async () => {
    await pb?.collection("users").unsubscribe(user?.id ?? "unknown");
  });

  return (
    <main class={styles.background}>
      <NavBar />
      <Switch>
        <Match when={user?.family}>
          <Flex Direction="column" Gap="medium" Height="100%" Padding="medium">
            <Flex
              AlignItems="center"
              Direction="row"
              JustifyContent="space-between"
            >
              <Text Color="white" FontSize="large" FontWeight="semibold">
                Welcome back, {user?.name}
              </Text>
              <Button
                Color="white"
                OnClick={() => setShowHistory(true)}
                Variant="text"
              >
                <FaSolidClockRotateLeft />
              </Button>
            </Flex>
            <FamilyBar />
            <Suspense>
              <Tasks />
            </Suspense>
            <Show when={showHistory()}>
              <FamilyHistory onClose={() => setShowHistory(false)} />
            </Show>
          </Flex>
        </Match>
        <Match when={!user?.family}>
          <NoFamily />
        </Match>
      </Switch>
    </main>
  );
};

export default Home;
