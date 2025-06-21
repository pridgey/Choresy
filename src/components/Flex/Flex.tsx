import type { JSX } from "solid-js";
import { paddingToCSS } from "./../../styles/themeUtils";

export type FlexProps = {
  AlignItems?: "flex-start" | "flex-end" | "center";
  children: JSX.Element;
  Direction: "row" | "column";
  Gap?: "mini" | "small" | "medium" | "large";
  Height?: string;
  JustifyContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  Padding?: "small" | "medium" | "large";
  PaddingX?: "small" | "medium" | "large";
  PaddingY?: "small" | "medium" | "large";
  Style?: JSX.CSSProperties;
  Width?: string;
  Wrap?: "wrap" | "nowrap";
};

export const Flex = (props: FlexProps) => {
  return (
    <div
      style={{
        ...props.Style,
        display: "flex",
        "align-items": props.AlignItems,
        "flex-direction": props.Direction,
        "flex-wrap": props.Wrap ?? "nowrap",
        gap: `var(--spacing-${props.Gap})`,
        height: props.Height,
        "justify-content": props.JustifyContent,
        padding: paddingToCSS(
          props.PaddingX ?? props.Padding,
          props.PaddingY ?? props.Padding
        ),
        width: props.Width,
      }}
    >
      {props.children}
    </div>
  );
};
