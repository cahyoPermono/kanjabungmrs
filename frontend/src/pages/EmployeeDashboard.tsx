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
import { TaskStatusGroup } from '@/components/task/TaskStatusGroup';
import { useTaskOperations } from '@/hooks/useTaskOperations';
import { Task, User } from '@/components/task/TaskActions';
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


    const fetchData = async () => {
        try {
            const [tasksRes, goalsRes, employeesRes] = await Promise.all([
                axios.get('http://localhost:3000/api/tasks'),
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
    }, []);

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
        // Status might be preserved if useful
    }

    const openAddTask = (status: string = 'TODO') => {
        setSelectedStatus(status);
        setNewTaskOpen(true);
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
                <Button onClick={() => openAddTask('TODO')}>+ Add Task</Button>
            </div>

            <Accordion type="multiple" defaultValue={["IN_PROGRESS", "TODO"]} className="w-full space-y-4">
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
                       />
                    );
                })}
            </Accordion>

            {/* Task Creation Dialog */}
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Task ({selectedStatus})</DialogTitle>
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
                            <Label>Description (Optional)</Label>
                            <Input value={taskDescription} onChange={e => setTaskDescription(e.target.value)} />
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
                        <Button onClick={handleCreateTask}>Create Task</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
