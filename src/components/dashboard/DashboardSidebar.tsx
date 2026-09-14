import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  GraduationCap,
  LayoutDashboard,
  FolderPlus,
  Wallet,
  Bell,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

type Role = "student" | "expert" | "admin";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: Record<Role, NavItem[]> = {
  student: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard },
    { to: "/new-project", label: "New Project", icon: FolderPlus },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  expert: [
    { to: "/expert", label: "Dashboard", icon: LayoutDashboard },
    { to: "/expert/earnings", label: "Earnings", icon: Wallet },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/notifications", label: "Notifications", icon: Bell },
  ],
};

const ROLE_BADGE: Record<Role, { label: string; className: string }> = {
  student: { label: "Student", className: "bg-primary/10 text-primary" },
  expert: { label: "Expert", className: "bg-primary/10 text-primary" },
  admin: { label: "Admin", className: "bg-destructive/10 text-destructive" },
};

export function DashboardSidebar({ role }: { role: Role }) {
  const location = useLocation();
  const items = NAV_ITEMS[role];
  const badge = ROLE_BADGE[role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/" className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold text-foreground leading-tight">ProjectSupport</span>
            <span className={`text-[10px] font-medium w-fit px-1.5 rounded ${badge.className}`}>
              {badge.label}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {role === "admin" && (
        <SidebarFooter>
          <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>You can suspend accounts and view all chats/milestones</span>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
