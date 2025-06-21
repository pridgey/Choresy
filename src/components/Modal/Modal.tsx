import type { JSX } from "solid-js";
import { Portal } from "solid-js/web";
import styles from "./Modal.module.css";
import { Text } from "../Text";
import { Button } from "../Button";
import { IoClose } from "solid-icons/io";
import { Show } from "solid-js";

type ModalProps = {
  children: JSX.Element;
  CancelLabel?: string;
  OnClose: () => void;
  OnSubmit?: () => void;
  Pending?: boolean;
  SubmitColor?: "primary" | "danger";
  SubmitLabel?: string;
  Title: string;
  Width?: string;
};

export const Modal = (props: ModalProps) => {
  return (
    <Portal>
      <div class={styles.container}>
        <dialog
          class={styles.modal}
          open={true}
          style={{ "--modal-width": props.Width ?? "500px" }}
        >
          <span style={{ "grid-area": "title", "user-select": "none" }}>
            <Text As="h1" FontWeight="bold" FontSize="header">
              {props.Title}
            </Text>
          </span>
          <span style={{ "grid-area": "close" }}>
            <Button
              Color="text"
              Disabled={props.Pending}
              DisableRadius={true}
              OnClick={() => props.OnClose()}
              Padding="none"
              Pending={props.Pending}
              Type="button"
              Variant="text"
            >
              <IoClose />
            </Button>
          </span>
          <div class={styles.body}>{props.children}</div>
          <Show when={!!props.OnSubmit}>
            <div class={styles.buttonbar}>
              <Button
                Disabled={props.Pending}
                OnClick={() => props.OnClose()}
                Pending={props.Pending}
                Type="button"
                Variant="text"
              >
                {props.CancelLabel || "Cancel"}
              </Button>
              <Button
                Color={props.SubmitColor === "danger" ? "error" : "primary"}
                Disabled={props.Pending}
                OnClick={() => [props.OnSubmit?.()]}
                Pending={props.Pending}
                Type="button"
              >
                {props.SubmitLabel || "Submit"}
              </Button>
            </div>
          </Show>
        </dialog>
      </div>
    </Portal>
  );
};
