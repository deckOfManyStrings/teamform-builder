import { LayoutDashboard, Users, FileText, Send, UsersRound, BarChart3, Settings, LogOut } from "lucide-react";
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
  const { state, isMobile, openMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const showLabels = isMobile ? openMobile : !collapsed;
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar collapsible="icon" className="bg-sidebar border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border bg-sidebar p-4">
        <div className="flex items-center justify-between">
          {showLabels && <h2 className="text-lg font-semibold text-sidebar-foreground">Trakilfy</h2>}
          <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent" />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    isActive={activeTab === item.value}
                    onClick={() => onTabChange(item.value)}
                    tooltip={item.title}
                    className="hover:bg-sidebar-accent data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    {showLabels && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border bg-sidebar">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={activeTab === "accounts"}
              onClick={() => onTabChange("accounts")}
              tooltip="Account Settings"
              className="hover:bg-sidebar-accent data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground"
            >
              <Settings className="h-4 w-4" />
              {showLabels && <span>Account</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleSignOut} 
              tooltip="Log Out"
              className="hover:bg-sidebar-accent text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
              {showLabels && <span>Log Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
