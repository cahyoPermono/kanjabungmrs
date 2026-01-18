import { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ExtendedCalendar } from "@/components/ExtendedCalendar";
import {
    Accordion,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { TaskStatusGroup } from '@/components/task/TaskStatusGroup';
import { useTaskOperations } from '@/hooks/useTaskOperations';
import { Task, User } from '@/components/task/TaskActions';
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

export default function Timesheet() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [tasks, setTasks] = useState<Task[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(false);

    // Add Task Dialog State
    const [newTaskOpen, setNewTaskOpen] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>('TODO');
    
    // Form State
    const [taskTitle, setTaskTitle] = useState('');
    const [taskPriority, setTaskPriority] = useState('MEDIUM');
    const [taskAssigneeId, setTaskAssigneeId] = useState<string>('');
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');

    const fetchTasks = async () => {
        if (!date) return;
        setLoading(true);
        try {
            // Using ISO string date part for filtering
            const dateStr = format(date, 'yyyy-MM-dd');
            const res = await axios.get(`http://localhost:3000/api/tasks?date=${dateStr}`);
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
    const { updateAssignee, updatePriority, updateDueDate, addComment, deleteTask } = useTaskOperations(fetchTasks);

    useEffect(() => {
        fetchTasks();
    }, [date]);

    useEffect(() => {
        fetchEmployees();
        fetchGoals();
    }, []);

    const handleCreateTask = async () => {
        if (!selectedGoalId || !taskTitle || !date) return;
        try {
            await axios.post('http://localhost:3000/api/tasks', {
                title: taskTitle,
                priority: taskPriority,
                dueDate: format(date, 'yyyy-MM-dd'), // Set due date to selected timesheet date
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
            
            fetchTasks(); // Refresh list
        } catch (error) {
            console.error(error);
        }
    };

    const openAddTask = (status: string) => {
        setSelectedStatus(status);
        setNewTaskOpen(true);
    };

    return (
        <div className="flex h-screen bg-gray-50/30">
            {/* Sidebar Calendar */}
            <div className="w-[300px] border-r bg-white p-6 space-y-6 flex-shrink-0">
                <div className="font-semibold text-lg px-2 text-gray-700">Calendar</div>
                <ExtendedCalendar
                    date={date}
                    setDate={setDate}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 p-8 overflow-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                         <div className="bg-primary/10 p-3 rounded-lg">
                            <CalendarIcon className="h-6 w-6 text-primary" />
                         </div>
                         <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            {date ? format(date, 'dd MMMM yyyy') : 'Select a Date'}
                        </h1>
                    </div>
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
                        
                        <div className="grid grid-cols-2 gap-4">
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
                            <div className="p-2 border rounded-md bg-muted/50 text-sm">
                                {date ? format(date, 'PPP') : 'No Date Selected'}
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
