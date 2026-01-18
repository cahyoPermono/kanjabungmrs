import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Accordion,
} from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Employee extends User {
    assignedTasks: Task[];
}

interface Goal {
    id: number;
    title: string;
}

export default function Teams() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Add Task Dialog State
    const [newTaskOpen, setNewTaskOpen] = useState(false);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('TODO');
    
    // Form State
    const [taskTitle, setTaskTitle] = useState('');
    const [taskPriority, setTaskPriority] = useState('MEDIUM');
    const [taskDueDate, setTaskDueDate] = useState('');
    const [selectedGoalId, setSelectedGoalId] = useState<string>('');


    const fetchTeamData = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/goals/team-overview');
            setEmployees(res.data);
        } catch (error) {
            console.error("Error fetching team data", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGoals = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/goals');
            setGoals(res.data);
        } catch (error) {
            console.error("Error fetching goals", error);
        }
    }

    useEffect(() => {
        fetchTeamData();
        fetchGoals();
    }, []);

    const { updateAssignee, updatePriority, updateDueDate, addComment, deleteTask } = useTaskOperations(fetchTeamData);

    const handleCreateTask = async () => {
        if (!selectedGoalId || !taskTitle || !selectedEmployeeId) return;
        try {
            await axios.post('http://localhost:3000/api/tasks', {
                title: taskTitle,
                priority: taskPriority,
                dueDate: taskDueDate,
                status: selectedStatus,
                goalId: parseInt(selectedGoalId),
                assigneeId: selectedEmployeeId
            });
            setNewTaskOpen(false);
            // Reset form
            setTaskTitle('');
            setSelectedGoalId('');
            setTaskDueDate('');
            setTaskPriority('MEDIUM');
            
            fetchTeamData(); // Refresh list
        } catch (error) {
            console.error(error);
        }
    };

    const openAddTask = (employeeId: number, status: string) => {
        setSelectedEmployeeId(employeeId);
        setSelectedStatus(status);
        setNewTaskOpen(true);
    };

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(search.toLowerCase()) || 
        emp.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-8">Loading team data...</div>;

    const allEmployeesList: User[] = employees.map(({ id, name, email }) => ({ id, name, email }));

    const selectedEmployeeName = employees.find(e => e.id === selectedEmployeeId)?.name;

    return (
        <div className="p-8 space-y-8 bg-gray-50/30 min-h-screen">
             <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Filter" 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 w-[200px] bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {filteredEmployees.map((employee) => (
                    <EmployeeSection 
                        key={employee.id} 
                        employee={employee} 
                        allEmployees={allEmployeesList}
                        onAddTask={openAddTask}
                        actions={{ updateAssignee, updatePriority, updateDueDate, addComment, deleteTask }}
                    />
                ))}
            </div>

            {/* Task Creation Dialog */}
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Task for {selectedEmployeeName}</DialogTitle>
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
                            <div className="grid gap-2">
                                <Label>Due Date</Label>
                                <Input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <div className="p-2 border rounded-md bg-muted/50 text-sm text-muted-foreground capitalize">
                                {selectedStatus.replace('_', ' ').toLowerCase()}
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

function EmployeeSection({ 
    employee, 
    allEmployees,
    onAddTask,
    actions 
}: { 
    employee: Employee, 
    allEmployees: User[],
    onAddTask: (eid: number, status: string) => void,
    actions: any 
}) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="space-y-4">
            <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none group"
                onClick={() => setIsOpen(!isOpen)}
            >
                 {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <h2 className="text-lg font-bold group-hover:underline decoration-muted-foreground/30">{employee.name}</h2>
                <div 
                    className="ml-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {isOpen && (
                <Accordion type="multiple" defaultValue={["IN_PROGRESS", "TODO", "COMPLETED"]} className="w-full space-y-4 pl-4">
                    {["IN_PROGRESS", "TODO", "COMPLETED"].map(status => {
                        const tasks = employee.assignedTasks.filter(t => t.status === status);
                        return (
                            <TaskStatusGroup 
                                key={status}
                                status={status}
                                tasks={tasks}
                                employees={allEmployees}
                                onAddTask={(status) => onAddTask(employee.id, status)}
                                onUpdateAssignee={actions.updateAssignee}
                                onUpdatePriority={actions.updatePriority}
                                onUpdateDueDate={actions.updateDueDate}
                                onAddComment={actions.addComment}
                                onDeleteTask={actions.deleteTask}
                            />
                        )
                    })}
                </Accordion>
            )}
            <div className="h-px bg-border my-6" />
        </div>
    );
}
