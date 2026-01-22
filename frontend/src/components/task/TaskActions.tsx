import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, MessageSquare, Plus, MoreHorizontal, Flag, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Interfaces (Shared)
export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Comment {
    id: number;
    content: string;
    userId: number;
    user: User;
    createdAt: string;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
    id: number;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    assignee: User | null;
    assigneeId: number | null;
    goalId: number;
    comments: Comment[];
    goal?: { title: string }; // Optional for Teams view
}

interface TaskHistory {
    id: number;
    taskId: number;
    userId: number;
    user: { name: string };
    action: string;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
}

const priorityIcons = {
    LOW: <Flag className="h-4 w-4 text-slate-500" />,
    MEDIUM: <Flag className="h-4 w-4 text-yellow-500" />,
    HIGH: <Flag className="h-4 w-4 text-orange-500" />,
    URGENT: <Flag className="h-4 w-4 text-red-600 fill-red-600" />
};


export function DueDatePopover({ task, onUpdate }: { task: Task, onUpdate: (tid: number, date: string) => void }) {
    const [date, setDate] = useState(task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '');
    const [open, setOpen] = useState(false);

    const handleUpdate = () => {
        onUpdate(task.id, date);
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="flex items-center gap-2 text-muted-foreground mt-1 cursor-pointer hover:bg-muted p-1 rounded-md w-fit">
                    <CalendarIcon className="h-4 w-4" />
                    {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '-'}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4">
                <div className="flex gap-2">
                    <Input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)} 
                    />
                    <Button size="sm" onClick={handleUpdate}>Save</Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function AssigneePopover({ task, employees, onUpdate }: { task: Task, employees: User[], onUpdate: (tid: number, uid: number) => void }) {
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
                    <div 
                        className={cn(
                            "flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer text-sm",
                            !task.assignee && "bg-accent"
                        )}
                        onClick={() => handleSelect(0)} // 0 triggers unassigning
                    >
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">-</span>
                        </div>
                        <span>Unassigned</span>
                    </div>
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

export function PriorityPopover({ task, onUpdate }: { task: Task, onUpdate: (tid: number, p: string) => void }) {
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

export function CommentPopover({ task, onAddComment }: { task: Task, onAddComment: (c: string) => void }) {
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

export function StatusPopover({ task, onUpdate }: { task: Task, onUpdate: (tid: number, s: string) => void }) {
    const [open, setOpen] = useState(false);
    
    // Using string matching for colors from elsewhere or simple badges
    const statuses = ['TODO', 'IN_PROGRESS', 'COMPLETED'];

    const handleSelect = (status: string) => {
        onUpdate(task.id, status);
        setOpen(false);
    }

    const statusColors: Record<string, string> = {
        TODO: "bg-slate-500",
        IN_PROGRESS: "bg-blue-500",
        COMPLETED: "bg-green-500"
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
             <PopoverTrigger asChild>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                    <Badge variant="outline" className={`${statusColors[task.status]} text-white border-none mt-1`}>
                        {task.status.replace('_', ' ')}
                    </Badge>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[160px] p-0" align="start">
                <div className="p-1">
                    {statuses.map((s) => (
                         <div 
                            key={s} 
                            className={cn(
                                "flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer text-sm",
                                task.status === s && "bg-accent"
                            )}
                            onClick={() => handleSelect(s)}
                        >
                            <div className={`w-2 h-2 rounded-full ${statusColors[s]}`} />
                            <span className="capitalize">{s.replace('_', ' ').toLowerCase()}</span>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    )
}

export function MoreActionsMenu({ task, onDelete, onEdit }: { task: Task, onDelete: (tid: number) => void, onEdit?: (task: Task) => void }) {
    const [open, setOpen] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);

    return (
        <>
            <DropdownMenu open={open} onOpenChange={setOpen}>
                <DropdownMenuTrigger asChild>
                    <div className="group h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted cursor-pointer transition-colors">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                    {onEdit && (
                        <DropdownMenuItem 
                            className="cursor-pointer"
                            onSelect={() => onEdit(task)}
                        >
                            <Pencil className="mr-2 h-4 w-4" /> 
                            <span>Edit Task</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                        className="cursor-pointer"
                        onSelect={() => setShowHistoryDialog(true)}
                    >
                        <Clock className="mr-2 h-4 w-4" />
                        <span>History</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                        onSelect={() => setShowDeleteDialog(true)}
                    >
                        Delete Task
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <TaskHistoryDialog task={task} open={showHistoryDialog} onOpenChange={setShowHistoryDialog} />

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the task
                            <span className="font-medium text-foreground"> "{task.title}" </span>
                            and remove it from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => {
                                onDelete(task.id);
                                setShowDeleteDialog(false);
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export function TaskHistoryDialog({ task, open, onOpenChange }: { task: Task, open: boolean, onOpenChange: (open: boolean) => void }) {
    const [history, setHistory] = useState<TaskHistory[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            setLoading(true);
            axios.get(`http://localhost:3000/api/tasks/${task.id}/history`)
                .then(res => setHistory(res.data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [open, task.id]);

    const formatAction = (action: string) => {
        switch(action) {
            case 'UPDATED_STATUS': return 'changed status';
            case 'UPDATED_PRIORITY': return 'changed priority';
            case 'UPDATED_DUE_DATE': return 'changed due date';
            case 'UPDATED_ASSIGNEE': return 'updated assignee';
            default: return action.toLowerCase().replace('_', ' ');
        }
    }

    const formatValue = (val: string | null, action: string) => {
        if (!val) return 'none';
        if (action === 'UPDATED_DUE_DATE') return format(new Date(val), 'MMM d, yyyy');
        return val;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        Task History
                    </DialogTitle>
                </DialogHeader>
                
                <div className="py-4">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading history...</div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">No history available for this task.</div>
                    ) : (
                        <div className="relative border-l border-muted ml-4 space-y-6">
                            {history.map((item) => (
                                <div key={item.id} className="relative pl-6">
                                    <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-4 ring-background" />
                                    <div className="flex flex-col gap-1">
                                        <div className="text-sm">
                                            <span className="font-semibold text-primary">{item.user.name}</span>
                                            <span className="text-muted-foreground"> {formatAction(item.action)}</span>
                                        </div>
                                        {item.action.startsWith('UPDATED') ? (
                                            <div className="text-xs bg-muted/50 p-2 rounded-md flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-muted-foreground bg-background font-normal line-through opacity-70">
                                                    {formatValue(item.oldValue, item.action)}
                                                </Badge>
                                                <span className="text-muted-foreground">→</span>
                                                <Badge variant="outline" className="bg-background font-medium">
                                                    {formatValue(item.newValue, item.action)}
                                                </Badge>
                                            </div>
                                        ) : (
                                            <div className="text-xs text-muted-foreground italic">
                                                Tasks {item.action.toLowerCase().replace('_', ' ')}
                                            </div>
                                        )}
                                        <span className="text-[10px] text-muted-foreground mt-1">
                                            {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
