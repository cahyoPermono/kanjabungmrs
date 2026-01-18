import { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    goal: { title: string };
    dueDate: string;
}

interface Goal {
    id: number;
    title: string;
}

const taskSchema = z.object({
    title: z.string().min(2),
    description: z.string(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    goalId: z.string(),
    dueDate: z.string().optional()
});

export default function EmployeeDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [openTaskDialog, setOpenTaskDialog] = useState(false);

  const fetchTasks = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/tasks');
        setTasks(res.data);
      } catch (e) {}
  };

  const fetchGoals = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/goals');
        setGoals(res.data);
      } catch (e) {}
  };

  useEffect(() => {
    fetchTasks();
    fetchGoals();
  }, []);

  const form = useForm<z.infer<typeof taskSchema>>({
      resolver: zodResolver(taskSchema),
      defaultValues: {
          title: '',
          description: '',
          priority: 'MEDIUM',
          goalId: '',
          dueDate: ''
      }
  });

  const onSubmitTask = async (values: z.infer<typeof taskSchema>) => {
      try {
          await axios.post('http://localhost:3000/api/tasks', {
              ...values,
              goalId: Number(values.goalId)
          });
          setOpenTaskDialog(false);
          form.reset();
          fetchTasks();
      } catch (error) {
          console.error(error);
          alert('Failed to create task');
      }
  }

  const updateStatus = async (id: number, status: string) => {
      try {
          await axios.put(`http://localhost:3000/api/tasks/${id}`, { status });
          fetchTasks();
      } catch (error) {
          console.error(error);
      }
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">My Tasks</h2>
            <Dialog open={openTaskDialog} onOpenChange={setOpenTaskDialog}>
                <DialogTrigger asChild>
                    <Button>Create Task</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmitTask)} className="space-y-4">
                            <FormField control={form.control} name="title" render={({field}) => (
                                <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>
                            )}/>
                            <FormField control={form.control} name="description" render={({field}) => (
                                <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>
                            )}/>
                            <FormField control={form.control} name="priority" render={({field}) => (
                                <FormItem><FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Priority"/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage/></FormItem>
                            )}/>
                            <FormField control={form.control} name="goalId" render={({field}) => (
                                <FormItem><FormLabel>Link to Goal</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select Goal"/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {goals.map(g => (
                                            <SelectItem key={g.id} value={String(g.id)}>{g.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage/></FormItem>
                            )}/>
                            <Button type="submit">Create Task</Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>

        <div className="space-y-4">
            {tasks.map((task) => (
                <Card key={task.id} className="p-4 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold">{task.title}</h3>
                        <p className="text-sm text-gray-500">{task.description}</p>
                        <div className="flex gap-2 text-xs mt-2 text-gray-400">
                             <span>Goal: {task.goal?.title}</span>
                             <span>Priority: {task.priority}</span>
                             <span>Status: {task.status}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {task.status !== 'DONE' && (
                            <Button size="sm" onClick={() => updateStatus(task.id, 'DONE')}>Mark Done</Button>
                        )}
                        {task.status === 'TODO' && (
                            <Button size="sm" variant="secondary" onClick={() => updateStatus(task.id, 'IN_PROGRESS')}>Start</Button>
                        )}
                    </div>
                </Card>
            ))}
        </div>
      </div>
    </Layout>
  );
}
