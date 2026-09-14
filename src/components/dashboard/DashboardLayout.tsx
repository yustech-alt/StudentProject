import { ReactNode } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DashboardSidebar } from "./DashboardSidebar";
import { NotificationsPanel } from "./NotificationsPanel";
import { ProfileDropdown } from "./ProfileDropdown";
import type { User } from "@/contexts/AppContext";

interface Notification {
  id: string;
  type: "message" | "milestone" | "assignment" | "review" | "system" | "payment" | "file_upload";
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
}

interface DashboardLayoutProps {
  role: "student" | "expert" | "admin";
  title: string;
  description?: string;
  headerActions?: ReactNode;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  user: User;
  onUpdateProfile: (updates: Partial<User>) => void;
  onLogout: () => void;
  children: ReactNode;
}

export function DashboardLayout({
  role,
  title,
  description,
  headerActions,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  user,
  onUpdateProfile,
  onLogout,
  children,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardSidebar role={role} />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <h1 className="text-base font-semibold text-foreground truncate">{title}</h1>
          <div className="ml-auto flex items-center gap-3">
            {headerActions}
            <NotificationsPanel
              notifications={notifications}
              onMarkAsRead={onMarkAsRead}
              onMarkAllAsRead={onMarkAllAsRead}
              onDelete={onDeleteNotification}
            />
            <ProfileDropdown user={user} onUpdateProfile={onUpdateProfile} onLogout={onLogout} />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {description && <p className="text-muted-foreground mb-6">{description}</p>}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
