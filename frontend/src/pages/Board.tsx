import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import axios from "axios";
import { Task, TaskStatus } from "../components/task/TaskActions"; // Corrected import path for types? No Wait. Task/TaskStatus/User logic.
import { Card, CardContent, CardHeader, CardTitle as ShadCardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { format } from "date-fns";
import { Loader2 } from "lucide-react"; 
import { useTaskOperations } from "../hooks/useTaskOperations";

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [ // TaskStatus is string usually..
  { id: "TODO", title: "To Do", color: "bg-gray-100" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-50" },
  { id: "COMPLETED", title: "Completed", color: "bg-green-50" },
];

export default function Board() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { updateStatus } = useTaskOperations(fetchTasks); // Provide fetchTasks to hook

  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

  async function fetchTasks() { // Function hoisting or define before use
    try {
      const { data } = await axios.get("http://localhost:3000/api/tasks");
      // Filter for employee's tasks if API returns all
      const myTasks = data.filter((t: Task) => t.assigneeId === user?.id);
      setTasks(myTasks);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const onDragStart = (e: React.DragEvent, taskId: number) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (!draggedTaskId) return;

    // Optimistic update
    const originalTasks = [...tasks];
    const updatedTasks = tasks.map((t) =>
      t.id === draggedTaskId ? { ...t, status } : t
    );
    setTasks(updatedTasks);

    try {
      await updateStatus(draggedTaskId, status);
    } catch (error) {
      console.error("Failed to update task status", error);
      setTasks(originalTasks); // Revert
    } finally {
      setDraggedTaskId(null);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-4 md:p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Board</h1>
          <p className="text-muted-foreground">Drag and drop tasks to update status.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 h-full overflow-x-auto pb-4">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className={`flex-1 min-w-[300px] rounded-lg p-4 ${col.color}`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, col.id)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{col.title}</h2>
              <Badge variant="secondary">
                {tasks.filter((t) => t.status === col.id).length}
              </Badge>
            </div>

            <div className="space-y-3">
              {tasks
                .filter((t) => t.status === col.id)
                .map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, task.id)}
                    className="cursor-move hover:shadow-md transition-shadow active:cursor-grabbing"
                  >
                    <CardHeader className="p-4 pb-2 space-y-0">
                      <div className="flex justify-between items-start">
                        <Badge
                          variant={task.priority === "URGENT" ? "destructive" : "outline"}
                          className="mb-2"
                        >
                          {task.priority || "NORMAL"}
                        </Badge>
                      </div>
                      <ShadCardTitle className="text-sm font-medium leading-none">
                        {task.title}
                      </ShadCardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                       <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {task.goal?.title}
                       </p>
                      {task.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Due: {format(new Date(task.dueDate), "MMM d")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
