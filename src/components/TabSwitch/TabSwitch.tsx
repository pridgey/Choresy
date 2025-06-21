import { Tabs } from "@kobalte/core";
import { For, type JSX } from "solid-js";
import styles from "./TabSwitch.module.css";

type TabProps = {
  Content: () => JSX.Element;
  Default?: boolean;
  Display: string;
  Value: string;
};

type TabSwitchProps = {
  Tabs: TabProps[];
};

export const TabSwitch = (props: TabSwitchProps) => {
  return (
    <Tabs.Root
      aria-label="Main navigation"
      class={styles.tabs}
      defaultValue={
        props.Tabs.find((tab) => !!tab.Default)?.Value ?? props.Tabs[0].Value
      }
    >
      <Tabs.List class={styles.tabsList}>
        <For each={props.Tabs}>
          {(tab) => (
            <Tabs.Trigger class={styles.tabsTrigger} value={tab.Value}>
              {tab.Display}
            </Tabs.Trigger>
          )}
        </For>
        <Tabs.Indicator class={styles.tabsIndicator} />
      </Tabs.List>
      <For each={props.Tabs}>
        {(tab) => (
          <Tabs.Content class={styles.tabsContent} value={tab.Value}>
            {tab.Content()}
          </Tabs.Content>
        )}
      </For>
    </Tabs.Root>
  );
};
