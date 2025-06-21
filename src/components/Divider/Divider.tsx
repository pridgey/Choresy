import { Separator } from "@kobalte/core";
import styles from "./Divider.module.css";

type DividerProps = {
  Color?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "success"
    | "error"
    | "gray"
    | "fullwhite"
    | "fullblack"
    | "white"
    | "black"
    | "text"
    | "background"
    | "foreground"
    | "fullbackground"
    | "fullforeground";
  Orientation?: "horizontal" | "vertical";
  Variant?: "full" | "light";
};

export const Divider = (props: DividerProps) => {
  return (
    <Separator.Root
      class={styles.separator}
      orientation={props.Orientation ?? "horizontal"}
      style={{
        "--divider-color": `var(--color-${props.Color ?? "gray"})`,
      }}
    />
  );
};
