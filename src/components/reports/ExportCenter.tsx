import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Download, Calendar } from "lucide-react";
import { exportToCSV, createPivotTableExport } from "@/lib/exportUtils";

interface Form {
  id: string;
  title: string;
  status: string;
  description?: string | null;
}

interface Client {
  id: string;
  name: string;
  medical_record_number?: string | null;
}

interface ExportCenterProps {
  businessId: string;
  userRole: string;
  timeRange: string;
}

export default function ExportCenter({ businessId, userRole, timeRange }: ExportCenterProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [forms, setForms] = useState<Form[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [selectedPivotClient, setSelectedPivotClient] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  useEffect(() => {
    fetchFormsAndClients();
  }, [businessId]);

  const fetchFormsAndClients = async () => {
    try {
      // Fetch forms
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select('id, title, status, description')
        .eq('business_id', businessId)
        .order('title');

      if (formsError) throw formsError;
      setForms(formsData || []);

      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('id, name, medical_record_number')
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('name');

      if (clientsError) throw clientsError;
      setClients(clientsData || []);

    } catch (error) {
      console.error('Error fetching forms and clients:', error);
    }
  };

  // Export pivot table for date range
  const exportPivotTable = async () => {
    if (!selectedForm) {
      toast({
        title: "No Form Selected",
        description: "Please select a form to export.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const form = forms.find(f => f.id === selectedForm);

      // Get form with schema
      const { data: formWithSchema, error: formError } = await supabase
        .from('forms')
        .select('id, title, fields_schema')
        .eq('id', selectedForm)
        .single();

      if (formError) throw formError;

      let query = supabase
        .from('form_submissions')
        .select(`
          *,
          clients(name),
          users!form_submissions_submitted_by_fkey(first_name, last_name, email)
        `)
        .eq('form_id', selectedForm)
        .gte('created_at', `${startDate}T00:00:00.000Z`)
        .lte('created_at', `${endDate}T23:59:59.999Z`);

      // Add client filter if selected
      if (selectedPivotClient && selectedPivotClient !== "all") {
        query = query.eq('client_id', selectedPivotClient);
      }

      const { data: submissions, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        const clientFilter = selectedPivotClient && selectedPivotClient !== "all"
          ? ` for the selected client`
          : '';
        toast({
          title: "No Data",
          description: `No submissions found for "${form?.title}" in the selected date range${clientFilter}.`,
          variant: "destructive",
        });
        return;
      }

      // Add form schema to submissions
      const submissionsWithSchema = submissions.map(submission => ({
        ...submission,
        forms: formWithSchema
      }));

      const pivotData = createPivotTableExport(submissionsWithSchema, startDate, endDate);

      const clientSuffix = selectedPivotClient && selectedPivotClient !== "all"
        ? `_${clients.find(c => c.id === selectedPivotClient)?.name.replace(/[^a-z0-9]/gi, '_')}`
        : '';
      const filename = `pivot_${form?.title.replace(/[^a-z0-9]/gi, '_')}_${startDate}_to_${endDate}${clientSuffix}`;
      exportToCSV(pivotData, filename);

      const clientInfo = selectedPivotClient && selectedPivotClient !== "all"
        ? ` for ${clients.find(c => c.id === selectedPivotClient)?.name}`
        : '';
      toast({
        title: "Export Successful",
        description: `Exported pivot table for "${form?.title}" from ${startDate} to ${endDate}${clientInfo}.`,
      });

    } catch (error) {
      console.error('Error exporting pivot table:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export pivot table. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Center
          </CardTitle>
          <CardDescription>
            Export form data as pivot tables with dates as columns and field labels as rows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Date-Based Pivot Export */}
          {(userRole === 'owner' || userRole === 'manager') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Form Data by Date Range
                </CardTitle>
                <CardDescription>
                  Export form data as a pivot table with dates as columns and field labels as rows
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="form-select">Select Form</Label>
                    <Select value={selectedForm} onValueChange={setSelectedForm}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select a form" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {forms.map((form) => (
                          <SelectItem key={form.id} value={form.id}>
                            <div className="flex items-center gap-2">
                              <span>{form.title}</span>
                              <Badge variant={form.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                                {form.status}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="client-select">Filter by Client (Optional)</Label>
                    <Select value={selectedPivotClient} onValueChange={setSelectedPivotClient}>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="All clients" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        <SelectItem value="all">All clients</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="flex items-center gap-2">
                              <span>{client.name}</span>
                              {client.medical_record_number && (
                                <Badge variant="outline" className="text-xs">
                                  MRN: {client.medical_record_number}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={exportPivotTable} 
                    disabled={loading || !selectedForm || !startDate || !endDate}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Pivot Table
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}