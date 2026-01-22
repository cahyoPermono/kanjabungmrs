import { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import {
    Accordion,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { ListTodo } from 'lucide-react';
import { TaskStatusGroup } from '@/components/task/TaskStatusGroup';
import { useTaskOperations } from '@/hooks/useTaskOperations';
import { Task, User } from '@/components/task/TaskActions';
import { TaskFilters, FilterState } from '@/components/task/TaskFilters';
import { useAuthStore } from '@/store/authStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Goal {
    id: number;
    title: string;
}

export default function Tasks() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(false);

    // Add Task Dialog State
    const [newTaskOpen, setNewTaskOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('TODO');
    
    // Filters
    const [filters, setFilters] = useState<FilterState>({});
    const user = useAuthStore((state) => state.user);
    
    // Form State
    const [taskTitle, setTaskTitle] = useState('');
    const [taskPriority, setTaskPriority] = useState('MEDIUM');
    const [taskAssigneeId, setTaskAssigneeId] = useState<string>('');
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');
    const [taskDueDate, setTaskDueDate] = useState<string>('');

    const fetchTasks = async () => {
        setLoading(true);
        try {
            // Fetch all tasks without date filter
            const res = await axios.get('http://localhost:3000/api/tasks', { params: filters });
            setTasks(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/goals/employees');
            setEmployees(res.data);
        } catch (error) {
            console.error(error);
        }
    }

    const fetchGoals = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/goals');
            setGoals(res.data);
        } catch (error) {
            console.error("Error fetching goals", error);
        }
    }
    
    // Shared operations
    const { updateAssignee, updatePriority, updateDueDate, updateStatus, addComment, deleteTask } = useTaskOperations(fetchTasks);

    useEffect(() => {
        fetchTasks();
        fetchEmployees();
        fetchGoals();
    }, [filters]);

    const handleCreateTask = async () => {
        if (!selectedGoalId || !taskTitle || !taskDueDate) return;
        try {
            await axios.post('http://localhost:3000/api/tasks', {
                title: taskTitle,
                priority: taskPriority,
                dueDate: taskDueDate, // YYYY-MM-DD from input type=date
                status: selectedStatus,
                goalId: parseInt(selectedGoalId),
                assigneeId: taskAssigneeId ? parseInt(taskAssigneeId) : null
            });
            setNewTaskOpen(false);
            // Reset form
            setTaskTitle('');
            setSelectedGoalId('');
            setTaskPriority('MEDIUM');
            setTaskAssigneeId('');
            setTaskDueDate('');
            
            fetchTasks(); // Refresh list
        } catch (error) {
            console.error(error);
        }
    };

    const openAddTask = (status: string) => {
        setSelectedStatus(status);
        setTaskDueDate(format(new Date(), 'yyyy-MM-dd')); // Default to today
        setNewTaskOpen(true);
    };

    return (
        <div className="flex h-screen bg-gray-50/30">
            {/* Main Content (No Sidebar) */}
            <div className="flex-1 p-4 md:p-8 overflow-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                         <div className="bg-primary/10 p-3 rounded-lg">
                            <ListTodo className="h-6 w-6 text-primary" />
                         </div>
                         <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            All Tasks
                        </h1>
                    </div>
                </div>

                <div className="mb-6 flex gap-2">
                     <TaskFilters 
                        filters={filters} 
                        setFilters={setFilters} 
                        employees={employees}
                        showAssignee={true} // Manager view
                    />
                    <Button onClick={() => openAddTask('TODO')}>+ Add Task</Button>
                </div>

                {loading ? (
                    <div>Loading tasks...</div>
                ) : (
                    <Accordion type="multiple" defaultValue={["IN_PROGRESS", "TODO", "COMPLETED"]} className="w-full space-y-4">
                        {["IN_PROGRESS", "TODO", "COMPLETED"].map(status => {
                             const statusTasks = tasks.filter(t => t.status === status);
                             return (
                                <TaskStatusGroup 
                                    key={status}
                                    status={status}
                                    tasks={statusTasks}
                                    employees={employees}
                                    onAddTask={(status) => openAddTask(status)}
                                    onUpdateAssignee={updateAssignee}
                                    onUpdatePriority={updatePriority}
                                    onUpdateStatus={updateStatus}
                                    onUpdateDueDate={updateDueDate}
                                    onAddComment={addComment}
                                    onDeleteTask={deleteTask}
                                />
                             )
                        })}
                    </Accordion>
                )}
            </div>

             {/* Task Creation Dialog */}
             <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Task to {selectedStatus.replace('_', ' ')}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        
                        <div className="grid gap-2">
                            <Label>Under Goal</Label>
                            <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Goal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {goals.map(g => (
                                        <SelectItem key={g.id} value={g.id.toString()}>{g.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label>Task Title</Label>
                            <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="grid gap-2">
                                <Label>Assignee</Label>
                                <Select value={taskAssigneeId} onValueChange={setTaskAssigneeId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Priority</Label>
                                <Select value={taskPriority} onValueChange={setTaskPriority}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                         <div className="grid gap-2">
                            <Label>Due Date</Label>
                            <Input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateTask} disabled={!selectedGoalId || !taskTitle || !taskDueDate }>Create Task</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
