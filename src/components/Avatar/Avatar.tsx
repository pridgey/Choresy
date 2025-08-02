import { action, useAction, useNavigate } from "@solidjs/router";
import {
  createMemo,
  createResource,
  createSignal,
  Match,
  Show,
  Switch,
} from "solid-js";
import { AppInviteModal } from "../../compositions/AppInviteModal";
import { usePocketbase, useUser } from "../../context/PocketbaseProvider";
import { UserRecord } from "../../types/User";
import { DropdownOptions } from "../DropdownOptions";
import styles from "./Avatar.module.css";

const logout = action(async (pb) => {
  pb.authStore.clear();
  window.location.reload();
});

type AvatarProps = {
  DisableInteraction?: boolean;
  InvertColor?: boolean;
  User?: UserRecord;
  Variant?: "default" | "mini" | "display";
};

/**
 * Avatar component used to display user information and allow access to settings and such
 */
export const Avatar = (props: AvatarProps) => {
  let avatarRef: HTMLButtonElement | HTMLDivElement | undefined;
  const navigate = useNavigate();
  const currentUser = useUser();
  const pb = usePocketbase();
  const logoutAction = useAction(logout);

  const [optionsOpen, setOptionsOpen] = createSignal<boolean>(false);
  const [showInviteModal, setShowInviteModal] = createSignal<boolean>(false);

  // The user for the avatar bubble
  const user = createMemo(() => {
    if (props.User) {
      return props.User;
    }
    return currentUser;
  });

  // Grab avatar from host
  const [avatarUrl] = createResource(async () => {
    if (user()?.avatar) {
      const url = await pb?.files.getURL(
        user() as Record<string, any>,
        user()?.avatar || "unknown user url"
      );

      return url;
    }
    return "";
  });

  // Determines the current variant of the component
  const variant = createMemo(() => {
    if (props.Variant) {
      return props.Variant;
    }
    return "default";
  });

  // Should the avatar have a dropdown
  const isInteractable = createMemo(() => {
    if (
      props.DisableInteraction ||
      props.Variant === "display" ||
      props.Variant === "mini"
    ) {
      return false;
    }
    return true;
  });

  // Determine styles
  const avatarStyles = createMemo(() => {
    const styles = {
      "--avatar-border-thickness": variant() === "mini" ? "1px" : "2px",
      "--avatar-color": props.InvertColor
        ? "var(--color-foreground)"
        : "var(--color-background)",
      "background-image": `url('${avatarUrl() ?? ""}')`,
      cursor: isInteractable() ? "pointer" : "unset",
      "font-size":
        variant() === "mini"
          ? "16px"
          : variant() === "display"
          ? "46px"
          : "30px",
      "font-weight": variant() === "mini" ? "semibold" : "bold",
      height:
        variant() === "mini"
          ? "24px"
          : variant() === "display"
          ? "70px"
          : "50px",
      width:
        variant() === "mini"
          ? "24px"
          : variant() === "display"
          ? "70px"
          : "50px",
    };

    return styles;
  });

  return (
    <>
      <Switch>
        <Match when={!isInteractable()}>
          <div
            ref={avatarRef as HTMLDivElement}
            class={styles.avatarbubble}
            style={avatarStyles()}
          >
            {/* If no avatar image, show the first letter of their username or email */}
            <Show when={!avatarUrl()}>
              {user()?.name?.at(0) || user()?.email?.at(0) || ""}
            </Show>
          </div>
        </Match>
        <Match when={isInteractable()}>
          <button
            ref={avatarRef as HTMLButtonElement}
            onClick={() => {
              if (user() && variant() === "default") {
                setOptionsOpen(!optionsOpen());
              }
            }}
            type="button"
            class={styles.avatarbubble}
            style={avatarStyles()}
          >
            {/* If no avatar image, show the first letter of their username or email */}
            <Show when={!avatarUrl()}>
              {user()?.name?.at(0) || user()?.email?.at(0) || ""}
            </Show>
          </button>
        </Match>
      </Switch>
      <Show when={optionsOpen() && variant() === "default"}>
        <DropdownOptions
          HorizontalAlign="right"
          VerticalGap={15}
          PositionRef={avatarRef}
          OnOutsideClick={() => setOptionsOpen(false)}
          Options={[
            {
              Label: "User Profile",
              OnClick: () => {
                setOptionsOpen(false);
                navigate("/profile");
              },
              Icon: "",
            },
            {
              Label: "Invite to Choresy",
              OnClick: () => {
                setShowInviteModal(true);
              },
              Icon: "",
            },
            {
              Label: "Buy Me A Pizza Slice?",
              Icon: "🍕",
              OnClick: () => {
                window.open(
                  "https://www.buymeacoffee.com/pridgey",
                  "_blank",
                  "noopener,noreferrer"
                );
              },
            },
            {
              Label: "Logout",
              OnClick: async () => {
                setOptionsOpen(false);
                await logoutAction(pb);
              },
              Icon: "",
            },
          ]}
        />
      </Show>
      {/* App Invite Modal */}
      <Show when={showInviteModal()}>
        <AppInviteModal OnClose={() => setShowInviteModal(false)} />
      </Show>
    </>
  );
};
