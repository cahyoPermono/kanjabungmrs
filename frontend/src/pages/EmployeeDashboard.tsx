import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Accordion,
} from "@/components/ui/accordion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea";  
import { TaskStatusGroup } from '@/components/task/TaskStatusGroup';
import { useTaskOperations } from '@/hooks/useTaskOperations';
import { Task, User } from '@/components/task/TaskActions';
import { TaskFilters, FilterState } from '@/components/task/TaskFilters';
import { useAuthStore } from '@/store/authStore';

interface Goal {
    id: number;
    code: string;
    title: string;
}

export default function EmployeeDashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [employees, setEmployees] = useState<User[]>([]); // Need employees for popovers
    const [loading, setLoading] = useState(true);
    const user = useAuthStore((state) => state.user);

    // Dialogs
    const [newTaskOpen, setNewTaskOpen] = useState(false);
    
    // New Task Form
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskPriority, setTaskPriority] = useState('MEDIUM');
    const [taskDueDate, setTaskDueDate] = useState('');
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('TODO');
    
    // Filters
    const [filters, setFilters] = useState<FilterState>({});


    const fetchData = async () => {
        try {
            const [tasksRes, goalsRes, employeesRes] = await Promise.all([
                axios.get('http://localhost:3000/api/tasks', { params: filters }),
                axios.get('http://localhost:3000/api/goals'),
                axios.get('http://localhost:3000/api/goals/employees')
            ]);
            setTasks(tasksRes.data);
            setGoals(goalsRes.data);
            setEmployees(employeesRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const { updateAssignee, updatePriority, updateDueDate, updateStatus, addComment, deleteTask } = useTaskOperations(fetchData);

    useEffect(() => {
        fetchData();
    }, [filters]);

    const [editingTask, setEditingTask] = useState<Task | null>(null);

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
                    status: selectedStatus 
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
        setTaskPriority('MEDIUM');
        setTaskDueDate('');
        setSelectedGoalId('');
        setEditingTask(null);
    }

    const openAddTask = (status: string = 'TODO') => {
        resetTaskForm();
        setSelectedStatus(status);
        setNewTaskOpen(true);
    };

    if (loading) return <div className="p-8">Loading...</div>;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'COMPLETED') return false;
        const due = new Date(t.dueDate);
        return due < today;
    });

    const nearDueTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'COMPLETED') return false;
        const due = new Date(t.dueDate);
        const diffTime = due.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        return diffDays >= 0 && diffDays <= 3 && due >= today; // 0 to 3 days from now
    });

    return (
        <div className="p-4 md:p-8 space-y-8 relative min-h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
                <Button onClick={() => openAddTask('TODO')}>+ Add Task</Button>
            </div>

            <TaskFilters 
                filters={filters} 
                setFilters={setFilters} 
                employees={employees}
                showAssignee={user?.role === 'MANAGER' || user?.role === 'ADMIN'}
            />

            <Accordion type="multiple" defaultValue={["IN_PROGRESS", "TODO", "COMPLETED"]} className="w-full space-y-4">
                {["IN_PROGRESS", "TODO", "COMPLETED"].map((status) => {
                    const statusTasks = tasks.filter(t => t.status === status);
                    
                    return (
                       <TaskStatusGroup 
                            key={status}
                            status={status}
                            tasks={statusTasks}
                            employees={employees}
                            onAddTask={openAddTask}
                            onUpdateAssignee={updateAssignee}
                            onUpdatePriority={updatePriority}
                            onUpdateStatus={updateStatus}
                            onUpdateDueDate={updateDueDate}
                            onAddComment={addComment}
                            onDeleteTask={deleteTask}
                            onEdit={handleEditTask}
                       />
                    );
                })}
            </Accordion>
            
            <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4 items-end pointer-events-none">
                {/* Overdue Reminder */}
                {overdueTasks.length > 0 && (
                    <div className="pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-500 bg-destructive text-destructive-foreground p-4 rounded-lg shadow-lg max-w-sm border-2 border-red-600 flex flex-col gap-2">
                            <div className="flex items-center gap-2 font-bold text-lg">
                                <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                                Warning: {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? 's' : ''}!
                            </div>
                            <p className="text-sm opacity-90">
                                You have tasks that are past their due date. Please update their status or reschedule.
                            </p>
                            <ul className="text-xs list-disc pl-4 opacity-90 max-h-24 overflow-y-auto">
                                {overdueTasks.map(t => (
                                    <li key={t.id}>{t.title} (Due: {new Date(t.dueDate!).toLocaleDateString()})</li>
                                ))}
                            </ul>
                    </div>
                )}

                {/* Near Due Warning */}
                {nearDueTasks.length > 0 && (
                    <div className="pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-500 bg-amber-500 text-white p-4 rounded-lg shadow-lg max-w-sm border-2 border-amber-600 flex flex-col gap-2">
                            <div className="flex items-center gap-2 font-bold text-lg">
                                <span className="relative flex h-3 w-3">
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                                </span>
                                Reminder: {nearDueTasks.length} Due Soon
                            </div>
                            <p className="text-sm opacity-95">
                                You have tasks due within the next 3 days.
                            </p>
                            <ul className="text-xs list-disc pl-4 opacity-95 max-h-24 overflow-y-auto">
                                {nearDueTasks.map(t => (
                                    <li key={t.id}>{t.title} (Due: {new Date(t.dueDate!).toLocaleDateString()})</li>
                                ))}
                            </ul>
                    </div>
                )}
            </div>

            {/* Task Creation Dialog */}
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTask ? 'Edit Task' : `Add New Task (${selectedStatus})`}</DialogTitle>
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
                                className="min-h-[80px] resize-none"
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
                        <Button onClick={handleCreateOrUpdateTask}>{editingTask ? 'Save Changes' : 'Create Task'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
