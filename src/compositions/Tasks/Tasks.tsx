import moment from "moment";
import {
  createMemo,
  createResource,
  createSignal,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Flex } from "../../components/Flex";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Select } from "../../components/Select";
import { Text } from "../../components/Text";
import { Toggle } from "../../components/Toggle/Toggle";
import {
  useFamily,
  usePocketbase,
  useUser,
} from "../../context/PocketbaseProvider";
import { TaskRecord } from "../../types/Task";
import { TaskHistoryRecord } from "../../types/TaskHistoryRecord";
import { UserRecord } from "../../types/User";
import { PullToRefresh } from "../PullToReload";
import { TaskCard } from "../TaskCard/TaskCard";
import styles from "./Tasks.module.css";

/* Composition that lists all tasks via TaskCards and allows creation of new tasks */
export const Tasks = () => {
  const pb = usePocketbase();
  const user = useUser();
  const family = useFamily();

  // Utility function to check if any of the fetched tasks are ready to be renewed
  const updatePastDueTasks = async (tasks: TaskRecord[]) => {
    // Update any tasks passed their cooldown
    if (tasks?.length) {
      for (const task of tasks) {
        // Determine if task needs to be reset
        if (task.completed || task.snoozed) {
          const now = moment();
          const lastCompleted = moment(task.last_completed_at);
          let isPassedDue = false;

          switch (task.cooldown_type) {
            case "never":
            default: {
              isPassedDue = false;
              break;
            }
            case "day": {
              const currentDayOfYear = now.dayOfYear();
              const lastCompletedDayOfYear = lastCompleted.dayOfYear();

              isPassedDue =
                currentDayOfYear - lastCompletedDayOfYear >= task.cooldown ||
                now.year() !== lastCompleted.year();

              break;
            }
            case "week": {
              const currentWeekOfYear = now.week();
              const lastCompletedWeekOfYear = lastCompleted.week();

              isPassedDue =
                currentWeekOfYear - lastCompletedWeekOfYear >= task.cooldown ||
                now.year() !== lastCompleted.year();

              break;
            }
            case "month": {
              const currentMonthOfYear = now.month();
              const lastCompletedMonthOfYear = lastCompleted.month();

              isPassedDue =
                currentMonthOfYear - lastCompletedMonthOfYear >=
                  task.cooldown || now.year() !== lastCompleted.year();

              break;
            }
            case "year": {
              const currentYear = now.year();
              const lastCompletedYear = lastCompleted.year();

              isPassedDue = currentYear - lastCompletedYear >= task.cooldown;

              break;
            }
          }

          if (isPassedDue && task.id) {
            // Set it ready to do again
            await pb?.collection<TaskRecord>("task").update(task.id, {
              completed: false,
              snoozed: false,
            });
            if (task.completed && !task.snoozed) {
              // Add a log so we know
              await pb?.collection<TaskHistoryRecord>("task_history").create({
                completed: false,
                user: "ll64g31qz0j32f3", // AutoRenew user
                task: task.id,
              });
            }
            // Set current record to incomplete
            task.completed = false;
            task.snoozed = false;
          }
        }
      }
    }
  };

  // Stateful query to get tasks
  const [tasks, { refetch, mutate }] = createResource(async () => {
    const tasks = await pb?.collection<TaskRecord>("task").getFullList({
      expand: "last_completed_by",
    });

    if (tasks) {
      updatePastDueTasks(tasks);
    }

    // Organize tasks by incomplete -> complete
    return {
      completed: [...(tasks?.filter((t) => t.completed || t.snoozed) ?? [])],
      incompleted: [
        ...(tasks?.filter((t) => !t.completed && !t.snoozed) ?? []),
      ],
    };
  });

  // Subscribe to changes in the collection to update current state without needing to refetch data
  onMount(async () => {
    await pb?.collection<TaskRecord>("task").subscribe("*", (data) => {
      switch (data.action) {
        // On update events...
        case "update": {
          const taskRecord = data.record;

          if (taskRecord && taskRecord.last_completed_by !== user?.id) {
            mutate((prev) => {
              if (taskRecord.completed) {
                // Someone marked it as complete
                const completedTaskIndex =
                  prev?.incompleted.findIndex((t) => t.id === taskRecord.id) ??
                  -1;

                if (completedTaskIndex > -1) {
                  prev?.incompleted.splice(completedTaskIndex, 1);
                }

                // Assuming there's not already a task in the array, add it
                if (!prev?.completed.some((t) => t.id === taskRecord.id)) {
                  prev?.completed.push(taskRecord);
                }
              } else {
                // Someone marked it as incomplete
                const incompleteTaskIndex =
                  prev?.completed.findIndex((t) => t.id === taskRecord.id) ??
                  -1;

                if (incompleteTaskIndex > -1) {
                  prev?.completed.splice(incompleteTaskIndex, 1);
                }

                // Assuming there's not already a task in the array, add it
                if (!prev?.incompleted.some((t) => t.id === taskRecord.id)) {
                  prev?.incompleted.push(taskRecord);
                }
              }

              return {
                incompleted: [...(prev?.incompleted ?? [])],
                completed: [...(prev?.completed ?? [])],
              };
            });
          }
          break;
        }
        // On creation events...
        case "create": {
          const taskRecord = data.record;

          if (taskRecord) {
            mutate((prev) => {
              if (taskRecord.created_by !== (user?.id ?? "unknown")) {
                prev?.incompleted.push(taskRecord);
              }

              return {
                incompleted: [...(prev?.incompleted ?? [])],
                completed: [...(prev?.completed ?? [])],
              };
            });
          }
          break;
        }
        // On deletion events...
        case "delete": {
          const taskRecord = data.record;

          if (taskRecord) {
            mutate((prev) => {
              if (taskRecord.completed) {
                // Deleted a complete task
                const completedTaskIndex =
                  prev?.completed.findIndex((t) => t.id === taskRecord.id) ??
                  -1;

                if (completedTaskIndex > -1) {
                  prev?.completed.splice(completedTaskIndex, 1);
                }
              } else {
                // Deleted an incomplete task
                const incompleteTaskIndex =
                  prev?.incompleted.findIndex((t) => t.id === taskRecord.id) ??
                  -1;

                if (incompleteTaskIndex > -1) {
                  prev?.incompleted.splice(incompleteTaskIndex, 1);
                }
              }
              return {
                incompleted: [...(prev?.incompleted ?? [])],
                completed: [...(prev?.completed ?? [])],
              };
            });
          }
          break;
        }
      }
    });
  });

  onCleanup(async () => {
    await pb?.collection("task").unsubscribe("*");
  });

  const [showCreateTaskDialog, setShowCreateTaskDialog] = createSignal(false);
  // New task state
  const [taskTitle, setTaskTitle] = createSignal("");
  const [taskDescription, setTaskDescription] = createSignal("");
  const [taskRepeatsToggle, setTaskRepeatsToggle] = createSignal(false);
  const [cooldownUnit, setCooldownUnit] = createSignal(0);
  const [cooldownType, setCooldownType] =
    createSignal<TaskRecord["cooldown_type"]>("never");
  const [triggersTask, setTriggersTask] = createSignal<TaskRecord["id"]>("");
  const [privateUsers, setPrivateUsers] = createSignal<UserRecord["id"][]>([]);

  // Memoized list of tasks that can be triggered by completing a task
  const triggerOptions = createMemo(() => {
    console.log("Creating trigger options...");

    return [...(tasks()?.completed ?? []), ...(tasks()?.incompleted ?? [])]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((t) => ({
        display: t.title,
        value: t.id ?? "unknown id",
      }));
  });

  return (
    <section class={styles.container}>
      <PullToRefresh
        onRefresh={async () => {
          await refetch();
        }}
      >
        <Flex
          Direction="column"
          Gap="medium"
          Style={{ "overflow-y": "auto", "min-height": 0 }}
        >
          {/* Incomplete Tasks */}
          {[...(tasks()?.incompleted ?? [])]?.map((t, i) => (
            <TaskCard
              refetchTasks={refetch}
              taskRecord={t}
              onUpdate={() => {
                // TO-DO: determine when an action was done by the current user to ignore the subscription update
                mutate((prev) => {
                  // remove from completed
                  prev?.incompleted.splice(i, 1);
                  // add to incomplete
                  prev?.completed.push({
                    ...t,
                    completed: true,
                  });

                  return {
                    completed: [...(prev?.completed ?? [])],
                    incompleted: [...(prev?.incompleted ?? [])],
                  };
                });
              }}
            />
          ))}
          {/* Completed Tasks */}
          <Show when={tasks()?.completed.length}>
            <Flex AlignItems="center" Direction="row" Gap="small">
              <hr class={styles.hr} />
              <Text
                Align="center"
                Color="black"
                FontWeight="bold"
                FontWrap="nowrap"
              >
                Completed Tasks
              </Text>
              <hr class={styles.hr} />
            </Flex>
            {[...(tasks()?.completed ?? [])]?.map((t, i) => (
              <TaskCard
                refetchTasks={refetch}
                taskRecord={t}
                onUpdate={() => {
                  mutate((prev) => {
                    // remove from completed
                    prev?.completed.splice(i, 1);
                    // add to incomplete
                    prev?.incompleted.push({
                      ...t,
                      completed: false,
                    });

                    return {
                      completed: [...(prev?.completed ?? [])],
                      incompleted: [...(prev?.incompleted ?? [])],
                    };
                  });
                }}
              />
            ))}
          </Show>
        </Flex>
      </PullToRefresh>
      {/* Create a new task */}
      <Button
        Color="white"
        OnClick={() => setShowCreateTaskDialog(true)}
        Variant="outlined"
      >
        Create New Task
      </Button>
      <Show when={showCreateTaskDialog()}>
        <Modal
          OnClose={() => setShowCreateTaskDialog(false)}
          OnSubmit={async () => {
            // Create a new task
            if (taskTitle() && user) {
              await pb?.collection<TaskRecord>("task").create({
                family: user.family,
                title: taskTitle(),
                description: taskDescription(),
                cooldown: cooldownUnit() ?? 0,
                cooldown_type: taskRepeatsToggle() ? cooldownType() : "never",
                created_by: user.id ?? "unknown user",
                triggers_task: triggersTask() || null,
                can_view: privateUsers().length ? privateUsers() : null,
              });

              // Reset form state
              setTaskTitle("");
              setTaskDescription("");
              setCooldownType("never");
              setCooldownUnit(0);
              setTaskRepeatsToggle(false);
              setTriggersTask();
              setPrivateUsers([]);

              setShowCreateTaskDialog(false);
              refetch();
            }
          }}
          Title="Create New Task"
        >
          <Flex Direction="column" Gap="medium">
            <Input Label="Task" OnChange={setTaskTitle} />
            <Input
              Label="Description"
              Multiline={true}
              OnChange={setTaskDescription}
            />
            <Switch>
              <Match when={!taskRepeatsToggle()}>
                <Toggle
                  Checked={taskRepeatsToggle()}
                  Label="Task Repeats"
                  OnChange={setTaskRepeatsToggle}
                />
              </Match>
              {/* Task Repeats card */}
              <Match when={taskRepeatsToggle()}>
                <Card variant="outlined">
                  <Flex
                    AlignItems="flex-end"
                    Direction="row"
                    JustifyContent="space-between"
                    Gap="medium"
                  >
                    <Toggle
                      Checked={taskRepeatsToggle()}
                      Label="Task Repeats"
                      OnChange={setTaskRepeatsToggle}
                    />
                    <Input
                      DefaultValue="1"
                      Label="Every"
                      OnChange={setCooldownUnit}
                      Type="number"
                    />
                    <Select
                      placeholder="Days"
                      label="Unit of Time"
                      onChange={setCooldownType}
                      options={[
                        {
                          display:
                            cooldownUnit() > 1 || cooldownUnit() === 0
                              ? "days"
                              : "day",
                          value: "day",
                        },
                        {
                          display: "week",
                          value: "week",
                        },
                        {
                          display: "month",
                          value: "month",
                        },
                        {
                          display: "year",
                          value: "year",
                        },
                      ]}
                      value={cooldownType()}
                    />
                  </Flex>
                </Card>
              </Match>
            </Switch>
            {/* Dropdown to pick a task to trigger from this task */}
            <Select
              placeholder="Triggers Task"
              label="Competing Task Renews Other Task"
              onChange={setTriggersTask}
              options={triggerOptions()}
              value={triggersTask()}
            />
            {/* Mark task as private */}
            <Select
              placeholder="Who Can See"
              label="Mark Private"
              multiple={true}
              onChange={setPrivateUsers}
              options={family().map((f) => ({
                value: f.id,
                display: f.name ?? f.email,
              }))}
              value={privateUsers()}
            />
          </Flex>
        </Modal>
      </Show>
    </section>
  );
};
