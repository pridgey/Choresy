import { useNavigate } from "@solidjs/router";
import { Button } from "../../components/Button";
import { Avatar } from "./../../components/Avatar";
import styles from "./Navbar.module.css";

export const NavBar = () => {
  const navigate = useNavigate();

  return (
    <nav class={styles.nav}>
      <Button
        Color="white"
        FontSize="large"
        OnClick={() => {
          navigate("/");
        }}
        Variant="text"
      >
        Choresy
      </Button>
      <Avatar />
    </nav>
  );
};
