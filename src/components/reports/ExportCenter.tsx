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
import { Download, FileText, Users, User, FormInput, Calendar } from "lucide-react";
import { exportToCSV, createSimplifiedFormExport, flattenClientData, createPivotTableExport } from "@/lib/exportUtils";

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
  const [selectedClient, setSelectedClient] = useState<string>("");
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

  // Export all form submissions
  const exportAllFormSubmissions = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const formIds = forms.map(f => f.id);
      if (formIds.length === 0) {
        toast({
          title: "No Data",
          description: "No forms found to export.",
          variant: "destructive",
        });
        return;
      }

      const { data: submissions, error } = await supabase
        .from('form_submissions')
        .select(`
          *,
          forms!inner(title, fields_schema),
          clients(name),
          users!form_submissions_submitted_by_fkey(first_name, last_name, email)
        `)
        .in('form_id', formIds)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        toast({
          title: "No Data",
          description: "No submissions found to export in the selected time range.",
          variant: "destructive",
        });
        return;
      }

      const exportData = submissions.map((submission: any) => {
        return createSimplifiedFormExport(submission, submission.forms?.fields_schema);
      });

      const filename = `all_form_submissions_${new Date().toISOString().split('T')[0]}`;
      exportToCSV(exportData, filename);

      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} form submissions to CSV.`,
      });

    } catch (error) {
      console.error('Error exporting form submissions:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export form submissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Export all clients
  const exportAllClients = async () => {
    setLoading(true);
    try {
      const { data: clientsData, error } = await supabase
        .from('clients')
        .select(`
          *,
          users!clients_created_by_fkey(first_name, last_name, email)
        `)
        .eq('business_id', businessId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!clientsData || clientsData.length === 0) {
        toast({
          title: "No Data",
          description: "No active clients found to export.",
          variant: "destructive",
        });
        return;
      }

      const exportData = clientsData.map((client: any) => {
        const flattened = flattenClientData(client);
        flattened.created_by_name = client.users 
          ? `${client.users.first_name || ''} ${client.users.last_name || ''}`.trim()
          : 'Unknown User';
        flattened.created_by_email = client.users?.email || '';
        delete flattened.users;
        return flattened;
      });

      const filename = `all_patients_${new Date().toISOString().split('T')[0]}`;
      exportToCSV(exportData, filename);

      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} patients to CSV.`,
      });

    } catch (error) {
      console.error('Error exporting clients:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export patients. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Export specific form submissions
  const exportFormSubmissions = async () => {
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
      
      const { data: submissions, error } = await supabase
        .from('form_submissions')
        .select(`
          *,
          forms!inner(title, fields_schema),
          clients(name),
          users!form_submissions_submitted_by_fkey(first_name, last_name, email)
        `)
        .eq('form_id', selectedForm)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        toast({
          title: "No Data",
          description: `No submissions found for "${form?.title}".`,
          variant: "destructive",
        });
        return;
      }

      const exportData = submissions.map((submission: any) => {
        return createSimplifiedFormExport(submission, submission.forms?.fields_schema);
      });

      const filename = `form_${form?.title.replace(/[^a-z0-9]/gi, '_')}_submissions_${new Date().toISOString().split('T')[0]}`;
      exportToCSV(exportData, filename);

      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} submissions for "${form?.title}".`,
      });

    } catch (error) {
      console.error('Error exporting form submissions:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export form submissions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Export specific client submissions
  const exportClientSubmissions = async () => {
    if (!selectedClient) {
      toast({
        title: "No Patient Selected",
        description: "Please select a patient to export.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const client = clients.find(c => c.id === selectedClient);
      
      // Get detailed client info
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', selectedClient)
        .single();

      if (clientError) throw clientError;

      const { data: submissions, error } = await supabase
        .from('form_submissions')
        .select(`
          *,
          forms!inner(title, fields_schema),
          users!form_submissions_submitted_by_fkey(first_name, last_name, email)
        `)
        .eq('client_id', selectedClient)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        toast({
          title: "No Data",
          description: `No form submissions found for ${client?.name}.`,
          variant: "destructive",
        });
        return;
      }

      const exportData = submissions.map((submission: any) => {
        const exportRow = createSimplifiedFormExport(submission, submission.forms?.fields_schema);
        // Override client name for consistency 
        exportRow['Client Name'] = client?.name || 'Unknown Client';
        return exportRow;
      });

      const filename = `patient_${client?.name.replace(/[^a-z0-9]/gi, '_')}_forms_${new Date().toISOString().split('T')[0]}`;
      exportToCSV(exportData, filename);

      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} form submissions for ${client?.name}.`,
      });

    } catch (error) {
      console.error('Error exporting client submissions:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export patient forms. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      if (selectedPivotClient) {
        query = query.eq('client_id', selectedPivotClient);
      }

      const { data: submissions, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      if (!submissions || submissions.length === 0) {
        const clientFilter = selectedPivotClient 
          ? ` for the selected patient`
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

      const clientSuffix = selectedPivotClient 
        ? `_${clients.find(c => c.id === selectedPivotClient)?.name.replace(/[^a-z0-9]/gi, '_')}`
        : '';
      const filename = `pivot_${form?.title.replace(/[^a-z0-9]/gi, '_')}_${startDate}_to_${endDate}${clientSuffix}`;
      exportToCSV(pivotData, filename);

      const clientInfo = selectedPivotClient 
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
            Export data from your healthcare forms platform in various formats.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Bulk Exports */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Bulk Exports</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    All Form Submissions
                  </CardTitle>
                  <CardDescription>
                    Export all form submissions from the last {timeRange} days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={exportAllFormSubmissions} 
                    disabled={loading}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Submissions
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    All Patients
                  </CardTitle>
                  <CardDescription>
                    Export all active patient records and information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={exportAllClients} 
                    disabled={loading}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export All Patients
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Individual Exports */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Individual Exports</h3>
            <div className="grid gap-4 md:grid-cols-2">
              
              {/* Single Form Export */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FormInput className="h-4 w-4" />
                    Single Form → All Submissions
                  </CardTitle>
                  <CardDescription>
                    Export all patient submissions for a specific form
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedForm} onValueChange={setSelectedForm}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a form" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Button 
                    onClick={exportFormSubmissions} 
                    disabled={loading || !selectedForm}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Form Submissions
                  </Button>
                </CardContent>
              </Card>

              {/* Single Client Export */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Single Patient → All Forms
                  </CardTitle>
                  <CardDescription>
                    Export all form submissions for a specific patient
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Button 
                    onClick={exportClientSubmissions} 
                    disabled={loading || !selectedClient}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Patient Forms
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Date-Based Pivot Export */}
          {(userRole === 'owner' || userRole === 'manager') && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Date-Based Pivot Export</h3>
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
                      <Label htmlFor="client-select">Filter by Patient (Optional)</Label>
                      <Select value={selectedPivotClient} onValueChange={setSelectedPivotClient}>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="All patients" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="">All patients</SelectItem>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}