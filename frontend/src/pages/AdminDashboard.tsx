import { useEffect, useState } from 'react';
import axios from 'axios';

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchGoals();
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [filters, currentPage]); // Refetch on filter or page change

  // Reset page to 1 when filters change (except purely decorative filters if any, but unlikely)
  // Actually, standard practice is to reset to page 1 on filter change properly.
  // We can do this by creating a separate handler for filter changes that also resets page,
  // or verifying filter changes. For simplicity, let's keep it here but note:
  // ideally if filters change, we should setPage(1). 
  // For now let's assume user manually navigates or we add a reset effect.
  useEffect(() => {
      setCurrentPage(1);
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
        
        // Add Pagination Params
        params.append('page', currentPage.toString());
        params.append('limit', limit.toString());

        const res = await axios.get(`/api/tasks?${params.toString()}`);
        
        // Handle new response structure { data: [], meta: {} }
        if (res.data && Array.isArray(res.data.data)) {
            setTasks(res.data.data);
            setTotalPages(res.data.meta.totalPages);
            setTotalTasks(res.data.meta.total);
        } else if (Array.isArray(res.data)) {
             // Fallback for old API just in case backend didn't update hot reload yet
             setTasks(res.data);
             setTotalTasks(res.data.length); 
             // Assumes all data
        } else {
             setTasks([]);
        }
    } catch (error) {
        console.error('Error fetching tasks:', error);
    } finally {
        setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        params.append('format', downloadFormat);

        const response = await axios.get(`/api/reports/download?${params.toString()}`, {
            responseType: 'blob', // Important for file download
        });

        // Create a URL for the blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        
        // Filename
        const ext = downloadFormat === 'excel' ? 'xlsx' : 'pdf';
        const dateStr = format(new Date(), 'yyyy-MM-dd');
        link.setAttribute('download', `Task_Report_${dateStr}.${ext}`);
        
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
        setDownloadOpen(false);
    } catch (error) {
        console.error("Error downloading report", error);
        alert("Failed to download report");
    }
  };

  const handleDeleteClick = (id: number) => {
      setTaskToDelete(id);
      setDeleteOpen(true);
  };

  const confirmDelete = async () => {
      if (!taskToDelete) return;
      try {
          await axios.delete(`/api/tasks/${taskToDelete}`);
          fetchTasks();
          setDeleteOpen(false);
          setTaskToDelete(null);
      } catch (error) {
          console.error("Error deleting task", error);
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
    <div className="space-y-6 container mx-auto max-w-6xl py-8">
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
                  Menampilkan task berdasarkan filter yang dipilih. Total Tasks: {totalTasks}
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
              
              {/* Pagination Controls */}
              <div className="flex items-center justify-end space-x-2 p-4 border-t">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1 || loading}
                  >
                      Previous
                  </Button>
                  <div className="text-sm font-medium">
                      Page {currentPage} of {Math.max(totalPages, 1)}
                  </div>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || loading}
                  >
                      Next
                  </Button>
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
  );

}
