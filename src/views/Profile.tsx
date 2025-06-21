import moment from "moment";
import { Avatar } from "../components/Avatar";
import { Card } from "../components/Card";
import { Flex } from "../components/Flex";
import { Text } from "../components/Text";
import { usePocketbase, useUser } from "../context/PocketbaseProvider";
import { NavBar } from "../compositions/Navbar/Navbar";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  Show,
} from "solid-js";
import { action, useAction, useSubmission } from "@solidjs/router";
import { UserRecord } from "../types/User";
import { FileUpload } from "../components/FileUpload";
import { FamilyRecord } from "../types/Family";
import { IoPersonRemove } from "solid-icons/io";
import { Modal } from "../components/Modal";
import { InviteFamilyModal } from "../compositions/InviteFamilyModal";

const Profile = () => {
  const user = useUser();
  const pb = usePocketbase();

  // Modal for confirming if a family member should be removed
  const [showRemoveFamilyModal, setShowRemoveFamilyModal] = createSignal("");
  // Modal for inviting family members
  const [showInviteModal, setShowInviteModal] = createSignal(false);

  // Grab the family record of the user
  const [family] = createResource(async () => {
    return await pb
      ?.collection<FamilyRecord>("family")
      .getOne(user?.family ?? "unknown family");
  });

  // Grab all fellow family members (for managing family)
  const [familyMembers, { refetch: refetchFamilyMembers }] = createResource(
    async () => {
      return await pb?.collection<UserRecord>("users").getFullList({
        filter: `family = "${user?.family ?? "unknown family"}"`,
      });
    }
  );

  // Determines if this is the family leader
  const isFamilyLeader = createMemo(() => {
    if (!family || !family()?.leader || !user?.id) {
      return false;
    }

    return family()?.leader === user?.id;
  });

  // Update username action
  const updateUserName = action(async (newUsername: string) => {
    await pb
      ?.collection<UserRecord>("users")
      .update(user?.id ?? "unknown user", {
        name: newUsername,
      });

    return true;
  });
  const [newUsername, setNewUsername] = createSignal("");
  const updateUsernameAction = useAction(updateUserName);
  const updateUsernameSubmission = useSubmission(updateUserName);

  // Update password action
  const updatePassword = action(
    async (
      newPassword: string,
      oldPassword: string,
      passwordConfirm: string
    ) => {
      try {
        await pb
          ?.collection<UserRecord>("users")
          .update(user?.id ?? "unknown user", {
            password: newPassword,
            oldPassword: oldPassword,
            passwordConfirm: passwordConfirm,
          });

        return true;
      } catch (err) {
        console.log("Error:", {
          type: typeof err,
          err,
          instance: err instanceof Error,
        });
        if (err instanceof Error) {
          throw err;
        }
        if (typeof err === "string") {
          throw new Error(err);
        }

        throw new Error("Unknown Error Occurred");
      }
    }
  );
  const [newPassword, setNewPassword] = createSignal("");
  const [oldPassword, setOldPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const updatePasswordAction = useAction(updatePassword);
  const updatePasswordSubmission = useSubmission(updatePassword);

  // Update avatar action
  const updateAvatar = action(async (newImage: File) => {
    try {
      await pb
        ?.collection<UserRecord>("users")
        .update(user?.id ?? "unknown user", {
          avatar: newImage,
        });

      return true;
    } catch (err) {
      throw err;
    }
  });
  const [uploadError, setUploadError] = createSignal("");
  const updateAvatarAction = useAction(updateAvatar);
  const updateAvatarSubmission = useSubmission(updateAvatar);

  return (
    <Flex Direction="column">
      <NavBar />
      <Flex Direction="column" Gap="medium" Padding="large">
        {/* User Display Card */}
        <Card padding="large">
          <Flex AlignItems="center" Direction="column" Gap="medium">
            <Avatar
              DisableInteraction={true}
              InvertColor={true}
              Variant="display"
            />
            <Flex AlignItems="center" Direction="column" Gap="small">
              <Text Align="center" FontSize="large" FontWeight="bold">
                {user?.name}
              </Text>
              <Text FontSize="header">{user?.email}</Text>
            </Flex>
          </Flex>
          <Show when={family()}>
            <Text Align="center" FontSize="small">
              Family: {family()?.name} {isFamilyLeader() ? "(leader)" : ""}
            </Text>
          </Show>
          <Text Align="center" FontSize="small">
            User Since: {moment(user?.created ?? "").format("MMM DD YYYY")}
          </Text>
        </Card>
        {/* Update Avatar */}
        <Card padding="large">
          <Flex Direction="column" Gap="medium">
            <Text FontSize="large" FontWeight="bold">
              Change Avatar
            </Text>
            <Show when={uploadError()}>
              <Text Color="error">{uploadError()}</Text>
            </Show>
            <FileUpload
              accept="image/*"
              buttonOnly={true}
              label="Change Avatar"
              maxFileSize={5242880}
              name="user-avatar"
              onFileAccepted={async (data) => {
                setUploadError("");
                const avatarFile = data.at(0);

                if (avatarFile && avatarFile.type.includes("image")) {
                  await updateAvatarAction(avatarFile);
                  window.location.reload();
                }
              }}
              onFileRejected={(data) => {
                const error = data?.at(0)?.errors?.at(0) ?? "";
                let errorMessage;
                switch (error) {
                  case "FILE_INVALID_TYPE":
                    errorMessage = "File is an invalid type.";
                    break;
                  case "FILE_TOO_LARGE":
                    errorMessage = "File types is too large. (Max 5.24 MB)";
                    break;
                  case "FILE_TOO_SMALL":
                    errorMessage = "File type is too small.";
                    break;
                  case "TOO_MANY_FILES":
                    errorMessage =
                      "You have uploaded too many files. Max of 1.";
                    break;
                  default:
                    errorMessage = "Unknown error has occurred.";
                    break;
                }
                setUploadError(errorMessage);
              }}
              pending={updateAvatarSubmission.pending}
            />
          </Flex>
        </Card>
        {/* Update Username Card */}
        <Card padding="large">
          <Flex Direction="column" Gap="medium">
            <Text FontSize="large" FontWeight="bold">
              Change Username
            </Text>
            <Flex AlignItems="flex-end" Direction="row" Gap="medium">
              <Input Label="New Username" OnChange={setNewUsername} />
              <Button
                Disabled={!newUsername() || updateUsernameSubmission.pending}
                OnClick={async () => {
                  await updateUsernameAction(newUsername());
                  window.location.reload();
                }}
                Pending={updateUsernameSubmission.pending}
                Variant="text"
              >
                Update
              </Button>
            </Flex>
          </Flex>
        </Card>
        {/* Update Password Card */}
        <Card padding="large">
          <Flex Direction="column" Gap="medium">
            <Text FontSize="large" FontWeight="bold">
              Change Password
            </Text>
            <Input
              Error={
                updatePasswordSubmission.error?.response?.data?.oldPassword
                  ?.message
              }
              Label="Old Password"
              OnChange={setOldPassword}
              Type="password"
            />
            <Input
              Error={
                updatePasswordSubmission.error?.response?.data?.password
                  ?.message
              }
              Label="New Password"
              OnChange={setNewPassword}
              Type="password"
            />
            <Input
              Error={
                updatePasswordSubmission.error?.response?.data?.passwordConfirm
                  ?.message
              }
              Label="Confirm New Password"
              OnChange={setConfirmPassword}
              Type="password"
            />
            <Flex Direction="row" JustifyContent="flex-end">
              <Button
                Disabled={
                  !newPassword() ||
                  !oldPassword() ||
                  !confirmPassword() ||
                  updatePasswordSubmission.pending
                }
                OnClick={async () => {
                  await updatePasswordAction(
                    newPassword(),
                    oldPassword(),
                    confirmPassword()
                  );
                  window.location.reload();
                }}
                Pending={updatePasswordSubmission.pending}
                Variant="text"
              >
                Update
              </Button>
            </Flex>
          </Flex>
        </Card>
        {/* Family Management card */}
        <Show when={isFamilyLeader()}>
          <Card padding="large">
            <Flex Direction="column" Gap="medium">
              <Text FontSize="large" FontWeight="bold">
                Manage Your Family
              </Text>
              <Flex Direction="column" Gap="medium">
                <For
                  each={familyMembers()?.filter(
                    (fm) => fm.id !== (user?.id ?? "uknown")
                  )}
                >
                  {(familyMember) => (
                    <Card padding="medium" variant="outlined">
                      <Flex
                        AlignItems="center"
                        Direction="row"
                        JustifyContent="space-between"
                        Gap="small"
                      >
                        <Flex
                          AlignItems="flex-start"
                          Direction="column"
                          Gap="small"
                        >
                          <Flex AlignItems="center" Direction="row" Gap="small">
                            <Avatar
                              InvertColor={true}
                              User={familyMember}
                              Variant="mini"
                            />
                            <Text>
                              {familyMember.name || familyMember.email}
                            </Text>
                          </Flex>
                          <Text FontSize="small" FontWeight="light">
                            Member Since:{" "}
                            {moment(familyMember.created).format("MMM DD YYYY")}
                          </Text>
                        </Flex>
                        <Button
                          OnClick={() => {
                            setShowRemoveFamilyModal(familyMember.id);
                          }}
                          Variant="text"
                        >
                          <IoPersonRemove />
                        </Button>
                      </Flex>
                    </Card>
                  )}
                </For>
                <Button OnClick={() => setShowInviteModal(true)} Variant="text">
                  Invite Members
                </Button>
                <Show when={showRemoveFamilyModal()}>
                  <Modal
                    OnClose={() => setShowRemoveFamilyModal("")}
                    Title="Remove Family Member"
                    OnSubmit={async () => {
                      await pb
                        ?.collection<UserRecord>("users")
                        .update(showRemoveFamilyModal(), {
                          family: null,
                        });
                      refetchFamilyMembers();
                      setShowRemoveFamilyModal("");
                    }}
                    SubmitColor="danger"
                    SubmitLabel="Yes, Remove"
                  >
                    <Text>
                      Removing family cannot be undone. Users will need to
                      rejoin with the family code.
                    </Text>
                  </Modal>
                </Show>
                <Show when={showInviteModal()}>
                  <InviteFamilyModal
                    OnClose={() => setShowInviteModal(false)}
                  />
                </Show>
              </Flex>
            </Flex>
          </Card>
        </Show>
      </Flex>
    </Flex>
  );
};

export default Profile;
