import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TaskFilters, FilterState } from '@/components/task/TaskFilters';
import { format } from 'date-fns';
import { Download, Trash2, FileText, FileSpreadsheet } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string | null;
    createdAt: string;
    updatedAt: string;
    goal: {
        title: string;
        code: string;
    };
    assignee: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface Goal {
    id: number;
    title: string;
    code: string;
}

interface Employee {
    id: number;
    name: string;
}

export default function AdminDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({});
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  // Download Dialog
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'excel' | 'pdf'>('excel');

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchGoals();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchGoals = async () => {
      try {
          const res = await axios.get('/api/goals');
          if (Array.isArray(res.data)) {
            setGoals(res.data);
          } else {
            console.error("Goals response is not an array", res.data);
            setGoals([]);
          }
      } catch (err) {
          console.error("Failed to fetch goals", err);
      }
  };

  const fetchEmployees = async () => {
      try {
        // Need an endpoint for all employees or users. Reusing admin/users but filtering?
        // Or just fetch all users and filter in frontend for now if list is small.
        const res = await axios.get('/api/admin/users');
        if (Array.isArray(res.data)) {
            const emps = res.data.filter((u: any) => u.role !== 'nothing'); 
            setEmployees(emps);
        } else {
            console.error("API response for employees is not an array:", res.data);
            setEmployees([]);
        }
      } catch (err) {
          console.error("Failed to fetch employees", err);
      }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        
        const res = await axios.get(`/api/tasks?${params.toString()}`);
        if (Array.isArray(res.data)) {
            setTasks(res.data);
        } else {
            console.error("API response for tasks is not an array:", res.data);
            setTasks([]);
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
    } finally {
        setLoading(false);
    }
  };

  const handleDownload = () => {
      // Trigger download by opening window with query params
      const params = new URLSearchParams();
      params.append('format', downloadFormat);
      Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
      });

      // Using window.open might be blocked or not pass auth headers if we relied on cookies.
      // Since we rely on Bearer token, we can't just window.open calls to API unless we use cookie auth 
      // OR we fetch blob via axios and download.
      // Since we have axios interceptor with token, BLOB download is better.
      
      downloadFile(params);
      setDownloadOpen(false);
  };

  const downloadFile = async (params: URLSearchParams) => {
      try {
          const response = await axios.get(`/api/reports/download?${params.toString()}`, {
              responseType: 'blob'
          });
          
          const url = window.URL.createObjectURL(new Blob([response.data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `tasks-report.${downloadFormat === 'excel' ? 'xlsx' : 'pdf'}`);
          document.body.appendChild(link);
          link.click();
          link.remove();
      } catch (error) {
          console.error("Download failed", error);
          alert("Failed to download report");
      }
  }

  const handleDeleteClick = (taskId: number) => {
      setTaskToDelete(taskId);
      setDeleteOpen(true);
  };

  const confirmDelete = async () => {
      if (!taskToDelete) return;
      try {
          await axios.delete(`/api/tasks/${taskToDelete}`);
          setTasks(tasks.filter(t => t.id !== taskToDelete));
          setDeleteOpen(false);
          setTaskToDelete(null);
      } catch (error) {
          console.error("Delete failed", error);
          alert("Failed to delete task");
      }
  };

  const getPriorityColor = (priority: string) => {
      switch (priority) {
          case 'URGENT': return 'bg-red-600';
          case 'HIGH': return 'bg-orange-500';
          case 'MEDIUM': return 'bg-blue-500';
          case 'LOW': return 'bg-slate-500';
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
    <Layout>
      <div className="space-y-6">
        {/* Header / Summary */}
        <div className="bg-card p-6 rounded-lg border shadow-sm space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Task Monitoring Dashboard</h1>
            <p className="text-muted-foreground">
                Halaman ini digunakan untuk menampilkan rangkuman dan hasil monitoring task dalam bentuk daftar terstruktur.
            </p>
            <div className="pt-2 text-sm text-muted-foreground grid gap-1">
                <p>• Halaman ini menampilkan: Daftar task lintas goal dan tim, Informasi Assignee, Due Date, Priority, dan Status.</p>
                <p>• Status progres task (To Do, In Progress, Complete).</p>
                <p>• Fitur ini mendukung proses evaluasi, review kinerja, dan dokumentasi progres kerja secara periodik.</p>
            </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
             <TaskFilters 
                filters={filters} 
                setFilters={setFilters} 
                employees={employees}
                goals={goals}
                showAssignee={true}
                className="w-full md:w-auto"
            />
            
            <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" /> Download Report
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Download Task Report</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Label>Select Format</Label>
                        <Select value={downloadFormat} onValueChange={(v: any) => setDownloadFormat(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="excel">
                                    <div className="flex items-center gap-2">
                                        <FileSpreadsheet className="h-4 w-4 text-green-600" /> Excel (.xlsx)
                                    </div>
                                </SelectItem>
                                <SelectItem value="pdf">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-red-600" /> PDF (.pdf)
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Data yang diunduh akan menyesuaikan dengan filter yang sedang aktif.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDownloadOpen(false)}>Cancel</Button>
                        <Button onClick={handleDownload}>Download</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>

        {/* Tasks Table */}
        <Card>
            <CardHeader className="p-4">
                <CardTitle className="text-lg">Task List</CardTitle>
                <CardDescription>
                    Menampilkan task berdasarkan filter yang dipilih.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="border-t">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[300px]">Task / Goal</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Due Date</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">Loading tasks...</TableCell>
                                </TableRow>
                            ) : tasks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No tasks found matching your filters.</TableCell>
                                </TableRow>
                            ) : (
                                tasks.map((task) => (
                                    <TableRow key={task.id}>
                                        <TableCell>
                                            <div className="font-medium">{task.title}</div>
                                            <div className="text-xs text-muted-foreground">Goal: {task.goal?.code} - {task.goal?.title}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">{task.assignee?.name || 'Unassigned'}</div>
                                            <div className="text-xs text-muted-foreground">{task.assignee?.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${getPriorityColor(task.priority)} text-white border-0`}>{task.priority}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`${getStatusColor(task.status)} text-white border-0`}>
                                                {task.status.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy') : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                                onClick={() => handleDeleteClick(task.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete this task? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDelete}>
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

      </div>
    </Layout>
  );
}
