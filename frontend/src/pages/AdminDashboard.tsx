import { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Layout from '@/components/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Division {
    id: number;
    name: string;
    _count: { users: number };
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    divisionId: number | null;
    division?: { name: string };
}

const userSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6), // Optional for update in real app, but simplified here
    role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']),
    divisionId: z.string().optional() // received as string from Select
});

export default function AdminDashboard() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [openUserDialog, setOpenUserDialog] = useState(false);

  const fetchDivisions = async () => {
    const res = await axios.get('http://localhost:3000/api/admin/divisions');
    setDivisions(res.data);
  };

  const fetchUsers = async () => {
    const res = await axios.get('http://localhost:3000/api/admin/users');
    setUsers(res.data);
  };

  useEffect(() => {
    fetchDivisions();
    fetchUsers();
  }, []);

  const form = useForm<z.infer<typeof userSchema>>({
      resolver: zodResolver(userSchema),
      defaultValues: {
          name: '',
          email: '',
          password: 'password123', // Default for now
          role: 'EMPLOYEE',
      }
  });

  const onSubmitUser = async (values: z.infer<typeof userSchema>) => {
      try {
          await axios.post('http://localhost:3000/api/admin/users', {
              ...values,
              divisionId: values.divisionId ? Number(values.divisionId) : null
          });
          setOpenUserDialog(false);
          form.reset();
          fetchUsers();
          fetchDivisions(); // count updates
      } catch (error) {
          console.error(error);
          alert('Failed to create user');
      }
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Divisions Section */}
        <div className="space-y-4">
            <h2 className="text-2xl font-bold">Divisions</h2>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Employees</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {divisions.map((div) => (
                            <TableRow key={div.id}>
                                <TableCell>{div.id}</TableCell>
                                <TableCell>{div.name}</TableCell>
                                <TableCell>{div._count.users}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>

        {/* Users Section */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Users</h2>
                <Dialog open={openUserDialog} onOpenChange={setOpenUserDialog}>
                    <DialogTrigger asChild>
                        <Button>Add User</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmitUser)} className="space-y-4">
                                <FormField control={form.control} name="name" render={({field}) => (
                                    <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>
                                )}/>
                                <FormField control={form.control} name="email" render={({field}) => (
                                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field}/></FormControl><FormMessage/></FormItem>
                                )}/>
                                <FormField control={form.control} name="role" render={({field}) => (
                                    <FormItem><FormLabel>Role</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select role"/></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                            <SelectItem value="MANAGER">Manager</SelectItem>
                                            <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/></FormItem>
                                )}/>
                                <FormField control={form.control} name="divisionId" render={({field}) => (
                                    <FormItem><FormLabel>Division</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select division"/></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {divisions.map(d => (
                                                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/></FormItem>
                                )}/>
                                <Button type="submit">Create User</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Division</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell>{u.name}</TableCell>
                                <TableCell>{u.role}</TableCell>
                                <TableCell>{u.division?.name || '-'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
      </div>
    </Layout>
  );
}
