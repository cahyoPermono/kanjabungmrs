import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
    assigneeId?: string;
    priority?: string;
    status?: string;
    dueDateStart?: string;
    dueDateEnd?: string;
    createdAtStart?: string;
    createdAtEnd?: string;
    closedAtStart?: string;
    closedAtEnd?: string;
    goalId?: string;
}

interface TaskFiltersProps {
    filters: FilterState;
    setFilters: (filters: FilterState) => void;
    employees?: { id: number; name: string }[];
    goals?: { id: number; title: string, code: string }[];
    showAssignee?: boolean;
    className?: string;
}

export function TaskFilters({ filters, setFilters, employees = [], goals = [], showAssignee = false, className }: TaskFiltersProps) {
    
    const handleChange = (key: keyof FilterState, value: string) => {
        setFilters({ ...filters, [key]: value === "ALL" ? undefined : value });
    };

    const clearFilters = () => {
        setFilters({});
    };

    const activeFilterCount = Object.values(filters).filter(Boolean).length;

    return (
        <div className={cn("flex flex-wrap gap-2 items-end", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 md:w-[600px] p-4" align="start">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Status & Priority */}
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={filters.status || "ALL"} onValueChange={(v) => handleChange("status", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    <SelectItem value="TODO">To Do</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                             <Label>Goal</Label>
                             <Select value={filters.goalId || "ALL"} onValueChange={(v) => handleChange("goalId", v)}>
                                 <SelectTrigger>
                                     <SelectValue placeholder="All Goals" />
                                 </SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="ALL">All Goals</SelectItem>
                                     {Array.isArray(goals) && goals.map((goal) => (
                                         <SelectItem key={goal.id} value={goal.id.toString()}>
                                             {goal.code} - {goal.title}
                                         </SelectItem>
                                     ))}
                                 </SelectContent>
                             </Select>
                         </div>
 
                         <div className="space-y-2">
                             <Label>Priority</Label>
                             <Select value={filters.priority || "ALL"} onValueChange={(v) => handleChange("priority", v)}>
                                 <SelectTrigger>
                                     <SelectValue placeholder="All Priorities" />
                                 </SelectTrigger>
                                 <SelectContent>
                                     <SelectItem value="ALL">All Priorities</SelectItem>
                                     <SelectItem value="LOW">Low</SelectItem>
                                     <SelectItem value="MEDIUM">Medium</SelectItem>
                                     <SelectItem value="HIGH">High</SelectItem>
                                     <SelectItem value="URGENT">Urgent</SelectItem>
                                 </SelectContent>
                             </Select>
                         </div>

                        {/* Assignee - Conditional */}
                        {showAssignee && (
                             <div className="space-y-2 md:col-span-2">
                                <Label>Assignee</Label>
                                <Select value={filters.assigneeId || "ALL"} onValueChange={(v) => handleChange("assigneeId", v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Assignees" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Assignees</SelectItem>
                                        {employees.map((emp) => (
                                            <SelectItem key={emp.id} value={emp.id.toString()}>
                                                {emp.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Date Filters Grouping */}
                        <div className="md:col-span-2 space-y-4 border-t pt-4 mt-2">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Due Date (From)</Label>
                                    <Input 
                                        type="date" 
                                        value={filters.dueDateStart || ''} 
                                        onChange={(e) => handleChange("dueDateStart", e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Due Date (To)</Label>
                                    <Input 
                                        type="date" 
                                        value={filters.dueDateEnd || ''} 
                                        onChange={(e) => handleChange("dueDateEnd", e.target.value)} 
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Created (From)</Label>
                                    <Input 
                                        type="date" 
                                        value={filters.createdAtStart || ''} 
                                        onChange={(e) => handleChange("createdAtStart", e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Created (To)</Label>
                                    <Input 
                                        type="date" 
                                        value={filters.createdAtEnd || ''} 
                                        onChange={(e) => handleChange("createdAtEnd", e.target.value)} 
                                    />
                                </div>
                            </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Closed (From)</Label>
                                    <Input 
                                        type="date" 
                                        value={filters.closedAtStart || ''} 
                                        onChange={(e) => handleChange("closedAtStart", e.target.value)} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Closed (To)</Label>
                                    <Input 
                                        type="date" 
                                        value={filters.closedAtEnd || ''} 
                                        onChange={(e) => handleChange("closedAtEnd", e.target.value)} 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex justify-end pt-2">
                             <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive hover:bg-destructive/10">
                                <X className="h-4 w-4 mr-2" /> Clear Filters
                             </Button>
                        </div>

                    </div>
                </PopoverContent>
            </Popover>
            
            {/* Active Filter Chips (Optional - for visibility) */}
            {activeFilterCount > 0 && (
                <div className="flex gap-2 items-center flex-wrap">
                     <span className="text-xs text-muted-foreground mr-1">Active:</span>
                     {Object.entries(filters).map(([key, value]) => {
                         if (!value) return null;
                         return (
                            <div key={key} className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                <span className="font-medium max-w-[100px] truncate">{value}</span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-3 w-3 ml-1 p-0 rounded-full hover:bg-black/10"
                                    onClick={() => handleChange(key as keyof FilterState, 'ALL')} // 'ALL' triggers removal
                                >
                                    <X className="h-2 w-2" />
                                </Button>
                            </div>
                         )
                     })}
                </div>
            )}
        </div>
    );
}
