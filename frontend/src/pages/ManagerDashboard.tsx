import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, MessageSquare, MoreHorizontal, Calendar as CalendarIcon, Flag, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils';

// Interfaces
interface User {
    id: number;
    name: string;
    email: string;
}

interface Comment {
    id: number;
    content: string;
    userId: number;
    user: User;
    createdAt: string;
}

interface Task {
    id: number;
    title: string;
    description: string;
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate: string | null;
    assignee: User | null;
    assigneeId: number | null;
    goalId: number;
    comments: Comment[];
}

interface Goal {
    id: number;
    title: string;
    description: string;
    tasks: Task[];
    creator: User;
}

const statusColors = {
    TODO: "bg-slate-500",
    IN_PROGRESS: "bg-blue-500",
    COMPLETED: "bg-green-500"
};

const priorityIcons = {
    LOW: <Flag className="h-4 w-4 text-slate-500" />,
    MEDIUM: <Flag className="h-4 w-4 text-yellow-500" />,
    HIGH: <Flag className="h-4 w-4 text-red-500" />
};

export default function ManagerDashboard() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Dialogs
    const [newGoalOpen, setNewGoalOpen] = useState(false);
    const [newTaskOpen, setNewTaskOpen] = useState(false);
    
    // Selection state for Task Creation
    const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('TODO');
    
    // New Task Form
    const [taskTitle, setTaskTitle] = useState('');
    const [taskPriority, setTaskPriority] = useState('MEDIUM');
    const [taskDueDate, setTaskDueDate] = useState('');
    const [taskAssigneeId, setTaskAssigneeId] = useState<string>('');

    // New Goal Form
    const [goalTitle, setGoalTitle] = useState('');
    const [goalDescription, setGoalDescription] = useState('');

    const fetchGoals = async () => {
        try {
            const res = await axios.get('http://localhost:3000/api/goals');
            setGoals(res.data);
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

    useEffect(() => {
        fetchGoals();
        fetchEmployees();
    }, []);

    const handleCreateGoal = async () => {
        if (!goalTitle) return;
        try {
            await axios.post('http://localhost:3000/api/goals', {
                title: goalTitle,
                description: goalDescription
            });
            setNewGoalOpen(false);
            setGoalTitle('');
            setGoalDescription('');
            fetchGoals();
        } catch (error) {
            console.error(error);
        }
    }

    const handleCreateTask = async () => {
        if (!selectedGoalId || !taskTitle) return;
        try {
            await axios.post('http://localhost:3000/api/tasks', {
                title: taskTitle,
                priority: taskPriority,
                dueDate: taskDueDate,
                status: selectedStatus,
                goalId: selectedGoalId,
                assigneeId: taskAssigneeId ? parseInt(taskAssigneeId) : null
            });
            setNewTaskOpen(false);
            setTaskTitle('');
            setTaskAssigneeId(''); 
            fetchGoals(); // Refresh
        } catch (error) {
            console.error(error);
        }
    };

    const handleUpdateAssignee = async (taskId: number, assigneeId: number) => {
        try {
            await axios.put(`http://localhost:3000/api/tasks/${taskId}`, {
                assigneeId
            });
            fetchGoals();
        } catch (error) {
             console.error(error);
        }
    }

    const handleUpdatePriority = async (taskId: number, priority: string) => {
        try {
            await axios.put(`http://localhost:3000/api/tasks/${taskId}`, {
                priority
            });
            fetchGoals();
        } catch (error) {
             console.error(error);
        }
    }

    const handleAddComment = async (taskId: number, content: string) => {
        try {
            await axios.post(`http://localhost:3000/api/tasks/${taskId}/comments`, { content });
            fetchGoals();
        } catch (error) {
            console.error(error);
        }
    };

    const openAddTask = (goalId: number, status: string) => {
        setSelectedGoalId(goalId);
        setSelectedStatus(status);
        setNewTaskOpen(true);
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Home</h1>
                <div className="flex gap-4">
                    <Input 
                        placeholder="Search..." 
                        className="w-[200px]" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <Button onClick={() => setNewGoalOpen(true)}>+ New Goal</Button> 
                </div>
            </div>

            <div className="space-y-6">
                {goals.map((goal) => (
                    <CollapsibleGoal 
                        key={goal.id} 
                        goal={goal} 
                        employees={employees}
                        onAddTask={openAddTask}
                        onUpdateAssignee={handleUpdateAssignee}
                        onUpdatePriority={handleUpdatePriority}
                        onAddComment={handleAddComment}
                    />
                ))}
            </div>

            {/* New Goal Dialog */}
            <Dialog open={newGoalOpen} onOpenChange={setNewGoalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Goal</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Description</Label>
                            <Input value={goalDescription} onChange={e => setGoalDescription(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateGoal}>Create Goal</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Task Creation Dialog */}
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Task to {selectedStatus}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
                        </div>
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
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateTask}>Create Task</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function CollapsibleGoal({ 
    goal, 
    employees, 
    onAddTask, 
    onUpdateAssignee,
    onUpdatePriority,
    onAddComment 
}: { 
    goal: Goal, 
    employees: User[],
    onAddTask: (gid: number, status: string) => void,
    onUpdateAssignee: (tid: number, uid: number) => void,
    onUpdatePriority: (tid: number, priority: string) => void,
    onAddComment: (tid: number, content: string) => void
}) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="space-y-4">
            <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <h2 className="text-xl font-semibold">{goal.title}</h2>
                <span className="text-muted-foreground text-sm">...</span>
            </div>

            {isOpen && (
                <Accordion type="multiple" defaultValue={["IN_PROGRESS", "TODO", "COMPLETED"]} className="w-full space-y-4 pl-4">
                    {["IN_PROGRESS", "TODO", "COMPLETED"].map((status) => {
                        const tasks = goal.tasks.filter(t => t.status === status);
                        const count = tasks.length;
                        
                        return (
                            <AccordionItem key={status} value={status} className="border-none">
                                <div className="flex items-center gap-4 mb-2">
                                    <AccordionTrigger className="hover:no-underline py-2">
                                         <Badge className={`${statusColors[status as keyof typeof statusColors]} hover:${statusColors[status as keyof typeof statusColors]}`}>
                                            {status.replace('_', ' ')}
                                         </Badge>
                                    </AccordionTrigger>
                                    <span className="text-lg font-medium text-muted-foreground">{count}</span>
                                    <Button variant="secondary" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); onAddTask(goal.id, status); }}>
                                        <Plus className="h-4 w-4 mr-1" /> Add Task
                                    </Button>
                                </div>

                                <AccordionContent>
                                    <div className="rounded-md border bg-card">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead className="w-[30%]">Name</TableHead>
                                            <TableHead className="w-[20%]">Assignee</TableHead>
                                            <TableHead className="w-[15%]">Due date</TableHead>
                                            <TableHead className="w-[15%]">Priority</TableHead>
                                            <TableHead className="w-[15%]">Status</TableHead>
                                            <TableHead className="w-[5%]">Comments</TableHead>
                                            <TableHead className="w-[5%]"></TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {tasks.map(task => (
                                                <TableRow key={task.id}>
                                                    <TableCell className="font-medium align-top">{task.title}</TableCell>
                                                    <TableCell className="align-top">
                                                        <AssigneePopover task={task} employees={employees} onUpdate={onUpdateAssignee} />
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                                            <CalendarIcon className="h-4 w-4" />
                                                            {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '-'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        <PriorityPopover task={task} onUpdate={onUpdatePriority} />
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        <Badge variant="outline" className={`${statusColors[task.status]} text-white border-none mt-1`}>
                                                            {task.status.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        <CommentPopover task={task} onAddComment={(content) => onAddComment(task.id, content)} />
                                                    </TableCell>
                                                    <TableCell className="align-top">
                                                        <MoreHorizontal className="h-4 w-4 text-muted-foreground mt-1" />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {tasks.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="text-center text-muted-foreground h-24">
                                                        No tasks in this status
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                      </Table>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            )}
            <div className="h-px bg-border my-8" />
        </div>
    );
}

function AssigneePopover({ task, employees, onUpdate }: { task: Task, employees: User[], onUpdate: (tid: number, uid: number) => void }) {
    const [open, setOpen] = useState(false);

    const handleSelect = (uid: number) => {
        onUpdate(task.id, uid);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="cursor-pointer hover:bg-muted rounded-full p-1 inline-flex">
                    {task.assignee ? (
                         <div className="flex items-center gap-2">
                             <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary">{task.assignee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{task.assignee.name}</span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground text-sm italic px-2">Unassigned</span>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="start">
                <div className="p-2 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground px-2 mb-2">Assign to...</p>
                    {employees.map(emp => (
                        <div 
                            key={emp.id} 
                            className={cn(
                                "flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer text-sm",
                                task.assignee?.id === emp.id && "bg-accent"
                            )}
                            onClick={() => handleSelect(emp.id)}
                        >
                             <Avatar className="h-6 w-6">
                                <AvatarFallback>{emp.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{emp.name}</span>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

function PriorityPopover({ task, onUpdate }: { task: Task, onUpdate: (tid: number, p: string) => void }) {
    const [open, setOpen] = useState(false);

    const handleSelect = (priority: string) => {
        onUpdate(task.id, priority);
        setOpen(false);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
             <PopoverTrigger asChild>
                <div className="cursor-pointer hover:bg-muted rounded-md p-1 inline-flex items-center gap-2 h-8">
                    {priorityIcons[task.priority]}
                    <span className="text-sm capitalize">{task.priority.toLowerCase()}</span>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[150px] p-0" align="start">
                <div className="p-1">
                    {Object.keys(priorityIcons).map((p) => (
                         <div 
                            key={p} 
                            className={cn(
                                "flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer text-sm",
                                task.priority === p && "bg-accent"
                            )}
                            onClick={() => handleSelect(p)}
                        >
                            {priorityIcons[p as keyof typeof priorityIcons]}
                            <span className="capitalize">{p.toLowerCase()}</span>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

function CommentPopover({ task, onAddComment }: { task: Task, onAddComment: (c: string) => void }) {
    const [comment, setComment] = useState('');
    const [open, setOpen] = useState(false);

    const handleSubmit = () => {
        if (!comment) return;
        onAddComment(comment);
        setComment('');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="flex items-center gap-1 cursor-pointer hover:bg-muted p-1 rounded-md w-fit transition-colors">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    {task.comments.length > 0 && (
                        <span className="text-xs text-muted-foreground font-medium">{task.comments.length}</span>
                    )}
                    {task.comments.length === 0 && (
                       <Plus className="h-3 w-3 text-muted-foreground" />
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-4">
                    <h4 className="font-medium leading-none">Comments</h4>
                    <div className="max-h-[200px] overflow-y-auto space-y-3">
                        {task.comments.map(c => (
                            <div key={c.id} className="text-sm bg-muted/50 p-2 rounded-md">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-xs text-primary">{c.user.name}</span>
                                    <span className="text-[10px] text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-700">{c.content}</p>
                            </div>
                        ))}
                        {task.comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>}
                    </div>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Add comment..." 
                            value={comment} 
                            onChange={e => setComment(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        />
                        <Button size="icon" onClick={handleSubmit}><Plus className="h-4 w-4" /></Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
