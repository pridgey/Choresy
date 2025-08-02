import QRCode from "qrcode";
import { createSignal, onMount } from "solid-js";
import { Flex } from "../../components/Flex";
import { Modal } from "../../components/Modal";
import { Text } from "../../components/Text";

type AppInviteModalProps = {
  OnClose: () => void;
};

export const AppInviteModal = (props: AppInviteModalProps) => {
  const [qrCode, setQrCode] = createSignal("");

  onMount(async () => {
    const dataUrl = await QRCode.toDataURL(
      import.meta.env.VITE_CHORESY_RELEASES_URL || ""
    );
    setQrCode(dataUrl);
  });

  return (
    <Modal OnClose={props.OnClose} Title="Invite To Choresy">
      <Flex AlignItems="center" Direction="column" Gap="medium">
        <Text FontSize="large">Ready To Join?</Text>
        <Text FontSize="header">
          Scan the QR code below to find the latest app download.
        </Text>
        <img
          alt="Family Join QR Code"
          src={qrCode() ?? ""}
          style={{ width: "45vw" }}
        />
      </Flex>
    </Modal>
  );
};
