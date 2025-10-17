import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useCanAddUser } from "@/hooks/use-subscription-limits";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Copy, Trash2, Shield, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TeamMember {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface InviteCode {
  id: string;
  code: string;
  email: string | null;
  role: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

interface TeamManagementProps {
  businessId: string;
  userRole: string;
}

export default function TeamManagement({ businessId, userRole }: TeamManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'staff' as 'staff' | 'manager' | 'owner'
  });
  const { data: canAddStaff } = useCanAddUser("staff");
  const { data: canAddManager } = useCanAddUser("manager");
  const [currentTier, setCurrentTier] = useState("free");

  useEffect(() => {
    const fetchTier = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("users")
        .select("business:businesses(subscription_tier)")
        .eq("id", user.id)
        .single();
      
      if (data?.business) {
        setCurrentTier((data.business as any).subscription_tier);
      }
    };
    fetchTier();
  }, [user]);

  const canManageTeam = userRole === 'owner' || userRole === 'manager';

  useEffect(() => {
    fetchTeamData();
  }, [businessId]);

  const fetchTeamData = async () => {
    setLoading(true);
    try {
      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (membersError) throw membersError;
      setTeamMembers(members || []);

      // Fetch active invite codes if user can manage team
      if (canManageTeam) {
        const { data: codes, error: codesError } = await supabase
          .from('invite_codes')
          .select('*')
          .eq('business_id', businessId)
          .is('used_at', null)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false });

        if (codesError) throw codesError;
        setInviteCodes(codes || []);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Error",
        description: "Failed to load team data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageTeam || !user) return;

    // Check limits before generating invite
    if (inviteData.role === "staff" && !canAddStaff) {
      toast({
        title: "Limit Reached",
        description: "You've reached your plan's staff limit. Please upgrade to add more staff.",
        variant: "destructive",
      });
      return;
    }
    
    if (inviteData.role === "manager" && !canAddManager) {
      toast({
        title: "Limit Reached",
        description: "You've reached your plan's manager limit. Please upgrade to add more managers.",
        variant: "destructive",
      });
      return;
    }

    try {
      const code = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const { error } = await supabase
        .from('invite_codes')
        .insert({
          business_id: businessId,
          code,
          email: inviteData.email || null,
          role: inviteData.role,
          expires_at: expiresAt.toISOString(),
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invite code generated successfully!",
      });

      setInviteOpen(false);
      setInviteData({ email: '', role: 'staff' });
      fetchTeamData();
    } catch (error) {
      console.error('Error generating invite:', error);
      toast({
        title: "Error",
        description: "Failed to generate invite code.",
        variant: "destructive",
      });
    }
  };

  const copyInviteLink = (code: string) => {
    const inviteUrl = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Copied",
      description: "Invite link copied to clipboard!",
    });
  };

  const deleteInviteCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from('invite_codes')
        .delete()
        .eq('id', codeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invite code deleted.",
      });

      fetchTeamData();
    } catch (error) {
      console.error('Error deleting invite:', error);
      toast({
        title: "Error",
        description: "Failed to delete invite code.",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3" />;
      case 'manager':
        return <Shield className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'manager':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members ({teamMembers.length})
            </CardTitle>
            <CardDescription>
              Manage your organization's team members and their roles.
            </CardDescription>
          </div>
          {canManageTeam && (
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Generate an invite code for a new team member.
                  </DialogDescription>
                </DialogHeader>
                
                {!canAddStaff && inviteData.role === "staff" && (
                  <div className="mb-4">
                    <UpgradePrompt limitType="staff" currentTier={currentTier} />
                  </div>
                )}
                
                {!canAddManager && inviteData.role === "manager" && (
                  <div className="mb-4">
                    <UpgradePrompt limitType="managers" currentTier={currentTier} />
                  </div>
                )}
                
                <form onSubmit={generateInviteCode} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email (optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteData.email}
                      onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="colleague@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={inviteData.role}
                      onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        {userRole === 'owner' && <SelectItem value="owner">Owner</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full">
                    Generate Invite Code
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {member.first_name?.[0]}{member.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {member.first_name} {member.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
                <Badge className={getRoleIcon ? `${getRoleColor(member.role)} border` : ''}>
                  {getRoleIcon(member.role)}
                  <span className="ml-1 capitalize">{member.role}</span>
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Invites */}
      {canManageTeam && inviteCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Invites ({inviteCodes.length})</CardTitle>
            <CardDescription>
              Manage pending invitations to your organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inviteCodes.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {invite.email || 'General Invite'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="capitalize">
                        {invite.role}
                      </Badge>
                      <span>Expires {new Date(invite.expires_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyInviteLink(invite.code)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Link
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Invite</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this invite? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteInviteCode(invite.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}