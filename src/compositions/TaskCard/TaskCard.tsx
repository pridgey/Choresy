import moment from "moment";
import { AiOutlineBorder, AiOutlineCheckSquare } from "solid-icons/ai";
import { BiRegularAlarmSnooze } from "solid-icons/bi";
import { createSignal, Match, Show, Switch } from "solid-js";
import { Avatar } from "../../components/Avatar";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Flex } from "../../components/Flex";
import { Text } from "../../components/Text";
import { usePocketbase, useUser } from "../../context/PocketbaseProvider";
import { TaskRecord } from "../../types/Task";
import { TaskHistoryRecord } from "../../types/TaskHistoryRecord";
import { calculateTimeUntil } from "../../utilities/timeHelpers";
import { TaskCardModal } from "../TaskCardModal";
import styles from "./TaskCard.module.css";

type TaskCardProps = {
  refetchTasks: () => void;
  taskRecord: TaskRecord;
  onUpdate: () => void;
};

export const TaskCard = (props: TaskCardProps) => {
  const user = useUser();
  const pb = usePocketbase();

  const [taskOptions, setTaskOptions] = createSignal(false);

  return (
    <>
      <Button
        OnClick={async () => {
          if (props.taskRecord.id) {
            // Update the task out of sync
            pb?.collection<TaskRecord>("task")
              .update(props.taskRecord.id, {
                completed: !props.taskRecord.completed,
                last_completed_at: props.taskRecord.completed
                  ? props.taskRecord.last_completed_at
                  : new Date().toISOString(),
                last_completed_by: props.taskRecord.completed
                  ? props.taskRecord.last_completed_by
                  : user?.id ?? "unknown user",
              })
              .then(() => {
                // Add to the history once update is completed
                pb?.collection<TaskHistoryRecord>("task_history").create({
                  user: user?.id ?? "unknown user",
                  task: props.taskRecord.id,
                  completed: !props.taskRecord.completed,
                });

                // If this task is being completed, check for any tasks that this triggers
                if (
                  !props.taskRecord.completed &&
                  !!props.taskRecord.triggers_task
                ) {
                  // Set the triggered task to be ready
                  pb.collection<TaskRecord>("task")
                    .update(props.taskRecord.triggers_task, {
                      completed: false,
                    })
                    .then(() => {
                      // Update the triggered task's history
                      pb?.collection<TaskHistoryRecord>("task_history").create({
                        user: "AutoRenew",
                        task: props.taskRecord.triggers_task,
                        completed: false,
                      });
                    });
                }
              });

            // Optimistic update
            props.onUpdate();
          }
        }}
        OnLongPress={() => setTaskOptions(true)}
        Padding="none"
        Width="100%"
        Variant="text"
      >
        <Card
          padding="medium"
          width="100%"
          variant={
            props.taskRecord.completed || props.taskRecord.snoozed
              ? "transparent"
              : "default"
          }
        >
          <Flex
            Direction="column"
            Gap="small"
            Style={{
              "user-select": "none",
            }}
          >
            {/* Title & Checkbox row */}
            <Flex
              AlignItems="center"
              Direction="row"
              JustifyContent="space-between"
              Gap="medium"
              Width="100%"
            >
              <Text FontSize="large" FontWeight="bold" FontWrap="wrap">
                {props.taskRecord.title}
              </Text>
              <div class={styles.checkbox}>
                <Switch>
                  <Match when={props.taskRecord.snoozed}>
                    <BiRegularAlarmSnooze />
                  </Match>
                  <Match when={props.taskRecord.completed}>
                    <Switch>
                      <Match when={props.taskRecord.completed}>
                        <AiOutlineCheckSquare />
                      </Match>
                      <Match when={!props.taskRecord.completed}>
                        <AiOutlineBorder />
                      </Match>
                    </Switch>
                  </Match>
                </Switch>
              </div>
            </Flex>
            {/* Description row */}
            <Show
              when={props.taskRecord.description && !props.taskRecord.completed}
            >
              <Text FontWeight="semibold" FontWrap="wrap">
                {props.taskRecord.description}
              </Text>
            </Show>
            {/* Meta data row */}
            <hr class={styles.hr} />
            <Flex
              AlignItems="center"
              Direction="row"
              JustifyContent="space-between"
              Gap="medium"
              Width="100%"
            >
              <Switch>
                <Match when={!props.taskRecord.last_completed_at}>
                  <Text FontSize="mini">Task Has Never Been Done.</Text>
                </Match>
                <Match when={props.taskRecord.last_completed_at}>
                  <Flex AlignItems="center" Direction="row" Gap="mini">
                    <Text FontSize="mini">
                      Last Completed:{" "}
                      {moment(props.taskRecord.last_completed_at).format(
                        "MMM DD"
                      )}{" "}
                      by{" "}
                      <Text As="span" FontSize="mini" FontWeight="bold">
                        {props.taskRecord.last_completed_by === user?.id
                          ? "you"
                          : props.taskRecord.expand?.last_completed_by?.name ??
                            "Unknown User"}
                      </Text>
                    </Text>
                    <Show when={props.taskRecord.expand?.last_completed_by}>
                      <Avatar
                        InvertColor={true}
                        User={props.taskRecord.expand?.last_completed_by}
                        Variant="mini"
                      />
                    </Show>
                  </Flex>
                </Match>
              </Switch>
              <Switch>
                <Match
                  when={
                    props.taskRecord.completed &&
                    props.taskRecord.cooldown_type !== "never"
                  }
                >
                  <Text FontSize="mini">
                    Will renew in{" "}
                    {calculateTimeUntil(
                      props.taskRecord.last_completed_at,
                      props.taskRecord.cooldown,
                      props.taskRecord.cooldown_type as Exclude<
                        TaskRecord["cooldown_type"],
                        "never"
                      >
                    )}{" "}
                    {props.taskRecord.cooldown_type}
                    {props.taskRecord.cooldown > 1 ||
                    props.taskRecord.cooldown === 0
                      ? "s"
                      : ""}
                  </Text>
                </Match>
                <Match
                  when={
                    !props.taskRecord.completed &&
                    props.taskRecord.can_view.length > 0
                  }
                >
                  <Text FontSize="mini">Private Task</Text>
                </Match>
              </Switch>
            </Flex>
          </Flex>
        </Card>
      </Button>
      {/* Long press to access task card options */}
      <Show when={taskOptions()}>
        <TaskCardModal
          onClose={(refetchTasks) => {
            setTaskOptions(false);
            if (refetchTasks) {
              props.refetchTasks();
            }
          }}
          taskRecord={props.taskRecord}
        />
      </Show>
    </>
  );
};
