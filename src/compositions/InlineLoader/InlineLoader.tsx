import { Flex } from "../../components/Flex";
import styles from "./InlineLoader.module.css";

export const InlineLoader = () => {
  return (
    <Flex
      AlignItems="center"
      Direction="row"
      JustifyContent="center"
      Width="100%"
    >
      <div class={styles.loader}></div>
    </Flex>
  );
};
