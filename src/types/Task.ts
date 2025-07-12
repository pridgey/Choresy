import { UserRecord } from "./User";

export type TaskRecord = {
  id?: string;
  family: string;
  title: string;
  description: string;
  last_completed_by: string;
  last_completed_at: string;
  cooldown: number;
  cooldown_type: "day" | "week" | "month" | "year" | "never";
  completed: boolean;
  created_by: string;
  triggers_task: string;
  can_view: string[];
  expand: {
    last_completed_by: UserRecord;
  };
};
