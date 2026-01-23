import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { format } from "date-fns";
import { Loader2, CheckCircle2, ListTodo, Clock } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Badge } from "../components/ui/badge";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export default function EmployeeReports() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get("http://localhost:3000/api/reports/employee-stats");
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch employee stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!stats) return <div>Failed to load reports.</div>;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Reports</h1>
        <p className="text-muted-foreground">Overview of your performance and task statistics.</p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.totalTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.completedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.pendingTasks}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.overview.completionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Task Distribution Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                    <Pie
                    data={stats.taskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                    {stats.taskDistribution.map((_: any, index: number) => (
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

        {/* Overdue Tasks List */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Overdue Tasks</CardTitle>
             <CardDescription>
              You have {stats.overdueTasks.length} overdue tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                {stats.overdueTasks.length === 0 && <p className="text-sm text-muted-foreground">No overdue tasks.</p>}
                {stats.overdueTasks.map((task: any) => (
                    <div key={task.id} className="flex items-center">
                         <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">{task.title}</p>
                            <p className="text-sm text-muted-foreground">
                                Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                            </p>
                        </div>
                         <div className="ml-auto font-medium">
                            <Badge variant="destructive">Overdue</Badge>
                         </div>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <EmployeeReportsTaskList />
    </div>
  );
}

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TaskFilters, FilterState } from '@/components/task/TaskFilters';
import { Download } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function EmployeeReportsTaskList() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalTasks, setTotalTasks] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);
    
    // Filters & Download
    const [filters, setFilters] = useState<FilterState>({});
    const [goals, setGoals] = useState<any[]>([]);
    const [downloadOpen, setDownloadOpen] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<'excel' | 'pdf'>('excel');

    useEffect(() => {
        const fetchFiltersData = async () => {
             try {
                // Employees only need filtered goals? Or all goals? 
                // Let's fetch all goals for filter dropdown
                const goalRes = await axios.get('http://localhost:3000/api/goals');
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
            link.setAttribute('download', `my-tasks-report.${downloadFormat === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setDownloadOpen(false);
        } catch (error) {
            console.error('Error downloading report', error);
        }
    };
    
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
                    <CardTitle>My Task History</CardTitle>
                    <CardDescription>A complete list of your assigned tasks</CardDescription>
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
                        employees={[]} // No employee filter for employees
                        goals={goals}
                        showAssignee={false} // Hide assignee filter
                    />
                    
                     <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Task</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Due Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-4">Loading...</TableCell></TableRow>
                                ) : tasks.length === 0 ? (
                                    <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No tasks found.</TableCell></TableRow>
                                ) : (
                                    tasks.map(task => (
                                        <TableRow key={task.id}>
                                            <TableCell>
                                                <div className="font-medium">{task.title}</div>
                                                <div className="text-xs text-muted-foreground">{task.goal?.title}</div>
                                            </TableCell>
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
