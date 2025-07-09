import {
  createMemo,
  createResource,
  createSignal,
  Match,
  Switch,
} from "solid-js";
import { Button } from "../../components/Button";
import { Flex } from "../../components/Flex";
import { Modal } from "../../components/Modal";
import { TaskRecord } from "../../types/Task";
import { AiOutlineHistory, AiFillEdit, AiTwotoneDelete } from "solid-icons/ai";
import { Text } from "../../components/Text";
import { usePocketbase } from "../../context/PocketbaseProvider";
import { TaskHistory } from "../TaskHistory";
import { Input } from "../../components/Input";
import { Toggle } from "../../components/Toggle/Toggle";
import { Card } from "../../components/Card";
import { Select } from "../../components/Select";

type TaskCardModalProps = {
  onClose: (refetch?: boolean) => void;
  taskRecord: TaskRecord;
};

export const TaskCardModal = (props: TaskCardModalProps) => {
  const pb = usePocketbase();

  // Need a list of all tasks to show in dropdown
  // TO-DO: maybe move this to a higher level stateful hook?
  // Retrieving all the tasks anytime someone opens this menu is more resource intensive than it needs to be
  const [tasks] = createResource(async () => {
    const tasks = await pb?.collection<TaskRecord>("task").getFullList();

    return tasks ?? [];
  });

  const [viewMode, setViewMode] = createSignal<
    "default" | "edit" | "history" | "delete"
  >("default");

  // Edit task state
  const [taskTitle, setTaskTitle] = createSignal(props.taskRecord.title);
  const [taskDescription, setTaskDescription] = createSignal(
    props.taskRecord.description
  );
  const [taskRepeatsToggle, setTaskRepeatsToggle] = createSignal(
    props.taskRecord.cooldown > 0
  );
  const [cooldownUnit, setCooldownUnit] = createSignal(
    props.taskRecord.cooldown
  );
  const [cooldownType, setCooldownType] = createSignal<
    TaskRecord["cooldown_type"]
  >(props.taskRecord.cooldown_type || "never");
  const [triggersTask, setTriggersTask] = createSignal<TaskRecord["id"]>("");

  const modalTitle = createMemo(() => {
    switch (viewMode()) {
      case "default":
        return "Task Options";
      case "delete":
        return "Confirm Delete";
      case "edit":
        return "Edit Task";
      case "history":
        return "Task History";
    }
  });

  // Memoized list of tasks that can be triggered by completing a task
  const triggerOptions = createMemo(() => {
    console.log("Creating trigger options...");

    return (tasks() ?? [])
      .filter((t) => t.id !== props.taskRecord.id)
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((t) => ({
        display: t.title,
        value: t.id ?? "unknown id",
      }));
  });

  return (
    <Modal OnClose={props.onClose} Title={modalTitle()}>
      <Switch>
        {/* Main view */}
        <Match when={viewMode() === "default"}>
          <Flex
            AlignItems="center"
            Direction="row"
            JustifyContent="space-around"
          >
            <Button
              FontSize="header"
              OnClick={() => setViewMode("edit")}
              Variant="text"
            >
              Edit <AiFillEdit />
            </Button>
            <Button
              FontSize="header"
              OnClick={() => setViewMode("history")}
              Variant="text"
            >
              History <AiOutlineHistory />
            </Button>
            <Button
              FontSize="header"
              Color="error"
              OnClick={() => setViewMode("delete")}
              Variant="text"
            >
              Delete <AiTwotoneDelete />
            </Button>
          </Flex>
        </Match>
        {/* Edit Task */}
        <Match when={viewMode() === "edit"}>
          <Flex Direction="column" Gap="medium">
            <Input
              DefaultValue={props.taskRecord.title}
              Label="Task"
              OnChange={setTaskTitle}
            />
            <Input
              DefaultValue={props.taskRecord.description}
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
                      DefaultValue={props.taskRecord.cooldown.toString()}
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
            <Select
              placeholder="Triggers Task"
              label="Competing Task Renews Other Task"
              onChange={setTriggersTask}
              options={triggerOptions()}
              value={triggersTask()}
            />
            <Flex
              AlignItems="center"
              Direction="row"
              JustifyContent="flex-end"
              Gap="medium"
            >
              <Button
                OnClick={() => {
                  // Reset form state
                  setTaskTitle("");
                  setTaskDescription("");
                  setCooldownType("never");
                  setCooldownUnit(0);
                  setTaskRepeatsToggle(false);
                  setViewMode("default");
                  setTriggersTask();
                }}
                Variant="outlined"
              >
                Cancel
              </Button>
              <Button
                OnClick={async () => {
                  // Edit the record
                  await pb
                    ?.collection<TaskRecord>("task")
                    .update(props.taskRecord.id ?? "unknown task", {
                      title: taskTitle(),
                      description: taskDescription(),
                      cooldown: cooldownUnit() ?? 0,
                      cooldown_type: taskRepeatsToggle()
                        ? cooldownType()
                        : "never",
                      triggers_task: triggersTask() || null,
                    });
                  props.onClose(true);
                }}
              >
                Submit
              </Button>
            </Flex>
          </Flex>
        </Match>
        {/* Show history */}
        <Match when={viewMode() === "history"}>
          <TaskHistory taskRecord={props.taskRecord} />
        </Match>
        {/* Confirm Delete */}
        <Match when={viewMode() === "delete"}>
          <Flex Direction="column" Gap="medium">
            <Text>
              Deleting the task titled{" "}
              <Text Color="primary">"{props.taskRecord.title}"</Text> cannot be
              undone.
            </Text>
            <Flex
              AlignItems="center"
              Direction="row"
              Gap="medium"
              JustifyContent="flex-end"
            >
              <Button OnClick={() => setViewMode("default")}>Cancel</Button>
              <Button
                Color="error"
                OnClick={async () => {
                  await pb
                    ?.collection<TaskRecord>("task")
                    .delete(props.taskRecord.id ?? "unknown task");
                  props.onClose(true);
                }}
              >
                Delete
              </Button>
            </Flex>
          </Flex>
        </Match>
      </Switch>
    </Modal>
  );
};
