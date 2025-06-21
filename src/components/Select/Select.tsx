import { Select as KobalteSelect } from "@kobalte/core/select";
import { FiChevronDown, FiCheck } from "solid-icons/fi";
import { AiOutlineCloseCircle } from "solid-icons/ai";
import styles from "./Select.module.css";
import { Show } from "solid-js";

interface SelectOptionProps {
  value: string;
  display: string;
  default?: boolean;
  disabled?: boolean;
}

type SelectProps = {
  Error?: string;
  HelperText?: string;
  Label: string;
  OnChange: (newValue: SelectOptionProps | null) => void;
  Options: SelectOptionProps[];
  Placeholder?: string;
  Width?: string;
};

export const Select = (props: SelectProps) => {
  return (
    <KobalteSelect
      class={styles.select_root}
      defaultValue={props.Options.find((o) => o.default)}
      onChange={props.OnChange}
      options={props.Options}
      optionValue="value"
      optionTextValue="display"
      optionDisabled="disabled"
      placeholder={props.Placeholder}
      itemComponent={(props) => (
        <KobalteSelect.Item item={props.item} class={styles.select_item}>
          <KobalteSelect.ItemLabel>
            {props.item.rawValue.display}
          </KobalteSelect.ItemLabel>
          <KobalteSelect.ItemIndicator class={styles.select_itemIndicator}>
            <FiCheck />
          </KobalteSelect.ItemIndicator>
        </KobalteSelect.Item>
      )}
      style={{ "--select-width": props.Width ?? "100%" }}
    >
      <KobalteSelect.Label class={styles.select_label}>
        {props.Label}
      </KobalteSelect.Label>
      <KobalteSelect.Trigger
        class={styles.select_trigger}
        aria-label={props.Label}
      >
        <KobalteSelect.Value<SelectOptionProps> class={styles.select_value}>
          {(state) => {
            return (
              <>
                <div class={styles.value_display}>
                  <span onPointerDown={(e) => e.stopPropagation()}>
                    {state.selectedOption().display}
                  </span>
                </div>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={state.clear}
                >
                  <AiOutlineCloseCircle />
                </button>
              </>
            );
          }}
        </KobalteSelect.Value>
        <KobalteSelect.Icon class={styles.select_icon}>
          <FiChevronDown />
        </KobalteSelect.Icon>
      </KobalteSelect.Trigger>
      <Show when={props.HelperText}>
        <KobalteSelect.Description class={styles.select_helper}>
          {props.HelperText}
        </KobalteSelect.Description>
      </Show>
      <Show when={props.Error}>
        <KobalteSelect.ErrorMessage class={styles.select_error}>
          {props.Error}
        </KobalteSelect.ErrorMessage>
      </Show>
      <KobalteSelect.Portal>
        <KobalteSelect.Content class={styles.select_content}>
          <KobalteSelect.Listbox class={styles.select_listbox} />
        </KobalteSelect.Content>
      </KobalteSelect.Portal>
    </KobalteSelect>
  );
};
