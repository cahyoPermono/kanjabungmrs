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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Menu Division</h1>
                <Button onClick={() => { setIsEditing(false); setCurrentDivision({}); setIsDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Division
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Divisi</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Users Count</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">Loading...</TableCell>
                                </TableRow>
                            ) : divisions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">No divisions found.</TableCell>
                                </TableRow>
                            ) : (
                                divisions.map((division) => (
                                    <TableRow key={division.id}>
                                        <TableCell className="font-medium">{division.name}</TableCell>
                                        <TableCell>{division._count?.users || 0}</TableCell>
                                        <TableCell>
                                            <Badge variant={division.isActive ? 'default' : 'destructive'}>
                                                {division.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(division)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className={division.isActive ? "text-destructive" : "text-green-600"}
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
