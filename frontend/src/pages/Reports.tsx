import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from 'date-fns';
import { FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface ReportData {
    overview: {
        totalGoals: number;
        totalTasks: number;
        completionRate: number;
    };
    taskDistribution: { name: string; value: number }[];
    employeePerformance: { name: string; completedTasks: number }[];
    overdueTasks: {
        id: number;
        title: string;
        dueDate: string; // ISO
        priority: string;
        assignee: { name: string } | null;
    }[];
}

export default function Reports() {
    const [data, setData] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get('http://localhost:3000/api/reports/dashboard-stats');
                setData(res.data);
            } catch (error) {
                console.error("Error fetching report data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8">Loading reports...</div>;
    if (!data) return <div className="p-8">No data available</div>;

    return (
        <div className="p-4 md:p-8 space-y-8 bg-gray-50/50 min-h-screen">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manager Reports</h1>

            {/* Overview Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Goals</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.overview.totalGoals}</div>
                        <p className="text-xs text-muted-foreground">Active goals in division</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasks Completion</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.overview.completionRate}%</div>
                        <p className="text-xs text-muted-foreground">{data.overview.totalTasks} total tasks</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{data.overdueTasks.length}</div>
                        <p className="text-xs text-muted-foreground">Tasks past due date</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
                {/* Task Status Distribution */}
                <Card className="col-span-1 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Task Status Overview</CardTitle>
                        <CardDescription>Distribution of tasks by current status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <PieChart>
                                    <Pie
                                        data={data.taskDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.taskDistribution.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Employee Performance */}
                <Card className="col-span-1 lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Employee Performance</CardTitle>
                        <CardDescription>Number of tasks completed per employee</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full min-w-0">
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={data.employeePerformance}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="completedTasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Overdue Tasks List */}
            <Card>
                <CardHeader>
                    <CardTitle>Critical Overdue Tasks</CardTitle>
                    <CardDescription>Tasks that require immediate attention (Top 5)</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-4">
                        {data.overdueTasks.length === 0 ? (
                            <div className="text-center text-muted-foreground py-4">No overdue tasks. Good job!</div>
                        ) : (
                            data.overdueTasks.map(task => (
                                <div key={task.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <p className="font-medium leading-none">{task.title}</p>
                                        <div className="flex items-center text-sm text-muted-foreground gap-2">
                                            <span>{task.assignee?.name || 'Unassigned'}</span>
                                            <span>•</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                                task.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 
                                                task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 
                                                'bg-green-100 text-green-700'
                                            }`}>
                                                {task.priority}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                                        <Clock className="h-4 w-4" />
                                        {format(new Date(task.dueDate), 'MMM dd')}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Task Report */}
            <ReportsTaskList />
        </div>
    );
}

// Separate component for the Task List section to keep main component clean
// But for simplicity and to access state easily, I'll inline it or keep it here.
// Actually, let's keep it clean.
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskFilters, FilterState } from '@/components/task/TaskFilters';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function ReportsTaskList() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalTasks, setTotalTasks] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);
    
    // Filters & Download
    const [filters, setFilters] = useState<FilterState>({});
    const [employees, setEmployees] = useState<any[]>([]);
    const [goals, setGoals] = useState<any[]>([]);
    const [downloadOpen, setDownloadOpen] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<'excel' | 'pdf'>('excel');

    // Fetch filters data (Employees & Goals)
    useEffect(() => {
        const fetchFiltersData = async () => {
             try {
                const [empRes, goalRes] = await Promise.all([
                    axios.get('http://localhost:3000/api/goals/employees'),
                    axios.get('http://localhost:3000/api/goals')
                ]);
                setEmployees(empRes.data);
                setGoals(goalRes.data);
            } catch (error) {
                console.error("Error fetching filter options", error);
            }
        };
        fetchFiltersData();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3000/api/tasks', {
                params: {
                    ...filters,
                    page: currentPage,
                    limit
                }
            });
            
            // Handle pagination structure
            const taskData = Array.isArray(res.data) ? res.data : (res.data.data || []);
            setTasks(taskData);
            if (res.data.meta) {
                 setTotalTasks(res.data.meta.total);
                 setTotalPages(res.data.meta.totalPages);
            }
        } catch (error) {
            console.error("Error fetching tasks", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [filters, currentPage]);

    const handleDownload = async () => {
         try {
            const response = await axios.get('http://localhost:3000/api/reports/download', {
                params: { ...filters, format: downloadFormat },
                responseType: 'blob',
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `tasks-report.${downloadFormat === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setDownloadOpen(false);
        } catch (error) {
            console.error('Error downloading report', error);
        }
    };
    
    // Helper colors (duplicated from AdminDashboard/Board - ideally in utils)
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'HIGH': return 'bg-red-500';
            case 'MEDIUM': return 'bg-yellow-500';
            case 'LOW': return 'bg-blue-500';
            default: return 'bg-slate-500';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-600';
            case 'IN_PROGRESS': return 'bg-blue-600';
            case 'TODO': return 'bg-slate-500';
            default: return 'bg-slate-500';
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Detailed Task Report</CardTitle>
                    <CardDescription>View and filter tasks for your division</CardDescription>
                </div>
                <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Download className="h-4 w-4" /> Download
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Download Report</DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <Label>Format</Label>
                            <Select value={downloadFormat} onValueChange={(v: any) => setDownloadFormat(v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                                    <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleDownload}>Download</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <TaskFilters 
                        filters={filters} 
                        setFilters={setFilters} 
                        employees={employees}
                        goals={goals}
                        showAssignee={true} // Manager can see assignees
                    />
                    
                     <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Assignee</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Due Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-4">Loading...</TableCell></TableRow>
                                ) : tasks.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">No tasks found.</TableCell></TableRow>
                                ) : (
                                    tasks.map(task => (
                                        <TableRow key={task.id}>
                                            <TableCell>
                                                <div className="font-medium">{task.title}</div>
                                                <div className="text-xs text-muted-foreground">{task.goal?.title}</div>
                                            </TableCell>
                                            <TableCell>{task.assignee?.name || 'Unassigned'}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${getStatusColor(task.status)} text-white border-0`}>{task.status.replace('_', ' ')}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                 <Badge className={`${getPriorityColor(task.priority)} text-white border-0`}>{task.priority}</Badge>
                                            </TableCell>
                                            <TableCell>{task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy') : '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                     {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1 || loading}
                        >
                            Previous
                        </Button>
                        <div className="text-sm font-medium">Page {currentPage} of {Math.max(totalPages, 1)}</div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || loading}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
