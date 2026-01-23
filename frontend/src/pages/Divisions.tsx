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
import { Plus, Pencil, Power, RefreshCw } from 'lucide-react';

interface Division {
    id: number;
    name: string;
    isActive: boolean;
    _count?: {
        users: number;
    };
}

export default function Divisions() {
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentDivision, setCurrentDivision] = useState<Partial<Division>>({});
    const [isEditing, setIsEditing] = useState(false);

    // Alert Dialog State
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertType, setAlertType] = useState<'deactivate' | 'activate'>('deactivate');
    const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);

    useEffect(() => {
        fetchDivisions();
    }, []);

    const fetchDivisions = async () => {
        try {
            const response = await axios.get('/api/admin/divisions');
            setDivisions(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching divisions:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentDivision.id) {
                await axios.put(`/api/admin/divisions/${currentDivision.id}`, currentDivision);
            } else {
                await axios.post('/api/admin/divisions', currentDivision);
            }
            await fetchDivisions();
            setIsDialogOpen(false);
            setCurrentDivision({});
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving division:', error);
            alert('Error saving division. Please try again.');
        }
    };

    const handleEdit = (division: Division) => {
        setCurrentDivision(division);
        setIsEditing(true);
        setIsDialogOpen(true);
    };

    const handleToggleStatusClick = (division: Division) => {
        setSelectedDivision(division);
        setAlertType(division.isActive ? 'deactivate' : 'activate');
        setAlertOpen(true);
    };

    const confirmToggleStatus = async () => {
        if (!selectedDivision) return;
        
        try {
            if (alertType === 'deactivate') {
                await axios.delete(`/api/admin/divisions/${selectedDivision.id}`); // Soft delete endpoint
            } else {
                // To activate, we use update endpoint
                await axios.put(`/api/admin/divisions/${selectedDivision.id}`, { ...selectedDivision, isActive: true });
            }
            await fetchDivisions();
            setAlertOpen(false);
            setSelectedDivision(null);
        } catch (error) {
            console.error('Error updating division status:', error);
        }
    };

    return (
        <div className="space-y-6 container mx-auto max-w-6xl py-8">
            {/* Header Section */}
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Pengaturan Divisi</h1>
                <p className="text-muted-foreground w-full md:w-2/3">
                    Kelola unit kerja dan struktur organisasi. Setiap divisi akan memiliki anggota team yang dapat dikelola.
                </p>
            </div>

            {/* Actions Bar */}
            <div className="flex justify-end">
                 <Button onClick={() => { setIsEditing(false); setCurrentDivision({}); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add New Division
                </Button>
            </div>

            <Card>
                <CardHeader className="px-6 py-4 border-b">
                    <CardTitle className="text-lg">Daftar Divisi</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="pl-6 w-[300px]">Name</TableHead>
                                <TableHead>Users Count</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Loading divisions...</TableCell>
                                </TableRow>
                            ) : divisions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No divisions found.</TableCell>
                                </TableRow>
                            ) : (
                                divisions.map((division) => (
                                    <TableRow key={division.id} className="hover:bg-muted/5">
                                        <TableCell className="pl-6 font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {division.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                {division.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal text-muted-foreground">
                                                {division._count?.users || 0} Users
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={division.isActive ? 'default' : 'destructive'} className={division.isActive ? "bg-green-600 hover:bg-green-700" : ""}>
                                                {division.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6 space-x-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(division)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className={`h-8 w-8 ${division.isActive ? "text-muted-foreground hover:text-destructive" : "text-green-600 hover:text-green-700"}`}
                                                onClick={() => handleToggleStatusClick(division)}
                                            >
                                                {division.isActive ? <Power className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create/Edit Division Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Division' : 'Add New Division'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input 
                                id="name" 
                                value={currentDivision.name || ''} 
                                onChange={(e) => setCurrentDivision({...currentDivision, name: e.target.value})} 
                                required 
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Deactivate/Activate Confirm Dialog */}
            <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {alertType === 'deactivate' ? 'Deactivate Division?' : 'Activate Division?'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertType === 'deactivate' 
                                ? "WARNING: Deactivating this division will prevent ALL users within this division from logging in. Are you sure you want to proceed?"
                                : "This division will be active again, and its users can log in (if they are individually active)."}
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
