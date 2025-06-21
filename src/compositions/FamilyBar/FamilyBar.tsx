import {
  createEffect,
  createResource,
  createSignal,
  onCleanup,
  Show,
} from "solid-js";
import { usePocketbase, useUser } from "../../context/PocketbaseProvider";
import { UserRecord } from "../../types/User";
import { Avatar } from "../../components/Avatar";
import { Flex } from "../../components/Flex";
import { Text } from "../../components/Text";
import { IoAddCircleOutline } from "solid-icons/io";
import { Button } from "../../components/Button";
import { InviteFamilyModal } from "../InviteFamilyModal";

const MAX_SHOWN = 4;

export const FamilyBar = () => {
  const pb = usePocketbase();
  const user = useUser();
  const [familyCount, setFamilyCount] = createSignal(0);

  const [showInviteModal, setShowInviteModal] = createSignal(false);

  const [family, { refetch }] = createResource(async () => {
    if (user?.id) {
      const familyUsers = await pb
        ?.collection<UserRecord>("users")
        .getFullList({
          filter: `family = "${user.family}"`,
        });

      const meIndex = familyUsers?.findIndex(
        (fu) => fu.id === (user?.id ?? "")
      );
      if (meIndex) {
        familyUsers?.splice(meIndex, 1);
        familyUsers?.unshift(user);
      }

      setFamilyCount(familyUsers?.length ?? 0);

      if (familyUsers?.length ?? 0 > MAX_SHOWN) {
        return familyUsers?.slice(0, MAX_SHOWN);
      }

      return familyUsers;
    }
  });

  createEffect(async () => {
    await pb?.collection("users").subscribe("*", refetch);
  });

  onCleanup(async () => {
    await pb?.collection("users").unsubscribe("*");
  });

  return (
    <Flex AlignItems="center" Direction="row" Gap="small">
      <Text Color="white" FontWeight="semibold" FontWrap="nowrap">
        Family Members:
      </Text>
      {family()?.map((u) => (
        <Avatar User={u} Variant="mini" />
      ))}
      <Show when={familyCount() > MAX_SHOWN}>
        <Text Color="white" FontWeight="light">
          (+{familyCount() - MAX_SHOWN} more)
        </Text>
      </Show>
      <Button
        Color="white"
        IconSize="30px"
        OnClick={() => setShowInviteModal(true)}
        Padding="none"
        Variant="text"
      >
        <IoAddCircleOutline />
      </Button>
      <Show when={showInviteModal()}>
        <InviteFamilyModal OnClose={() => setShowInviteModal(false)} />
      </Show>
    </Flex>
  );
};
