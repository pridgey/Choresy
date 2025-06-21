import { createResource, For, Match, Suspense, Switch } from "solid-js";
import { usePocketbase } from "../../context/PocketbaseProvider";
import { TaskHistoryRecord } from "../../types/TaskHistoryRecord";
import { TaskRecord } from "../../types/Task";
import { UserRecord } from "../../types/User";
import moment from "moment";
import { Flex } from "../../components/Flex";
import { Text } from "../../components/Text";
import { BiSolidTimeFive } from "solid-icons/bi";

type TaskHistoryProps = {
  taskRecord: TaskRecord;
};

export const TaskHistory = (props: TaskHistoryProps) => {
  const pb = usePocketbase();

  const [history] = createResource(async () => {
    type ExpandedTaskHistoryRecord = TaskHistoryRecord & {
      expand: {
        task: TaskRecord;
        user: UserRecord;
      };
    };

    const history = await pb
      ?.collection<ExpandedTaskHistoryRecord>("task_history")
      .getFullList({
        expand: "task,user",
        filter: `task = "${props.taskRecord.id}"`,
        sort: "-created",
      });

    return history;
  });

  return (
    <Suspense fallback="Loading History">
      <Flex
        Direction="column"
        Gap="small"
        Style={{
          "max-height": "40vh",
          "overflow-y": "auto",
        }}
      >
        <For each={history()}>
          {(log) => (
            <Flex AlignItems="center" Direction="row" Gap="small">
              <BiSolidTimeFive />
              <Text FontWeight="bold" FontWrap="nowrap">
                {moment(log.created).format("MMM DD YYYY")}
              </Text>
              <Switch>
                <Match when={log.user === "ll64g31qz0j32f3"}>
                  <Text Color="secondary" FontWeight="semibold">
                    Task auto renewed.
                  </Text>
                </Match>
                <Match when={log.user !== "ll64g31qz0j32f3"}>
                  <Text>
                    {log.completed ? "Completed" : "Marked as incomplete"} by{" "}
                    <Text Color="primary">{log.expand.user?.name}</Text>
                  </Text>
                </Match>
              </Switch>
            </Flex>
          )}
        </For>
      </Flex>
    </Suspense>
  );
};
