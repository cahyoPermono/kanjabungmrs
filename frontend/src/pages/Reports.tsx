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
                const res = await axios.get('http://localhost:3000/api/reports');
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
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manager Reports</h1>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
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

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Task Status Distribution */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Task Status Overview</CardTitle>
                        <CardDescription>Distribution of tasks by current status</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
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
                    </CardContent>
                </Card>

                {/* Employee Performance */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Employee Performance</CardTitle>
                        <CardDescription>Number of tasks completed per employee</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.employeePerformance}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="completedTasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
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
        </div>
    );
}
