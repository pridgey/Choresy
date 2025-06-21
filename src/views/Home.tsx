import { Match, onCleanup, onMount, Suspense, Switch } from "solid-js";
import { Flex } from "../components/Flex";
import { Text } from "../components/Text";
import { FamilyBar } from "../compositions/FamilyBar/FamilyBar";
import { NavBar } from "../compositions/Navbar/Navbar";
import { NoFamily } from "../compositions/NoFamily/NoFamily";
import { Tasks } from "../compositions/Tasks/Tasks";
import { usePocketbase, useUser } from "../context/PocketbaseProvider";
import styles from "./../styles/Home.module.css";

const Home = () => {
  const user = useUser();
  const pb = usePocketbase();

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
            <Text Color="white" FontSize="large" FontWeight="semibold">
              Welcome back, {user?.name}
            </Text>
            <FamilyBar />
            <Suspense>
              <Tasks />
            </Suspense>
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
