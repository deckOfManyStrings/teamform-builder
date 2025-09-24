import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Save, Send, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'email' | 'phone' | 'number';
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface Form {
  id: string;
  title: string;
  description: string | null;
  fields_schema: any;
}

interface Submission {
  id: string;
  form_id: string;
  client_id: string | null;
  status: string;
  submission_data: any;
  form?: Form;
  client?: { name: string };
}

interface SubmissionFormProps {
  submission: Submission;
  onSaved: () => void;
  onCancel: () => void;
}

export default function SubmissionForm({ submission, onSaved, onCancel }: SubmissionFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [submissionDate, setSubmissionDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchForm();
    if (submission.submission_data) {
      setFormData(submission.submission_data);
    }
  }, [submission]);

  const fetchForm = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', submission.form_id)
        .single();

      if (error) throw error;
      setForm(data);
    } catch (error) {
      console.error('Error fetching form:', error);
      toast({
        title: "Error",
        description: "Failed to load form structure.",
        variant: "destructive",
      });
    }
  };

  const updateFieldValue = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const validateForm = (): boolean => {
    if (!form || !form.fields_schema?.fields) return false;

    const requiredFields = form.fields_schema.fields.filter((field: any) => field.required);
    const missingFields = requiredFields.filter((field: any) => 
      !formData[field.id] || 
      (Array.isArray(formData[field.id]) && formData[field.id].length === 0) ||
      (typeof formData[field.id] === 'string' && formData[field.id].trim() === '')
    );

    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in all required fields: ${missingFields.map((f: any) => f.label).join(', ')}`,
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const saveSubmission = async (status: 'draft' | 'submitted') => {
    if (!user) return;

    if (status === 'submitted' && !validateForm()) {
      return;
    }

    const isSubmitting = status === 'submitted';
    if (isSubmitting) {
      setLoading(true);
    } else {
      setSaveLoading(true);
    }

    try {
      const updateData: any = {
        submission_data: formData,
        status,
      };

      if (status === 'submitted') {
        updateData.submitted_at = submissionDate.toISOString();
      }

      const { error } = await supabase
        .from('form_submissions')
        .update(updateData)
        .eq('id', submission.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: status === 'submitted' 
          ? "Form submitted successfully!" 
          : "Draft saved successfully!",
      });

      onSaved();
    } catch (error) {
      console.error('Error saving submission:', error);
      toast({
        title: "Error",
        description: `Failed to ${status === 'submitted' ? 'submit' : 'save'} form.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setSaveLoading(false);
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id];

    switch (field.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      
      case 'email':
        return (
          <Input
            type="email"
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      
      case 'phone':
        return (
          <Input
            type="tel"
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
          />
        );
      
      case 'select':
        return (
          <Select value={value || ''} onValueChange={(newValue) => updateFieldValue(field.id, newValue)}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={(newValue) => updateFieldValue(field.id, newValue)}>
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}_${index}`} />
                <Label htmlFor={`${field.id}_${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}_${index}`}
                  checked={(value || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = value || [];
                    if (checked) {
                      updateFieldValue(field.id, [...currentValues, option]);
                    } else {
                      updateFieldValue(field.id, currentValues.filter((v: string) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${field.id}_${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateFieldValue(field.id, e.target.value)}
            placeholder={field.placeholder}
          />
        );
    }
  };

  if (!form) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge className="capitalize">{submission.status}</Badge>
          {submission.client && (
            <Badge variant="outline">Client: {submission.client.name}</Badge>
          )}
        </div>
        <h2 className="text-2xl font-bold">{form.title}</h2>
        {form.description && (
          <p className="text-muted-foreground">{form.description}</p>
        )}
      </div>

      {/* Submission Date */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Date</CardTitle>
          <CardDescription>
            Select the date this form should be recorded as submitted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Date of Submission</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !submissionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {submissionDate ? format(submissionDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={submissionDate}
                  onSelect={(date) => date && setSubmissionDate(date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                  captionLayout="dropdown-buttons"
                  fromYear={1900}
                  toYear={2030}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Form Data</CardTitle>
          <CardDescription>
            Fill out the form fields below. Required fields are marked with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {form.fields_schema?.fields?.map((field: any) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                </Label>
                {field.description && (
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                )}
                {renderField(field)}
              </div>
            ))}
            
            {(!form.fields_schema?.fields || form.fields_schema.fields.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No fields configured for this form.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={loading || saveLoading}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => saveSubmission('draft')}
            disabled={loading || saveLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {saveLoading ? "Saving..." : "Save Draft"}
          </Button>
          <Button
            onClick={() => saveSubmission('submitted')}
            disabled={loading || saveLoading || submission.status === 'submitted'}
          >
            <Send className="h-4 w-4 mr-2" />
            {loading ? "Submitting..." : "Submit Form"}
          </Button>
        </div>
      </div>
    </div>
  );
}