import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { 
    Home, 
    Users, 
    Calendar, 
    ListTodo, 
    FileText, 
    User, 
    LogOut,
    Kanban
} from 'lucide-react';

export function Sidebar({ className }: { className?: string }) {
    const location = useLocation();
    const { logout, user } = useAuthStore();

    const links = [
        { href: '/manager', label: 'Home', icon: Home, roles: ['MANAGER'] },
        { href: '/admin', label: 'Home', icon: Home, roles: ['ADMIN'] },
        { href: '/employee', label: 'Home', icon: Home, roles: ['EMPLOYEE'] },
        { href: '/board', label: 'Board', icon: Kanban, roles: ['EMPLOYEE'] }, // New Board Link
        { href: '/teams', label: 'Teams', icon: Users, roles: ['MANAGER', 'ADMIN'] }, // Placeholder
        { href: '/timesheet', label: 'Timesheet', icon: Calendar, roles: ['MANAGER', 'EMPLOYEE'] },
        { href: '/tasks', label: 'Tasks', icon: ListTodo, roles: ['MANAGER'] },
        { href: '/employee-reports', label: 'Report', icon: FileText, roles: ['EMPLOYEE'] }, // Employee Reports
        // Profile moved to footer
    ];

    const filteredLinks = links.filter(link => link.roles.includes(user?.role || ''));

    return (
        <div className={cn("flex flex-col h-full w-64 bg-background border-r", className)}>
            <div className="p-6 border-b flex justify-center">
                <img src="/logo.png" alt="KAN Jabung" className="h-16 object-contain" />
            </div>
            
            <nav className="flex-1 px-4 space-y-2 py-4">
                {filteredLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.href;
                    return (
                        <Link key={link.href} to={link.href}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn("w-full justify-start gap-3", isActive && "bg-secondary")}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="truncate">{link.label}</span>
                            </Button>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t mt-auto">
                 <Link to="/profile" className="block">
                     <div className="flex items-center gap-3 mb-4 px-2 py-2 rounded-md hover:bg-accent cursor-pointer transition-colors">
                        <div className="bg-primary/10 p-2 rounded-full shrink-0">
                            <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-sm overflow-hidden">
                            <p className="font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            <p className="text-xs text-primary font-bold">{user?.role}</p>
                        </div>
                    </div>
                </Link>
                <Button variant="outline" className="w-full gap-2" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
