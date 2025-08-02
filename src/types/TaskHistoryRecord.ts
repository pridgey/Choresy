import { TaskRecord } from "./Task";
import { UserRecord } from "./User";

export type TaskHistoryRecord = {
  id?: string;
  task: string;
  user: string;
  completed: boolean;
  created: string;
  expand: {
    user: UserRecord;
    task: TaskRecord;
  };
};
