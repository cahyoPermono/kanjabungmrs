import { useEffect, useState } from "react";
import { useAuthStore } from "../store/authStore";
import axios from "axios";
import { 
    Task, 
    TaskStatus, 
    User,
    PriorityPopover,
    DueDatePopover,
    AssigneePopover,
    MoreActionsMenu
} from "../components/task/TaskActions";
import { Card, CardContent, CardHeader, CardTitle as ShadCardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Loader2, Plus } from "lucide-react"; 
import { Button } from "../components/ui/button";
import { useTaskOperations } from "../hooks/useTaskOperations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "TODO", title: "To Do", color: "bg-gray-100" },
  { id: "IN_PROGRESS", title: "In Progress", color: "bg-blue-50" },
  { id: "COMPLETED", title: "Completed", color: "bg-green-50" },
];

interface Goal {
    id: number;
    code: string;
    title: string;
}

export default function Board() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  
  // Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState('MEDIUM');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('TODO');

  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
        const [tasksRes, goalsRes, employeesRes] = await Promise.all([
            axios.get('http://localhost:3000/api/tasks'),
            axios.get('http://localhost:3000/api/goals'),
            axios.get('http://localhost:3000/api/goals/employees')
        ]);
        
        // Filter for employee's tasks
        const myTasks = tasksRes.data.filter((t: Task) => t.assigneeId === user?.id);
        setTasks(myTasks);
        setGoals(goalsRes.data);
        setEmployees(employeesRes.data);
    } catch (error) {
        console.error("Failed to fetch data", error);
    } finally {
        setLoading(false);
    }
  };

  const { updateAssignee, updatePriority, updateDueDate, updateStatus, deleteTask } = useTaskOperations(fetchData);

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateTask = async () => {
      if (!selectedGoalId || !taskTitle) return;
      try {
          await axios.post('http://localhost:3000/api/tasks', {
              title: taskTitle,
              description: taskDescription,
              priority: taskPriority === 'NO_PRIORITY' ? null : taskPriority,
              dueDate: taskDueDate,
              status: selectedStatus,
              goalId: parseInt(selectedGoalId),
              assigneeId: user?.id // Auto-assign to self
          });
          setNewTaskOpen(false);
          resetTaskForm();
          fetchData(); 
      } catch (error) {
          console.error(error);
          alert('Failed to create task');
      }
  };
  
  const resetTaskForm = () => {
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('MEDIUM');
      setTaskDueDate('');
      setSelectedGoalId('');
  }

  const openAddTask = (status: string = 'TODO') => {
      setSelectedStatus(status);
      setNewTaskOpen(true);
  };

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
        <Button onClick={() => openAddTask('TODO')}>
            <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
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
                    className="cursor-move hover:shadow-md transition-shadow active:cursor-grabbing group relative"
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreActionsMenu task={task} onDelete={deleteTask} />
                    </div>
                    <CardHeader className="p-4 pb-2 space-y-0">
                      <div className="flex justify-between items-start pr-6">
                         <div onClick={(e) => e.stopPropagation()}>
                            <PriorityPopover task={task} onUpdate={updatePriority} />
                         </div>
                      </div>
                      <ShadCardTitle className="text-sm font-medium leading-tight mt-2">
                        {task.title}
                      </ShadCardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-2">
                       <p className="text-xs text-muted-foreground line-clamp-2">
                            {task.goal?.title}
                       </p>
                       
                       <div className="flex items-center justify-between pt-2">
                            <div onClick={(e) => e.stopPropagation()}>
                                <DueDatePopover task={task} onUpdate={updateDueDate} />
                            </div>
                            {/* Assignee is typically self in this view, but showing avatar is nice */}
                            <div onClick={(e) => e.stopPropagation()}>
                                <AssigneePopover task={task} employees={employees} onUpdate={updateAssignee} />
                            </div>
                       </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
            {/* Quick Add Button at bottom of column */}
            <Button 
                variant="ghost" 
                className="w-full mt-2 hover:bg-white/50"
                onClick={() => openAddTask(col.id)}
            >
                <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </div>
        ))}
      </div>

      {/* Task Creation Dialog */}
      <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add New Task ({selectedStatus.replace('_', ' ')})</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Goal</Label>
                    <Select 
                        value={selectedGoalId} 
                        onValueChange={setSelectedGoalId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Goal" />
                        </SelectTrigger>
                        <SelectContent>
                            {goals.map(g => (
                                <SelectItem key={g.id} value={g.id.toString()}>{g.code ? `[${g.code}] ` : ''}{g.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="grid gap-2">
                    <Label>Title</Label>
                    <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label>Description <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                    <Textarea 
                        value={taskDescription} 
                        onChange={e => setTaskDescription(e.target.value)} 
                        className="resize-none"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Priority</Label>
                        <Select value={taskPriority} onValueChange={setTaskPriority}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="NO_PRIORITY">No Priority</SelectItem>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="URGENT">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Due Date</Label>
                        <Input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleCreateTask} disabled={!selectedGoalId || !taskTitle}>Create Task</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
