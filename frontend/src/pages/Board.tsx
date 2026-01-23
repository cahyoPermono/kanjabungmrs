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
  const [editingTask, setEditingTask] = useState<Task | null>(null);
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
        
        
        // Handle paginated response structure
        const allTasks = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data.data || []);
        
        // Filter for employee's tasks
        const myTasks = allTasks.filter((t: Task) => t.assigneeId === user?.id);
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

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setTaskTitle(task.title);
        setTaskDescription(task.description || '');
        setTaskPriority(task.priority || 'NO_PRIORITY');
        setTaskDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
        setSelectedGoalId(task.goalId.toString());
        setSelectedStatus(task.status);
        setNewTaskOpen(true);
    };

    const handleCreateOrUpdateTask = async () => {
        if (!selectedGoalId || !taskTitle) return;
        try {
            if (editingTask) {
                await axios.put(`http://localhost:3000/api/tasks/${editingTask.id}`, {
                    title: taskTitle,
                    description: taskDescription,
                    priority: taskPriority === 'NO_PRIORITY' ? null : taskPriority,
                    dueDate: taskDueDate,
                    goalId: parseInt(selectedGoalId),
                    status: selectedStatus // Allow status change if needed, though drag/drop is preferred
                });
            } else {
                await axios.post('http://localhost:3000/api/tasks', {
                    title: taskTitle,
                    description: taskDescription,
                    priority: taskPriority === 'NO_PRIORITY' ? null : taskPriority,
                    dueDate: taskDueDate,
                    status: selectedStatus,
                    goalId: parseInt(selectedGoalId),
                    assigneeId: user?.id
                });
            }
            setNewTaskOpen(false);
            resetTaskForm();
            fetchData();
        } catch (error) {
            console.error(error);
            alert(`Failed to ${editingTask ? 'update' : 'create'} task`);
        }
    };
  
  const resetTaskForm = () => {
      setTaskTitle('');
      setTaskDescription('');
      setTaskPriority('NO_PRIORITY');
      setTaskDueDate('');
      setSelectedGoalId('');
      setEditingTask(null);
  }

    const openAddTask = (status: TaskStatus) => {
        resetTaskForm();
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
        <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden">
             <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Project Board</h1>
                <Button onClick={() => openAddTask('TODO')}>
                    <Plus className="h-4 w-4 mr-2" /> Add Task
                </Button>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                 <div className="flex h-full gap-6 min-w-[1000px]">
                    {COLUMNS.map(column => (
                        <div 
                            key={column.id}
                            className="flex-1 flex flex-col bg-muted/30 rounded-lg border h-full w-[350px]"
                            onDragOver={onDragOver}
                            onDrop={(e) => onDrop(e, column.id)}
                        >
                            <div className={`p-4 font-semibold text-sm flex items-center justify-between border-b ${column.color} bg-opacity-10`}>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${column.color.replace('text-', 'bg-')}`}></span>
                                    {column.title}
                                    <span className="bg-background text-muted-foreground px-2 py-0.5 rounded-full text-xs border">
                                        {tasks.filter(t => t.status === column.id).length}
                                    </span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openAddTask(column.id)}>
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                {tasks.filter(t => t.status === column.id).map(task => (
                                    <div 
                                        key={task.id}
                                        draggable
                                        onDragStart={(e) => onDragStart(e, task.id)}
                                        className="bg-card p-4 rounded-md border shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative"
                                    >
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreActionsMenu task={task} onDelete={deleteTask} onEdit={handleEditTask} />
                                        </div>
                                        <div className="mb-2">
                                             {task.goal?.title && (
                                                <div className="text-[10px] text-muted-foreground mb-1 bg-muted w-fit px-1.5 py-0.5 rounded">
                                                    {task.goal.title}
                                                </div>
                                            )}
                                            <h4 className="font-medium text-sm leading-tight pr-6">{task.title}</h4>
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            <PriorityPopover task={task} onUpdate={updatePriority} />
                                            <DueDatePopover task={task} onUpdate={updateDueDate} />
                                            <div className="ml-auto">
                                                <AssigneePopover task={task} employees={employees} onUpdate={updateAssignee} />
                                            </div>
                                        </div>

                                        {(task.description || (task.comments && task.comments.length > 0)) && (
                                            <div className="border-t mt-3 pt-2 flex gap-3 text-xs text-muted-foreground">
                                                {task.description && (
                                                    <div className="flex items-center gap-1 max-w-[120px] truncate" title={task.description}>
                                                        <span className="truncate">{task.description}</span>
                                                    </div>
                                                )}
                                                {task.comments && task.comments.length > 0 && (
                                                     <div className="flex items-center gap-1 ml-auto">
                                                        <span>{task.comments.length}</span>
                                                        <span className="text-[10px]">comments</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <Button 
                                    variant="ghost" 
                                    className="w-full justify-start text-muted-foreground text-sm h-9 hover:text-foreground"
                                    onClick={() => openAddTask(column.id)}
                                >
                                    <Plus className="h-3 w-3 mr-2" /> Quick Add
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

             <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTask ? 'Edit Task' : `Add New Task (${selectedStatus.replace('_', ' ')})`}</DialogTitle>
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
                                className="min-h-[80px]"
                                value={taskDescription} 
                                onChange={e => setTaskDescription(e.target.value)} 
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
                        <Button onClick={handleCreateOrUpdateTask} disabled={!selectedGoalId || !taskTitle}>{editingTask ? 'Save Changes' : 'Create Task'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
