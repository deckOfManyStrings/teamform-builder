import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Users, UserPlus, Search, Edit, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ClientForm from "./ClientForm";
import ClientDetail from "./ClientDetail";

interface Client {
  id: string;
  name: string;
  date_of_birth: string | null;
  contact_info: any;
  medical_record_number: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ClientListProps {
  businessId: string;
  userRole: string;
}

export default function ClientList({ businessId, userRole }: ClientListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [addClientOpen, setAddClientOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [viewClient, setViewClient] = useState<Client | null>(null);

  const canManageClients = userRole === 'owner' || userRole === 'manager';

  useEffect(() => {
    fetchClients();
  }, [businessId]);

  useEffect(() => {
    // Filter clients based on search term
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.medical_record_number && client.medical_record_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (client.contact_info?.email && client.contact_info.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredClients(filtered);
  }, [clients, searchTerm]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: "Error",
        description: "Failed to load clients.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientSaved = () => {
    fetchClients();
    setAddClientOpen(false);
    setEditClient(null);
  };

  const deleteClient = async (clientId: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Client archived successfully.",
      });

      fetchClients();
    } catch (error) {
      console.error('Error archiving client:', error);
      toast({
        title: "Error",
        description: "Failed to archive client.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString();
  };

  const getContactDisplay = (contactInfo: any) => {
    if (!contactInfo) return 'No contact info';
    const parts = [];
    if (contactInfo.email) parts.push(contactInfo.email);
    if (contactInfo.phone) parts.push(contactInfo.phone);
    return parts.length > 0 ? parts.join(' • ') : 'No contact info';
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
      <Card>
        <CardHeader className="space-y-4">
          {/* Mobile Layout - Stack elements */}
          <div className="sm:hidden space-y-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clients ({clients.length})
              </CardTitle>
              <CardDescription>
                Manage your organization's client records and information.
              </CardDescription>
            </div>
            <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Enter the client's information below.
                  </DialogDescription>
                </DialogHeader>
                <ClientForm
                  businessId={businessId}
                  onSaved={handleClientSaved}
                  onCancel={() => setAddClientOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Desktop Layout - Side by side */}
          <div className="hidden sm:flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clients ({clients.length})
              </CardTitle>
              <CardDescription>
                Manage your organization's client records and information.
              </CardDescription>
            </div>
            <Dialog open={addClientOpen} onOpenChange={setAddClientOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Enter the client's information below.
                  </DialogDescription>
                </DialogHeader>
                <ClientForm
                  businessId={businessId}
                  onSaved={handleClientSaved}
                  onCancel={() => setAddClientOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name, MRN, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Client List */}
          <div className="space-y-3">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No clients found matching your search.' : 'No clients added yet.'}
              </div>
            ) : (
              filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{client.name}</h3>
                      {client.medical_record_number && (
                        <Badge variant="outline">
                          MRN: {client.medical_record_number}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>DOB: {formatDate(client.date_of_birth)}</p>
                      <p>{getContactDisplay(client.contact_info)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewClient(client)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditClient(client)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    {canManageClients && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Archive Client</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to archive this client? This will hide them from the active client list but preserve their data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteClient(client.id)}>
                              Archive
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Client Dialog */}
      {editClient && (
        <Dialog open={!!editClient} onOpenChange={() => setEditClient(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>
                Update the client's information.
              </DialogDescription>
            </DialogHeader>
            <ClientForm
              businessId={businessId}
              client={editClient}
              onSaved={handleClientSaved}
              onCancel={() => setEditClient(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View Client Dialog */}
      {viewClient && (
        <Dialog open={!!viewClient} onOpenChange={() => setViewClient(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Client Details</DialogTitle>
            </DialogHeader>
              <ClientDetail
                client={viewClient}
                onEdit={() => {
                  setEditClient(viewClient);
                  setViewClient(null);
                }}
                onClose={() => setViewClient(null)}
              />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}