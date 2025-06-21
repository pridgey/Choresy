import { TextField } from "@kobalte/core";
import { Match, Show, Switch, createEffect, createSignal } from "solid-js";
import styles from "./Input.module.css";
import { Button } from "../Button";
import { FiEye, FiEyeOff } from "solid-icons/fi";

export type InputProps = {
  DefaultValue?: string;
  Error?: string;
  FontSize?: "mini" | "small" | "text" | "header" | "large" | "extra-large";
  FontWeight?: "light" | "normal" | "semibold" | "bold";
  HelperText?: string;
  HideLabel?: boolean;
  Label: string;
  LabelColor?:
    | "white"
    | "black"
    | "text"
    | "foreground"
    | "background"
    | "fullbackground"
    | "fullforeground";
  Multiline?: boolean;
  Name?: string;
  OnChange?: (newValue: string) => void;
  Placeholder?: string;
  Type?: "text" | "password" | "number" | "time" | "date" | "email";
  Width?: string;
  Variant?: "inline" | "outlined";
};

export const Input = (props: InputProps) => {
  const [error, setError] = createSignal(props.Error);
  const [showPassword, setShowPassword] = createSignal(false);

  createEffect(() => {
    setError(props.Error);
  });

  return (
    <TextField.Root
      class={styles.input_root}
      defaultValue={props.DefaultValue}
      name={props.Name}
      onChange={props.OnChange}
      style={{
        "--input-border":
          props.Variant === "inline"
            ? "unset"
            : "1px solid var(--color-foreground)",
        "--input-width": props.Width ?? "100%",
      }}
      validationState={!!props.Error ? "invalid" : "valid"}
    >
      <Show when={!props.HideLabel}>
        <TextField.Label
          class={styles.input_label}
          style={{
            color: `var(--color-${props.LabelColor ?? "text"})`,
          }}
        >
          {props.Label}
        </TextField.Label>
      </Show>
      <Switch>
        <Match when={props.Multiline}>
          <TextField.TextArea
            aria-label={props.Label}
            classList={{
              [styles.input_control]: true,
              [styles.input_multiline]: true,
            }}
            placeholder={props.Placeholder}
            style={{
              "font-size": `var(--font-size-${props.FontSize ?? "text"})`,
              "font-weight": `var(--font-weight-${
                props.FontWeight ?? "unset"
              })`,
              height: "unset",
            }}
            value={props.DefaultValue}
          >
            {props.DefaultValue}
          </TextField.TextArea>
        </Match>
        <Match when={!props.Multiline}>
          <div class={styles.input_wrapper}>
            <TextField.Input
              aria-label={props.Label}
              class={styles.input_control}
              placeholder={props.Placeholder}
              style={{
                "font-size": `var(--font-size-${props.FontSize ?? "text"})`,
                "font-weight": `var(--font-weight-${
                  props.FontWeight ?? "unset"
                })`,
              }}
              type={
                props.Type === "password"
                  ? showPassword()
                    ? "text"
                    : "password"
                  : props.Type
              }
              value={props.DefaultValue}
            />
            <Show when={props.Type === "password"}>
              <Button
                FontSize="small"
                IconSize="small"
                OnClick={() => setShowPassword(!showPassword())}
                Padding="mini"
                Variant="text"
              >
                <Switch>
                  <Match when={showPassword()}>
                    <FiEyeOff />
                  </Match>
                  <Match when={!showPassword()}>
                    <FiEye />
                  </Match>
                </Switch>
              </Button>
            </Show>
          </div>
        </Match>
      </Switch>
      <Show when={props.HelperText}>
        <TextField.Description class={styles.input_helper}>
          {props.HelperText}
        </TextField.Description>
      </Show>
      <Show when={props.Error}>
        <TextField.ErrorMessage class={styles.input_error}>
          {error()}
        </TextField.ErrorMessage>
      </Show>
    </TextField.Root>
  );
};
