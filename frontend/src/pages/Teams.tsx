import { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Accordion,
} from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MoreHorizontal } from 'lucide-react';
import { TaskStatusGroup } from '@/components/task/TaskStatusGroup';
import { useTaskOperations } from '@/hooks/useTaskOperations';
import { Task, User } from '@/components/task/TaskActions';

interface Employee extends User {
    assignedTasks: Task[];
}

export default function Teams() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

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

    useEffect(() => {
        fetchTeamData();
    }, []);

    // Use shared operations hook
    // Note: Teams view might not allow adding tasks directly without a goal context, 
    // but the task table operations (update/delete) are valid.
    const { updateAssignee, updatePriority, updateDueDate, addComment, deleteTask } = useTaskOperations(fetchTeamData);

    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(search.toLowerCase()) || 
        emp.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="p-8">Loading team data...</div>;

    // Flatten all employees to get a list of users for assignment dropdown
    const allEmployeesList: User[] = employees.map(({ id, name, email }) => ({ id, name, email }));

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
                        actions={{ updateAssignee, updatePriority, updateDueDate, addComment, deleteTask }}
                    />
                ))}
                 {filteredEmployees.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        No employees found matching "{search}"
                    </div>
                )}
            </div>
        </div>
    );
}

function EmployeeSection({ 
    employee, 
    allEmployees,
    actions 
}: { 
    employee: Employee, 
    allEmployees: User[],
    actions: any // Passing the hook methods
}) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{employee.name}</h2>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </div>

            <Accordion type="multiple" defaultValue={["IN_PROGRESS", "TODO", "COMPLETED"]} className="w-full space-y-4">
                {["IN_PROGRESS", "TODO", "COMPLETED"].map(status => {
                     const tasks = employee.assignedTasks.filter(t => t.status === status);
                     return (
                        <TaskStatusGroup 
                            key={status}
                            status={status}
                            tasks={tasks}
                            employees={allEmployees} 
                            onUpdateAssignee={actions.updateAssignee}
                            onUpdatePriority={actions.updatePriority}
                            onUpdateDueDate={actions.updateDueDate}
                            onAddComment={actions.addComment}
                            onDeleteTask={actions.deleteTask}
                        />
                     )
                })}
            </Accordion>
        </div>
    );
}
