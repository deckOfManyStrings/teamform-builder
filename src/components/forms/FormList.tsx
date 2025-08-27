import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { FileText, Plus, Search, Edit, Eye, Copy, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import FormBuilder from "./FormBuilder";
import FormPreview from "./FormPreview";

interface Form {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'archived' | 'inactive';
  version: number;
  fields_schema: any;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  template_schema: any;
}

interface FormListProps {
  businessId: string;
  userRole: string;
}

export default function FormList({ businessId, userRole }: FormListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [forms, setForms] = useState<Form[]>([]);
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [filteredForms, setFilteredForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [editForm, setEditForm] = useState<Form | null>(null);
  const [previewForm, setPreviewForm] = useState<Form | null>(null);

  const canManageForms = userRole === 'owner' || userRole === 'manager';

  useEffect(() => {
    Promise.all([fetchForms(), fetchTemplates()]);
  }, [businessId]);

  useEffect(() => {
    // Filter forms based on search term
    const filtered = forms.filter(form =>
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.description && form.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredForms(filtered);
  }, [forms, searchTerm]);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('business_id', businessId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setForms(data || []);
    } catch (error) {
      console.error('Error fetching forms:', error);
      toast({
        title: "Error",
        description: "Failed to load forms.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleFormSaved = () => {
    fetchForms();
    setCreateFormOpen(false);
    setEditForm(null);
  };

  const duplicateForm = async (form: Form) => {
    if (!canManageForms) return;

    try {
      const { error } = await supabase
        .from('forms')
        .insert({
          business_id: businessId,
          title: `${form.title} (Copy)`,
          description: form.description,
          fields_schema: form.fields_schema,
          template_id: form.template_id,
          created_by: user?.id,
          status: 'draft'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Form duplicated successfully!",
      });

      fetchForms();
    } catch (error) {
      console.error('Error duplicating form:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate form.",
        variant: "destructive",
      });
    }
  };

  const updateFormStatus = async (formId: string, status: 'draft' | 'active' | 'archived' | 'inactive') => {
    if (!canManageForms) return;

    try {
      const { error } = await supabase
        .from('forms')
        .update({ status })
        .eq('id', formId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Form ${status === 'active' ? 'published' : status === 'archived' ? 'archived' : 'saved as draft'} successfully!`,
      });

      fetchForms();
    } catch (error) {
      console.error('Error updating form status:', error);
      toast({
        title: "Error",
        description: "Failed to update form status.",
        variant: "destructive",
      });
    }
  };

  const deleteForm = async (formId: string) => {
    if (!canManageForms) return;

    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Form deleted successfully.",
      });

      fetchForms();
    } catch (error) {
      console.error('Error deleting form:', error);
      toast({
        title: "Error",
        description: "Failed to delete form.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Forms ({forms.length})
            </CardTitle>
            <CardDescription>
              Create and manage forms for your healthcare organization.
            </CardDescription>
          </div>
          {canManageForms && (
            <Dialog open={createFormOpen} onOpenChange={setCreateFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Form
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Form</DialogTitle>
                  <DialogDescription>
                    Build a new form from scratch or start with a template.
                  </DialogDescription>
                </DialogHeader>
                <FormBuilder
                  businessId={businessId}
                  templates={templates}
                  onSaved={handleFormSaved}
                  onCancel={() => setCreateFormOpen(false)}
                />
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search forms by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Form List */}
          <div className="space-y-3">
            {filteredForms.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? 'No forms found matching your search.' : 'No forms created yet.'}
              </div>
            ) : (
              filteredForms.map((form) => (
                <div
                  key={form.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{form.title}</h3>
                      <Badge className={`${getStatusColor(form.status)} border capitalize`}>
                        {form.status}
                      </Badge>
                      <Badge variant="outline">
                        v{form.version}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {form.description && <p>{form.description}</p>}
                      <p>Updated: {formatDate(form.updated_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewForm(form)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {canManageForms && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditForm(form)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateForm(form)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {form.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => updateFormStatus(form.id, 'active')}
                          >
                            Publish
                          </Button>
                        )}
                        {form.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateFormStatus(form.id, 'archived')}
                          >
                            Archive
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Form</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this form? This action cannot be undone and will also delete all associated submissions.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteForm(form.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Form Dialog */}
      {editForm && (
        <Dialog open={!!editForm} onOpenChange={() => setEditForm(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Form</DialogTitle>
              <DialogDescription>
                Update the form configuration and fields.
              </DialogDescription>
            </DialogHeader>
            <FormBuilder
              businessId={businessId}
              templates={templates}
              form={editForm}
              onSaved={handleFormSaved}
              onCancel={() => setEditForm(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Preview Form Dialog */}
      {previewForm && (
        <Dialog open={!!previewForm} onOpenChange={() => setPreviewForm(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Form Preview</DialogTitle>
              <DialogDescription>
                Preview how this form will appear to users.
              </DialogDescription>
            </DialogHeader>
            <FormPreview
              form={previewForm}
              onClose={() => setPreviewForm(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}