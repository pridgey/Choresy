import {
  createContext,
  createSignal,
  JSX,
  onMount,
  useContext,
} from "solid-js";
import Pocketbase from "pocketbase";
import { UserRecord } from "../types/User";

const PocketbaseContext = createContext<Pocketbase>();

type PocketbaseProviderProps = {
  children: JSX.Element;
};

export function PocketbaseProvider(props: PocketbaseProviderProps) {
  const [pb] = createSignal(
    new Pocketbase(import.meta.env.VITE_POCKETBASE_URL)
  );

  return (
    <PocketbaseContext.Provider value={pb()}>
      {props.children}
    </PocketbaseContext.Provider>
  );
}

export const usePocketbase = () => useContext(PocketbaseContext);

export const useUser = () => {
  const context = useContext(PocketbaseContext);

  if (!context?.authStore.isValid) {
    // Invalid user, clear authstore and redirect home
    context?.authStore.clear();
    window.location.href = "/";
    return;
  }

  const user: UserRecord = context.authStore.record as unknown as UserRecord;

  return user;
};

export const useFamily = () => {
  const context = useContext(PocketbaseContext);

  let familyID = "";

  if (context?.authStore.isValid) {
    familyID = context.authStore.record?.family;
  }

  const [family, setFamily] = createSignal<UserRecord[]>([]);

  onMount(async () => {
    const familyRecords = await context
      ?.collection<UserRecord>("users")
      .getFullList({
        filter: `family = "${familyID}"`,
      });

    setFamily(familyRecords ?? []);
  });

  return family;
};
