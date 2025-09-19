import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, GripVertical, FileText, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  template_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'email' | 'phone' | 'number';
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface Form {
  id: string;
  title: string;
  description: string | null;
  fields_schema: any;
  template_id: string | null;
}

interface FormTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  template_schema: any;
}

interface FormBuilderProps {
  businessId: string;
  templates: FormTemplate[];
  form?: Form;
  onSaved: () => void;
  onCancel: () => void;
}

export default function FormBuilder({ businessId, templates, form, onSaved, onCancel }: FormBuilderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: form?.title || "",
      description: form?.description || "",
      template_id: form?.template_id || "",
    },
  });

  useEffect(() => {
    if (form) {
      // Load existing form fields
      if (form.fields_schema?.fields) {
        setFields(form.fields_schema.fields);
      }
      if (form.template_id) {
        setSelectedTemplate(form.template_id);
      }
    }
  }, [form]);

  const addField = () => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: '',
      placeholder: '',
      required: false,
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    setFields(updatedFields);
  };

  const removeField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    setFields(updatedFields);
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template && template.template_schema?.fields) {
      setFields(template.template_schema.fields);
      setValue('template_id', templateId);
    }
    setSelectedTemplate(templateId);
  };

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    
    if (fields.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one field to the form.",
        variant: "destructive",
      });
      return;
    }

    // Validate that all fields have labels
    const invalidFields = fields.filter(field => !field.label.trim());
    if (invalidFields.length > 0) {
      toast({
        title: "Error",
        description: "All fields must have a label.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const formData = {
        business_id: businessId,
        title: data.title,
        description: data.description || null,
        template_id: data.template_id || null,
        fields_schema: { fields } as any,
        created_by: user.id,
        status: 'draft' as const,
      };

      let error;
      if (form) {
        // Update existing form
        const { error: updateError } = await supabase
          .from('forms')
          .update(formData)
          .eq('id', form.id);
        error = updateError;
      } else {
        // Create new form
        const { error: insertError } = await supabase
          .from('forms')
          .insert(formData);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Form ${form ? 'updated' : 'created'} successfully!`,
      });

      onSaved();
    } catch (error) {
      console.error('Error saving form:', error);
      toast({
        title: "Error",
        description: `Failed to ${form ? 'update' : 'create'} form.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fieldTypeOptions = [
    { value: 'text', label: 'Domain' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
  ];

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      {!form && templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Start with a Template
            </CardTitle>
            <CardDescription>
              Choose a template to get started quickly, or create from scratch.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'
                  }`}
                  onClick={() => loadTemplate(template.id)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-medium">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                    )}
                    {template.category && (
                      <Badge variant="outline" className="mt-2">
                        {template.category}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Basic Information */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Form Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Form Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Enter form title"
              />
              {errors.title && (
                <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Enter form description (optional)"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Fields */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Form Fields</CardTitle>
              <CardDescription>
                Add and configure the fields for your form.
              </CardDescription>
            </div>
            <Button type="button" onClick={addField} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Field
            </Button>
          </CardHeader>
          <CardContent>
            {fields.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No fields added yet. Click "Add Field" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <Card key={field.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <GripVertical className="h-4 w-4 text-muted-foreground mt-2" />
                        <div className="flex-1 space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center gap-1">
                                <Label>Domain Label *</Label>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>This is a label</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                              <Input
                                value={field.label}
                                onChange={(e) => updateField(index, { label: e.target.value })}
                                placeholder="Enter field label"
                              />
                            </div>
                            <div>
                              <Label>Field Type</Label>
                              <Select
                                value={field.type}
                                onValueChange={(value) => updateField(index, { type: value as FormField['type'] })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {fieldTypeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <Label>Description</Label>
                            <Input
                              value={field.description || ''}
                              onChange={(e) => updateField(index, { description: e.target.value })}
                              placeholder="Enter field description (optional)"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Placeholder</Label>
                              <Input
                                value={field.placeholder || ''}
                                onChange={(e) => updateField(index, { placeholder: e.target.value })}
                                placeholder="Enter placeholder text"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-6">
                              <input
                                type="checkbox"
                                id={`required-${index}`}
                                checked={field.required}
                                onChange={(e) => updateField(index, { required: e.target.checked })}
                                className="rounded border-input"
                              />
                              <Label htmlFor={`required-${index}`}>Required field</Label>
                            </div>
                          </div>

                          {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                            <div>
                              <Label>Options (one per line)</Label>
                              <Textarea
                                value={field.options?.join('\n') || ''}
                                onChange={(e) => updateField(index, { 
                                  options: e.target.value.split('\n').filter(opt => opt.trim()) 
                                })}
                                placeholder="Option 1
Option 2
Option 3"
                                rows={3}
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeField(index)}
                          className="mt-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : (form ? "Update Form" : "Create Form")}
          </Button>
        </div>
      </form>
    </div>
  );
}