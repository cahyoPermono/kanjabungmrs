import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Power, RefreshCw } from 'lucide-react';


interface Division {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
    divisionId: number | null;
    division?: { name: string };
    isActive: boolean;
    password?: string; // Optional, only for creation/updates
}


export default function Accounts() {
    const [users, setUsers] = useState<User[]>([]);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<User>>({});
    const [isEditing, setIsEditing] = useState(false);

    // Alert Dialog State
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertType, setAlertType] = useState<'deactivate' | 'activate'>('deactivate');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
        fetchDivisions();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/admin/users');
            setUsers(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    const fetchDivisions = async () => {
        try {
            const response = await axios.get('/api/admin/divisions');
            setDivisions(response.data);
        } catch (error) {
            console.error('Error fetching divisions:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentUser.id) {
                await axios.put(`/api/admin/users/${currentUser.id}`, currentUser);
            } else {
                await axios.post('/api/admin/users', currentUser);
            }
            await fetchUsers();
            setIsDialogOpen(false);
            setCurrentUser({});
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error saving user. Please try again.');
        }
    };

    const handleEdit = (user: User) => {
        setCurrentUser({ ...user, password: '' }); // Don't allow editing password directly here ideally, or handle separately
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleToggleStatusClick = (user: User) => {
        setSelectedUser(user);
        setAlertType(user.isActive ? 'deactivate' : 'activate');
        setAlertOpen(true);
    };

    const confirmToggleStatus = async () => {
        if (!selectedUser) return;
        
        try {
            if (alertType === 'deactivate') {
                await axios.delete(`/api/admin/users/${selectedUser.id}`); // Soft delete endpoint
            } else {
                // To activate, we use update endpoint
                await axios.put(`/api/admin/users/${selectedUser.id}`, { ...selectedUser, isActive: true });
            }
            await fetchUsers();
            setAlertOpen(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    };

    return (
        <div className="space-y-6 container mx-auto max-w-6xl py-8">
            {/* Header Section */}
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Pengaturan User</h1>
                <p className="text-muted-foreground w-full md:w-2/3">
                    Kelola pengguna aplikasi dengan mudah. Anda dapat menambahkan user baru, mengubah peran dan divisi, serta menonaktifkan akun.
                </p>
            </div>

            {/* Actions Bar */}
            <div className="flex justify-end">
                 <Button onClick={() => { setIsEditing(false); setCurrentUser({}); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add New User
                </Button>
            </div>

            <Card>
                <CardHeader className="px-6 py-4 border-b">
                    <CardTitle className="text-lg">Daftar Pengguna</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="pl-6 w-[250px]">Name</TableHead>
                                <TableHead className="w-[250px]">Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Division</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading users...</TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users found.</TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-muted/5">
                                        <TableCell className="pl-6 font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                {user.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-normal border-primary/20 text-primary-700 bg-primary/5">
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{user.division?.name || <span className="text-muted-foreground italic">None</span>}</TableCell>
                                        <TableCell>
                                            <Badge variant={user.isActive ? 'default' : 'destructive'} className={user.isActive ? "bg-green-600 hover:bg-green-700" : ""}>
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 space-x-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(user)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className={`h-8 w-8 ${user.isActive ? "text-muted-foreground hover:text-destructive" : "text-green-600 hover:text-green-700"}`}
                                                onClick={() => handleToggleStatusClick(user)}
                                            >
                                                {user.isActive ? <Power className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create/Edit User Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit User' : 'Add New User'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input 
                                id="name" 
                                value={currentUser.name || ''} 
                                onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})} 
                                required 
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                                id="email" 
                                type="email" 
                                value={currentUser.email || ''} 
                                onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})} 
                                required 
                                placeholder="john@example.com"
                            />
                        </div>
                        {!isEditing && (
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input 
                                    id="password" 
                                    type="password" 
                                    value={currentUser.password || ''} 
                                    onChange={(e) => setCurrentUser({...currentUser, password: e.target.value})} 
                                    required={!isEditing} 
                                />
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="role">Role</Label>
                                <Select 
                                    value={currentUser.role} 
                                    onValueChange={(value: 'ADMIN' | 'MANAGER' | 'EMPLOYEE') => setCurrentUser({...currentUser, role: value})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="MANAGER">Manager</SelectItem>
                                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="division">Division</Label>
                                <Select 
                                    value={currentUser.divisionId?.toString()} 
                                    onValueChange={(value) => setCurrentUser({...currentUser, divisionId: value ? parseInt(value) : null})}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select division" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">None</SelectItem>
                                        {divisions.map((div) => (
                                            <SelectItem key={div.id} value={div.id.toString()}>
                                                {div.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Deactivate/Activate Confirm Dialog */}
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {alertType === 'deactivate' ? 'Deactivate User?' : 'Activate User?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertType === 'deactivate' 
                                ? "This user will no longer be able to log in. Their data will be preserved. You can explicitly reactivate them later."
                                : "This user will be allowed to log in again."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmToggleStatus}
                            className={alertType === 'deactivate' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                        >
                            {alertType === 'deactivate' ? 'Deactivate' : 'Activate'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
