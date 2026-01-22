import {
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { TaskTable } from './TaskTable';
import { Task, User } from './TaskActions';

interface TaskStatusGroupProps {
    status: string;
    tasks: Task[];
    employees: User[];
    onAddTask?: (status: string) => void;
    onUpdateAssignee: (tid: number, uid: number) => void;
    onUpdatePriority: (tid: number, p: string) => void;
    onUpdateStatus: (tid: number, s: string) => void;
    onUpdateDueDate: (tid: number, d: string) => void;
    onAddComment: (tid: number, c: string) => void;
    onDeleteTask: (tid: number) => void;
    onEdit?: (task: Task) => void;
}

const statusColors = {
    TODO: "bg-slate-500",
    IN_PROGRESS: "bg-blue-500",
    COMPLETED: "bg-green-500"
};

export function TaskStatusGroup({ 
    status, 
    tasks, 
    employees, 
    onAddTask,
    onUpdateAssignee,
    onUpdatePriority,
    onUpdateStatus,
    onUpdateDueDate,
    onAddComment,
    onDeleteTask,
    onEdit
}: TaskStatusGroupProps) {
    const count = tasks.length;

    return (
        <AccordionItem value={status} className="border-none">
            <div className="flex items-center gap-4 mb-2">
                <AccordionTrigger className="hover:no-underline py-2">
                     <Badge className={`${statusColors[status as keyof typeof statusColors]} hover:${statusColors[status as keyof typeof statusColors]}`}>
                        {status.replace('_', ' ')}
                     </Badge>
                </AccordionTrigger>
                <span className="text-lg font-medium text-muted-foreground">{count}</span>
                {onAddTask && (
                    <Button variant="secondary" size="sm" className="h-8" onClick={(e) => { e.stopPropagation(); onAddTask(status); }}>
                        <Plus className="h-4 w-4 mr-1" /> Add Task
                    </Button>
                )}
            </div>

            <AccordionContent>
                <TaskTable 
                    tasks={tasks} 
                    employees={employees}
                    onUpdateAssignee={onUpdateAssignee}
                    onUpdatePriority={onUpdatePriority}
                    onUpdateStatus={onUpdateStatus}
                    onUpdateDueDate={onUpdateDueDate}
                    onAddComment={onAddComment}
                    onDeleteTask={onDeleteTask}
                    onEdit={onEdit}
                />
            </AccordionContent>
        </AccordionItem>
    );
}
