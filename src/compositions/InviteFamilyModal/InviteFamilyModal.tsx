import { createSignal, onMount } from "solid-js";
import { Flex } from "../../components/Flex";
import { Modal } from "../../components/Modal";
import { TabSwitch } from "../../components/TabSwitch";
import { Text } from "../../components/Text";
import { useUser } from "../../context/PocketbaseProvider";
import QRCode from "qrcode";

type InviteFamilyModalProps = {
  OnClose: () => void;
};

export const InviteFamilyModal = (props: InviteFamilyModalProps) => {
  const user = useUser();
  const [qrCode, setQrCode] = createSignal("");

  onMount(async () => {
    const dataUrl = await QRCode.toDataURL(
      user?.family ?? "Unknown Family Code"
    );
    setQrCode(dataUrl);
  });

  return (
    <Modal OnClose={props.OnClose} Title="Invite Members To Your Family">
      <Flex AlignItems="center" Direction="column" Gap="medium">
        <Text FontSize="large">Welcome to the family</Text>
        <Text FontSize="header">
          Have the new user enter the code, or scan the QR code below after the
          register their account.
        </Text>
        <TabSwitch
          Tabs={[
            {
              Display: "Code",
              Value: "code",
              Content: () => (
                <Flex
                  AlignItems="center"
                  Direction="column"
                  Gap="medium"
                  Padding="medium"
                >
                  <Text Align="center" FontSize="extra-large" FontWeight="bold">
                    {user?.family ?? "Unknown Family Code"}
                  </Text>
                </Flex>
              ),
            },
            {
              Display: "QR",
              Value: "qr",
              Content: () => (
                <Flex
                  AlignItems="center"
                  Direction="column"
                  Gap="medium"
                  Padding="medium"
                >
                  <img
                    alt="Family Join QR Code"
                    src={qrCode() ?? ""}
                    style={{ width: "45vw" }}
                  />
                </Flex>
              ),
            },
          ]}
        />
      </Flex>
    </Modal>
  );
};
