import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useState } from 'react';

export function DashboardLayout() {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50/50">
            {/* Desktop Sidebar */}
            <div className="hidden md:block h-full">
                <Sidebar />
            </div>

            {/* Mobile Header & Content */}
            <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center p-4 border-b bg-background">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="mr-4">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64">
                            <Sidebar />
                        </SheetContent>
                    </Sheet>
                    <img src="/logo.png" alt="KAN Jabung" className="h-8 object-contain" />
                </div>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
