import { createEffect, createResource, For, Match, Switch } from "solid-js";
import { Flex } from "../../components/Flex";
import { Modal } from "../../components/Modal";
import { usePocketbase } from "../../context/PocketbaseProvider";
import { TaskHistoryRecord } from "../../types/TaskHistoryRecord";
import { Text } from "../../components/Text";
import { Avatar } from "../../components/Avatar";
import { Card } from "../../components/Card";
import { FaSolidRobot } from "solid-icons/fa";

const AUTO_RENEW_USER = import.meta.env.VITE_AUTO_RENEW_USER;

type FamilyHistoryProps = {
  onClose: () => void;
};

/**
 * Composition to display the family history logs
 */
export const FamilyHistory = (props: FamilyHistoryProps) => {
  const pb = usePocketbase();

  // Stateful query to get the family history logs
  const [historyLogs] = createResource(async () => {
    const logs = await pb
      ?.collection<TaskHistoryRecord>("task_history")
      .getFullList({
        expand: "task,user",
        sort: "-created",
      });

    // Organize the logs by day created
    const organizedLogs = logs?.reduce<Record<string, TaskHistoryRecord[]>>(
      (acc, log) => {
        const date = new Date(log.created).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(log);
        return acc;
      },
      {}
    );

    return Object.entries(organizedLogs || {}).map(([date, logs]) => ({
      date,
      logs,
    }));
  });

  return (
    <Modal Title="History" OnClose={() => props.onClose()}>
      <Flex
        Direction="column"
        Gap="large"
        Height="70vh"
        Style={{ "overflow-y": "auto" }}
      >
        <For each={historyLogs()}>
          {(log) => (
            <Flex Direction="column" Gap="small">
              <Text FontWeight="bold">{log.date}</Text>
              <Card padding="none" gap="none">
                <For each={log.logs}>
                  {(entry) => (
                    <Card variant="transparent">
                      <Flex Direction="row" Gap="small" AlignItems="center">
                        <Switch>
                          <Match when={entry.user === AUTO_RENEW_USER}>
                            <FaSolidRobot
                              style={{
                                "font-size": "24px",
                                color: "var(--color-gray)",
                              }}
                            />
                          </Match>
                          <Match when={entry.user !== AUTO_RENEW_USER}>
                            <Avatar
                              InvertColor={true}
                              User={entry.expand.user}
                              Variant="mini"
                            />
                          </Match>
                        </Switch>
                        <span>
                          <Switch>
                            <Match when={entry.user === AUTO_RENEW_USER}>
                              <Text>
                                Task:{" "}
                                <Text FontWeight="semibold">
                                  {entry.expand.task.title}
                                </Text>{" "}
                                auto renewed
                              </Text>
                            </Match>
                            <Match when={entry.user !== AUTO_RENEW_USER}>
                              <Text As="span">{entry.expand.user?.name} </Text>
                              <Switch>
                                <Match when={!entry.completed}>
                                  <Text As="span">marked incomplete</Text>
                                </Match>
                                <Match when={entry.completed}>
                                  <Text As="span">completed</Text>
                                </Match>
                              </Switch>
                              <Text As="span">
                                {" "}
                                task:{" "}
                                <Text FontWeight="semibold">
                                  {entry.expand.task.title}
                                </Text>
                              </Text>
                            </Match>
                          </Switch>
                        </span>
                      </Flex>
                    </Card>
                  )}
                </For>
              </Card>
            </Flex>
          )}
        </For>
      </Flex>
    </Modal>
  );
};
