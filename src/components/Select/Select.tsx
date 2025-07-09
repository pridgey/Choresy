import { Select as KobalteSelect } from "@kobalte/core/select";
import { FiChevronDown, FiCheck } from "solid-icons/fi";
import { AiOutlineCloseCircle } from "solid-icons/ai";
import styles from "./Select.module.css";
import { createMemo, Show } from "solid-js";

interface SelectOptionProps {
  value: string;
  display: string;
  disabled?: boolean;
}

type SelectProps = {
  error?: string;
  helperText?: string;
  label: string;
  onChange: (newValue: string | undefined) => void;
  options: SelectOptionProps[];
  placeholder?: string;
  value?: string;
  width?: string;
};

export const Select = (props: SelectProps) => {
  // Memoize everything that could cause re-renders
  const selectedOption = createMemo(() =>
    props.options.find((opt) => opt.value === props.value)
  );

  const options = createMemo(() => props.options);

  const handleChange = (option: SelectOptionProps | null) => {
    // Only call onChange if the value actually changed
    if (option?.value !== props.value) {
      props.onChange(option?.value);
    }
  };

  return (
    <KobalteSelect
      class={styles.select_root}
      onChange={handleChange}
      options={options()}
      optionValue="value"
      optionTextValue="display"
      optionDisabled="disabled"
      placeholder={props.placeholder}
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
      style={{ "--select-width": props.width ?? "100%" }}
      value={selectedOption()}
    >
      <KobalteSelect.Label class={styles.select_label}>
        {props.label}
      </KobalteSelect.Label>
      <KobalteSelect.Trigger
        class={styles.select_trigger}
        aria-label={props.label}
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
      <Show when={props.helperText}>
        <KobalteSelect.Description class={styles.select_helper}>
          {props.helperText}
        </KobalteSelect.Description>
      </Show>
      <Show when={props.error}>
        <KobalteSelect.ErrorMessage class={styles.select_error}>
          {props.error}
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
