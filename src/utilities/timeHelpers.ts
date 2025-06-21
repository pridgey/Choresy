import moment from "moment";
import { TaskRecord } from "../types/Task";

export const calculateTimeUntil = (
  lastCompleted: string,
  cooldown: number,
  cooldownType: Extract<
    TaskRecord["cooldown_type"],
    "day" | "week" | "month" | "year"
  >
) => {
  // Last Completed + Cooldown is next refresh date
  const lastCompletedDate = moment(lastCompleted);

  const refreshDate = lastCompletedDate.add(cooldown, cooldownType);

  // Refresh date - now is time until
  const timeUntil = moment().diff(refreshDate, cooldownType);

  return Math.abs(timeUntil ?? 0) + 1;
};
