import { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Accordion,
} from "@/components/ui/accordion"
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TaskStatusGroup } from '@/components/task/TaskStatusGroup';
import { useTaskOperations } from '@/hooks/useTaskOperations';
import { User, Task } from '@/components/task/TaskActions';

interface Goal {
    id: number;
    code: string;
    title: string;
    description: string;
    tasks: Task[];
    creator: User;
}

// ... existing code ...

function CollapsibleGoal({ 
    goal, 
    employees, 
    onAddTask, 
    onUpdateAssignee,
    onUpdatePriority,
    onUpdateStatus,
    onUpdateDueDate,
    onAddComment,
    onDeleteTask,
    onDeleteGoal,
    onEditGoal
}: { 
    goal: Goal, 
    employees: User[],
    onAddTask: (gid: number, status: string) => void,
    onUpdateAssignee: (tid: number, uid: number) => void,
    onUpdatePriority: (tid: number, priority: string) => void,
    onUpdateStatus: (tid: number, status: string) => void,
    onUpdateDueDate: (tid: number, date: string) => void,
    onAddComment: (tid: number, content: string) => void,
    onDeleteTask: (tid: number) => void,
    onDeleteGoal: (gid: number) => void,
    onEditGoal: () => void
}) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="space-y-4">
            <div 
                className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity select-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <h2 className="text-xl font-semibold">
                    {goal.code && <span className="text-muted-foreground font-mono mr-2 text-base">[{goal.code}]</span>}
                    {goal.title}
                </h2>
                <GoalActionsMenu goal={goal} onDelete={onDeleteGoal} onEdit={onEditGoal} />
            </div>

            {isOpen && (
                <Accordion type="multiple" defaultValue={["IN_PROGRESS", "TODO", "COMPLETED"]} className="w-full space-y-4 pl-4">
                    {["IN_PROGRESS", "TODO", "COMPLETED"].map((status) => {
                        const tasks = goal.tasks.filter(t => t.status === status);
                        
                        return (
                           <TaskStatusGroup 
                                key={status}
                                status={status}
                                tasks={tasks}
                                employees={employees}
                                onAddTask={(status) => onAddTask(goal.id, status)}
                                onUpdateAssignee={onUpdateAssignee}
                                onUpdatePriority={onUpdatePriority}
                                onUpdateStatus={onUpdateStatus}
                                onUpdateDueDate={onUpdateDueDate}
                                onAddComment={onAddComment}
                                onDeleteTask={onDeleteTask}
                           />
                        );
                    })}
                </Accordion>
            )}
            <div className="h-px bg-border my-8" />
        </div>
    );
}

function GoalActionsMenu({ goal, onDelete, onEdit }: { goal: Goal, onDelete: (gid: number) => void, onEdit: () => void }) {
    const [open, setOpen] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <div 
                        className="group h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted cursor-pointer transition-colors"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem 
                        className="cursor-pointer"
                        onSelect={() => onEdit()}
                    >
                        Edit Goal
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                        onSelect={() => setShowDeleteDialog(true)}
                    >
                        Delete Goal
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Goal?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the goal
                            <span className="font-medium text-foreground"> "{goal.title}" </span>
                            and <span className="font-bold text-red-600">ALL tasks</span> associated with it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(goal.id);
                                setShowDeleteDialog(false);
                            }}
                        >
                            Delete Goal
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

    export default function ManagerDashboard() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [employees, setEmployees] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // Dialogs
    const [newGoalOpen, setNewGoalOpen] = useState(false);
    const [editGoalOpen, setEditGoalOpen] = useState(false);
    const [newTaskOpen, setNewTaskOpen] = useState(false);
    
    // Selection state for Task Creation
    const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('TODO');
    
    // New Task Form
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [taskPriority, setTaskPriority] = useState('MEDIUM');
    const [taskDueDate, setTaskDueDate] = useState('');
    const [taskAssigneeId, setTaskAssigneeId] = useState<string>('0');

    // New/Edit Goal Form
    const [goalCode, setGoalCode] = useState('');
    const [goalTitle, setGoalTitle] = useState('');
    const [goalDescription, setGoalDescription] = useState('');
    const [editingGoalId, setEditingGoalId] = useState<number | null>(null);

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

    // Use shared operations hook
    // Use shared operations hook
    const { updateAssignee, updatePriority, updateDueDate, updateStatus, addComment, deleteTask } = useTaskOperations(fetchGoals);

    useEffect(() => {
        fetchGoals();
        fetchEmployees();
    }, []);

    const handleCreateGoal = async () => {
        if (!goalTitle || !goalCode) return;
        try {
            await axios.post('http://localhost:3000/api/goals', {
                code: goalCode,
                title: goalTitle,
                description: goalDescription
            });
            setNewGoalOpen(false);
            resetGoalForm();
            fetchGoals();
        } catch (error) {
            console.error(error);
            alert('Failed to create goal. Code might be duplicate.');
        }
    }

    const handleUpdateGoal = async () => {
        if (!editingGoalId || !goalTitle) return;
        try {
            await axios.put(`http://localhost:3000/api/goals/${editingGoalId}`, {
                title: goalTitle,
                description: goalDescription
            });
            setEditGoalOpen(false);
            resetGoalForm();
            fetchGoals();
        } catch (error) {
            console.error(error);
            alert('Failed to update goal.');
        }
    }

    const resetGoalForm = () => {
        setGoalCode('');
        setGoalTitle('');
        setGoalDescription('');
        setEditingGoalId(null);
    }

    const openEditGoal = (goal: Goal) => {
        setEditingGoalId(goal.id);
        setGoalTitle(goal.title);
        setGoalDescription(goal.description);
        // Code is not editable as per request implies (or standard practice for unique IDs), request said "yang bisa di edit hanya nama dan deskripsinya saja"
        setEditGoalOpen(true);
    }

    const handleCreateTask = async () => {
        if (!selectedGoalId || !taskTitle) return;
        try {
            await axios.post('http://localhost:3000/api/tasks', {
                title: taskTitle,
                description: taskDescription,
                priority: taskPriority === 'NO_PRIORITY' ? null : taskPriority,
                dueDate: taskDueDate,
                status: selectedStatus,
                goalId: selectedGoalId,
                assigneeId: (taskAssigneeId && taskAssigneeId !== '0') ? parseInt(taskAssigneeId) : null
            });
            setNewTaskOpen(false);
            resetTaskForm();
            fetchGoals(); 
        } catch (error) {
            console.error(error);
        }
    };
    
    const resetTaskForm = () => {
        setTaskTitle('');
        setTaskDescription('');
        setTaskPriority('MEDIUM');
        setTaskDueDate('');
        setTaskAssigneeId('0');
        // Keep selectedGoalId/Status if adding multiple? No, user might change context.
    }

    const handleDeleteGoal = async (goalId: number) => {
        try {
            await axios.delete(`http://localhost:3000/api/goals/${goalId}`);
            fetchGoals();
        } catch (error) {
           console.error(error);
        }
    }

    const openAddTask = (goalId: number | null, status: string = 'TODO') => {
        setSelectedGoalId(goalId);
        setSelectedStatus(status);
        setNewTaskOpen(true);
    };

    if (loading) return <div className="p-8">Loading...</div>;

    const filteredGoals = goals.filter(goal => 
        goal.title.toLowerCase().includes(search.toLowerCase()) || 
        goal.code?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold tracking-tight">Home</h1>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    <Input 
                        placeholder="Search goals..." 
                        className="w-full md:w-[200px]" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <div className="flex gap-2">
                         <Button variant="outline" className="flex-1 md:flex-none" onClick={() => openAddTask(null)}>+ Add Task</Button>
                         <Button className="flex-1 md:flex-none" onClick={() => { resetGoalForm(); setNewGoalOpen(true); }}>+ New Goal</Button> 
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {filteredGoals.map((goal) => (
                    <CollapsibleGoal 
                        key={goal.id} 
                        goal={goal} 
                        employees={employees}
                        onAddTask={openAddTask}
                        onEditGoal={() => openEditGoal(goal)}
                        onUpdateAssignee={updateAssignee}
                        onUpdatePriority={updatePriority}
                        onUpdateStatus={updateStatus}
                        onUpdateDueDate={updateDueDate}
                        onAddComment={addComment}
                        onDeleteTask={deleteTask}
                        onDeleteGoal={handleDeleteGoal}
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
                            <Label>Goal Code</Label>
                            <Input value={goalCode} onChange={e => setGoalCode(e.target.value)} placeholder="e.g. Q1-2024" />
                        </div>
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

            {/* Edit Goal Dialog */}
             <Dialog open={editGoalOpen} onOpenChange={setEditGoalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Goal</DialogTitle>
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
                        <Button onClick={handleUpdateGoal}>Update Goal</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Task Creation Dialog */}
            <Dialog open={newTaskOpen} onOpenChange={setNewTaskOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedGoalId ? 'Add Task' : 'Add New Task'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                         <div className="grid gap-2">
                            <Label>Goal</Label>
                            <Select 
                                value={selectedGoalId ? selectedGoalId.toString() : ''} 
                                onValueChange={(val) => setSelectedGoalId(parseInt(val))}
                                disabled={!!selectedGoalId && false /* Can change goal if opened globally, maybe? For now disable if opened from specific goal context? Let's allow changing if user wants. But usually context matters. Let's keep it simple. */}
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
                        <div className="grid gap-2">
                            <Label>Assignee</Label>
                            <Select value={taskAssigneeId} onValueChange={setTaskAssigneeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">No Assignee (Unassigned)</SelectItem>
                                    {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id.toString()}>{emp.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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


