import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Lock, Mail, Building, Briefcase } from 'lucide-react';

export default function Profile() {
    const user = useAuthStore((state) => state.user);
    const [divisionName, setDivisionName] = useState('Checking...');
    
    // Password Form State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    useEffect(() => {
        const fetchDivision = async () => {
            if (user?.divisionId) {
                try {
                    // We don't have a direct "get division by id" exposed easily for all roles without auth check
                    // But we can check if we can get it from the goals or similar, OR 
                    // ideally user object should have division name.
                    // For now, let's try to fetch from a new endpoint or just show ID if name not available?
                    // Actually, let's just show "Division ID: ..." if we can't easily fetch name safely
                    // Or reuse an existing endpoint.
                    // Let's assume for now we just show User's Division ID or fetch if user is Manager.
                    // But since any role can access this, simplest is just to display static info for now.
                    // Improving: Let's fetch division name if possible.
                    
                    // Actually, we can assume division name isn't critical for initial version or 
                    // update authStore to include division name on login if possible.
                    // Current authStore login response includes: id, email, name, role, divisionId.
                    // Let's just show Division ID for now or "N/A"
                    setDivisionName(`Division #${user.divisionId}`);
                } catch (error) {
                    setDivisionName('Unknown');
                }
            } else {
                setDivisionName('N/A (Admin or No Division)');
            }
        };
        fetchDivision();
    }, [user]);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        setLoading(true);
        try {
            await axios.put('http://localhost:3000/api/auth/profile/password', { newPassword });
            setMessage({ type: 'success', text: 'Password updated successfully.' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update password.' });
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div>Please log in.</div>;

    return (
        <div className="p-8 space-y-8 bg-gray-50/50 min-h-screen">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Profile</h1>

            <div className="grid gap-8 md:grid-cols-2">
                {/* User Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Your account details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                                <p className="text-lg font-semibold">{user.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-green-100 rounded-full">
                                <Briefcase className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Role</p>
                                <p className="text-lg font-semibold">{user.role}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <Building className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Division</p>
                                <p className="text-lg font-semibold">{divisionName}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Mail className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Email</p>
                                <p className="text-lg font-semibold">{user.email}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Change Password Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Security</CardTitle>
                        <CardDescription>Update your password</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            {message && (
                                <div className={`p-3 rounded-md text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {message.text}
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input 
                                        id="new-password" 
                                        type="password" 
                                        className="pl-9"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input 
                                        id="confirm-password" 
                                        type="password" 
                                        className="pl-9"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? 'Updating...' : 'Change Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
