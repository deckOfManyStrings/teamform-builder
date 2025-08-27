import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'email' | 'phone' | 'number';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface Form {
  id: string;
  title: string;
  description: string | null;
  status: string;
  version: number;
  fields_schema: {
    fields: FormField[];
  };
}

interface FormPreviewProps {
  form: Form;
  onClose: () => void;
}

export default function FormPreview({ form, onClose }: FormPreviewProps) {
  const renderField = (field: FormField) => {
    const baseProps = {
      key: field.id,
      id: field.id,
      placeholder: field.placeholder,
    };

    switch (field.type) {
      case 'text':
        return <Input {...baseProps} type="text" />;
      
      case 'email':
        return <Input {...baseProps} type="email" />;
      
      case 'phone':
        return <Input {...baseProps} type="tel" />;
      
      case 'number':
        return <Input {...baseProps} type="number" />;
      
      case 'date':
        return <Input {...baseProps} type="date" />;
      
      case 'textarea':
        return <Textarea {...baseProps} rows={3} />;
      
      case 'select':
        return (
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option.toLowerCase().replace(/\s+/g, '_')}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'radio':
        return (
          <RadioGroup>
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option.toLowerCase().replace(/\s+/g, '_')} id={`${field.id}_${index}`} />
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
                <Checkbox id={`${field.id}_${index}`} />
                <Label htmlFor={`${field.id}_${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      
      default:
        return <Input {...baseProps} type="text" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="capitalize">{form.status}</Badge>
            <Badge variant="outline">v{form.version}</Badge>
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{form.title}</h2>
          {form.description && (
            <p className="text-muted-foreground mt-2">{form.description}</p>
          )}
        </div>
      </div>

      {/* Form Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Form Preview</CardTitle>
          <CardDescription>
            This is how the form will appear to users filling it out.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {form.fields_schema?.fields?.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="flex items-center gap-1">
                  {field.label}
                  {field.required && <span className="text-destructive">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
            
            {form.fields_schema?.fields?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No fields configured for this form.</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button type="submit" disabled>
                Submit Form (Preview Mode)
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Close Preview
        </Button>
      </div>
    </div>
  );
}