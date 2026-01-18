import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from '@/components/ui/badge';
import { Task, User, AssigneePopover, DueDatePopover, PriorityPopover, CommentPopover, MoreActionsMenu } from './TaskActions';

interface TaskTableProps {
    tasks: Task[];
    employees: User[];
    onUpdateAssignee: (tid: number, uid: number) => void;
    onUpdatePriority: (tid: number, p: string) => void;
    onUpdateDueDate: (tid: number, d: string) => void;
    onAddComment: (tid: number, c: string) => void;
    onDeleteTask: (tid: number) => void;
}

const statusColors = {
    TODO: "bg-slate-500",
    IN_PROGRESS: "bg-blue-500",
    COMPLETED: "bg-green-500"
};

export function TaskTable({ tasks, employees, onUpdateAssignee, onUpdatePriority, onUpdateDueDate, onAddComment, onDeleteTask }: TaskTableProps) {
    return (
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
                            <TableCell className="font-medium align-top">
                                <div>{task.title}</div>
                                {task.goal && <div className="text-xs text-muted-foreground mt-0.5">{task.goal.title}</div>}
                            </TableCell>
                            <TableCell className="align-top">
                                <AssigneePopover task={task} employees={employees} onUpdate={onUpdateAssignee} />
                            </TableCell>
                            <TableCell className="align-top">
                                <DueDatePopover task={task} onUpdate={onUpdateDueDate} />
                            </TableCell>
                            <TableCell className="align-top">
                                <PriorityPopover task={task} onUpdate={onUpdatePriority} />
                            </TableCell>
                            <TableCell className="align-top">
                                <Badge variant="outline" className={`${statusColors[task.status as keyof typeof statusColors]} text-white border-none mt-1`}>
                                    {task.status.replace('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell className="align-top">
                                <CommentPopover task={task} onAddComment={(content) => onAddComment(task.id, content)} />
                            </TableCell>
                            <TableCell className="align-top">
                                <MoreActionsMenu task={task} onDelete={onDeleteTask} />
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
    )
}
