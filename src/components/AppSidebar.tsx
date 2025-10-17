import { LayoutDashboard, Users, FileText, Send, UsersRound, BarChart3, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { title: "Overview", icon: LayoutDashboard, value: "overview" },
  { title: "Clients", icon: Users, value: "clients" },
  { title: "Forms", icon: FileText, value: "forms" },
  { title: "Submissions", icon: Send, value: "submissions" },
  { title: "Team", icon: UsersRound, value: "team" },
  { title: "Reports", icon: BarChart3, value: "reports" },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          {!collapsed && <h2 className="text-lg font-semibold">Trakilfy</h2>}
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    isActive={activeTab === item.value}
                    onClick={() => onTabChange(item.value)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Log Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
