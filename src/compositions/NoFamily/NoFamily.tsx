import { createSignal, Match, Show, Switch } from "solid-js";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Flex } from "../../components/Flex";
import { Text } from "../../components/Text";
import { Input } from "../../components/Input";
import { usePocketbase, useUser } from "../../context/PocketbaseProvider";
import { FamilyRecord } from "../../types/Family";
import { UserRecord } from "../../types/User";
import { FamilyQRScanner } from "../FamilyQRScanner";
import { BsQrCodeScan } from "solid-icons/bs";

export const NoFamily = () => {
  const [viewMode, setViewMode] = createSignal<"default" | "create" | "join">(
    "default"
  );
  // Create family - Name state
  const [familyName, setFamilyName] = createSignal("");
  // Join family - Family Code state
  const [joinCode, setJoinCode] = createSignal("");

  // QR Scanner modal for joining a family
  const [showScannerModal, setShowScannerModal] = createSignal(false);

  const pb = usePocketbase();
  const user = useUser();

  // Function to join a family with a code
  const joinFamily = async (code?: string) => {
    if (user?.id) {
      try {
        const foundFamily = await pb
          ?.collection<FamilyRecord>("family")
          .getOne(code ?? joinCode());

        if (foundFamily) {
          await pb?.collection<UserRecord>("users").update(user.id, {
            family: foundFamily?.id ?? "unknown family id",
          });
        }

        await pb?.collection("users").authRefresh();

        window.location.reload();
      } catch (err) {
        console.error("Error:", err);
      }
    }
  };

  return (
    <Card margin="medium">
      <Flex
        AlignItems="center"
        Direction="column"
        Gap="large"
        PaddingX="medium"
        PaddingY="small"
      >
        <Switch>
          {/* Default No Family view */}
          <Match when={viewMode() === "default"}>
            <Text Align="center" FontSize="large" FontWeight="semibold">
              You Currently Have No Family
            </Text>
            <Text Align="center">
              A family is how Choresy organizes tasks into groups of people.
            </Text>
            <Text Align="center">
              To start using Choresy you will either need to create a new
              family, or join an existing one.
            </Text>
            <Flex Direction="column" Gap="small" Width="100%">
              <Button OnClick={() => setViewMode("create")} Width="100%">
                Create A New Family
              </Button>
              <Button
                OnClick={() => setViewMode("join")}
                Variant="outlined"
                Width="100%"
              >
                Join Family By Code
              </Button>
            </Flex>
          </Match>
          {/* Create a family */}
          <Match when={viewMode() === "create"}>
            <Text Align="center" FontSize="large" FontWeight="semibold">
              Create Your New Family
            </Text>
            <Text Align="center">
              Create a family all your own and invite them to spread the load.
            </Text>
            <Input Label="Family Name" OnChange={setFamilyName} />
            <Flex Direction="column" Gap="small" Width="100%">
              <Button
                Disabled={!familyName()}
                OnClick={async () => {
                  // Create the family record
                  const createdFamily = await pb
                    ?.collection<FamilyRecord>("family")
                    .create({
                      name: familyName(),
                      leader: user?.id ?? "unknown user",
                    });

                  // Add family to the user record
                  await pb
                    ?.collection<UserRecord>("users")
                    .update(user?.id ?? "unknown user", {
                      family: createdFamily?.id ?? "unknown family",
                    });

                  // Update authstore
                  await pb?.collection("users").authRefresh();

                  // Reload
                  window.location.reload();
                }}
                Width="100%"
              >
                Create {familyName() || "family"}
              </Button>
              <Button
                OnClick={() => setViewMode("default")}
                Variant="text"
                Width="100%"
              >
                Cancel
              </Button>
            </Flex>
          </Match>
          {/* Join a family */}
          <Match when={viewMode() === "join"}>
            <Text Align="center" FontSize="large" FontWeight="semibold">
              Join Your Family
            </Text>
            <Text Align="center">
              Already know someone?
              <br /> Enter the join code below to get started.
            </Text>
            <Flex
              AlignItems="flex-end"
              Direction="row"
              Gap="medium"
              Width="100%"
            >
              <Input Label="Family Join Code" OnChange={setJoinCode} />
              <Button
                IconSize="22px"
                OnClick={() => setShowScannerModal(true)}
                Padding="small"
                Variant="outlined"
                Width="50px"
              >
                <BsQrCodeScan />
              </Button>
            </Flex>
            <Flex Direction="column" Gap="small" Width="100%">
              <Button
                Disabled={!joinCode()}
                OnClick={async () => {
                  await joinFamily();
                }}
                Width="100%"
              >
                Join Family
              </Button>
              <Button
                OnClick={() => setViewMode("default")}
                Variant="text"
                Width="100%"
              >
                Cancel
              </Button>
            </Flex>
          </Match>
        </Switch>
      </Flex>
      <Show when={showScannerModal()}>
        <FamilyQRScanner
          OnClose={async (code) => {
            setShowScannerModal(false);
            await joinFamily(code);
          }}
        />
      </Show>
    </Card>
  );
};
