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
    LogOut 
} from 'lucide-react';

export function Sidebar() {
    const location = useLocation();
    const { logout, user } = useAuthStore();

    const links = [
        { href: '/manager', label: 'Home', icon: Home, roles: ['MANAGER'] },
        { href: '/admin', label: 'Home', icon: Home, roles: ['ADMIN'] },
        { href: '/employee', label: 'Home', icon: Home, roles: ['EMPLOYEE'] },
        { href: '/teams', label: 'Teams', icon: Users, roles: ['MANAGER', 'ADMIN'] }, // Placeholder
        { href: '/timesheet', label: 'Timesheet', icon: Calendar, roles: ['MANAGER', 'EMPLOYEE'] }, // Placeholder
        { href: '/tasks', label: 'Tasks', icon: ListTodo, roles: ['MANAGER', 'EMPLOYEE'] },
        { href: '/reports', label: 'Report', icon: FileText, roles: ['MANAGER', 'ADMIN'] }, // Placeholder
    ];

    const filteredLinks = links.filter(link => link.roles.includes(user?.role || ''));

    return (
        <div className="flex flex-col h-screen w-64 bg-background border-r">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight text-primary">Kanjabung</h1>
            </div>
            
            <nav className="flex-1 px-4 space-y-2">
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
                                {link.label}
                            </Button>
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t">
                 <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-sm">
                        <p className="font-medium">{user?.name}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                        <p className="text-xs text-primary font-bold">{user?.role}</p>
                    </div>
                </div>
                <Button variant="outline" className="w-full gap-2" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );
}
