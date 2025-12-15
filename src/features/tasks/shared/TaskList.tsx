import { Task } from "@entities/task";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  selectedTaskId?: string;
  onTaskSelect?: (taskId: string) => void;
}

export const TaskList = ({ tasks, selectedTaskId, onTaskSelect }: TaskListProps) => {
  return (
    <div className="flex flex-col bg-[#2B2D31] rounded-xl overflow-hidden">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          isSelected={task.id === selectedTaskId}
          onClick={() => onTaskSelect?.(task.id)}
        />
      ))}
    </div>
  );
};

