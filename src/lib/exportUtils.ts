// Utility functions for exporting data to various formats

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    return;
  }

  // Get all unique keys from all objects to create headers
  const headers = Array.from(
    new Set(data.flatMap(item => Object.keys(item)))
  );

  // Create CSV content
  const csvContent = [
    // Header row
    headers.join(','),
    // Data rows
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle nested objects and arrays
        let cellValue = '';
        if (value === null || value === undefined) {
          cellValue = '';
        } else if (typeof value === 'object') {
          cellValue = JSON.stringify(value).replace(/"/g, '""');
        } else {
          cellValue = String(value).replace(/"/g, '""');
        }
        // Wrap in quotes if contains comma, newline, or quotes
        return cellValue.includes(',') || cellValue.includes('\n') || cellValue.includes('"') 
          ? `"${cellValue}"` 
          : cellValue;
      }).join(',')
    )
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const formatDateForExport = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString();
};

export const flattenFormSubmissionData = (submission: any) => {
  const flatSubmission = { ...submission };
  
  // Flatten submission_data if it's an object
  if (flatSubmission.submission_data && typeof flatSubmission.submission_data === 'object') {
    const submissionData = flatSubmission.submission_data;
    delete flatSubmission.submission_data;
    
    // Add each field from submission_data as a separate column
    Object.keys(submissionData).forEach(key => {
      flatSubmission[`form_field_${key}`] = submissionData[key];
    });
  }
  
  // Format dates
  flatSubmission.created_at = formatDateForExport(flatSubmission.created_at);
  flatSubmission.updated_at = formatDateForExport(flatSubmission.updated_at);
  flatSubmission.submitted_at = formatDateForExport(flatSubmission.submitted_at);
  flatSubmission.reviewed_at = formatDateForExport(flatSubmission.reviewed_at);
  
  return flatSubmission;
};

export const createSimplifiedFormExport = (submission: any, formSchema: any) => {
  const exportRow: any = {};
  
  // Add submitter info
  if (submission.users) {
    exportRow['Submitted By'] = `${submission.users.first_name || ''} ${submission.users.last_name || ''}`.trim() || 'Unknown User';
  } else {
    exportRow['Submitted By'] = 'Unknown User';
  }
  
  // Add client info
  if (submission.clients) {
    exportRow['Client Name'] = submission.clients.name || 'No Client';
  } else {
    exportRow['Client Name'] = 'No Client';
  }
  
  // Add form fields with their labels and answers
  if (formSchema?.fields && submission.submission_data) {
    formSchema.fields.forEach((field: any) => {
      const fieldLabel = field.label || field.id || 'Unknown Field';
      const fieldValue = submission.submission_data[field.id] || '';
      exportRow[fieldLabel] = fieldValue;
    });
  }
  
  return exportRow;
};

export const createPivotTableExport = (submissions: any[], startDate: string, endDate: string) => {
  if (!submissions || submissions.length === 0) return [];

  // Generate date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateColumns: string[] = [];
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dateColumns.push(d.toISOString().split('T')[0]);
  }

  // Get all unique form fields across all submissions
  const allFields = new Map();
  submissions.forEach(submission => {
    if (submission.forms?.fields_schema?.fields) {
      submission.forms.fields_schema.fields.forEach((field: any) => {
        const fieldLabel = field.label || field.id || 'Unknown Field';
        allFields.set(field.id, fieldLabel);
      });
    }
  });

  // Create pivot table data
  const pivotData: any[] = [];

  // Group submissions by date
  const submissionsByDate = new Map();
  submissions.forEach(submission => {
    const submissionDate = new Date(submission.created_at).toISOString().split('T')[0];
    if (!submissionsByDate.has(submissionDate)) {
      submissionsByDate.set(submissionDate, []);
    }
    submissionsByDate.get(submissionDate).push(submission);
  });

  // Helper function to get user initials
  const getUserInitials = (user: any) => {
    if (!user) return 'UU';
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'UU';
  };

  // Create a row for each field
  allFields.forEach((fieldLabel, fieldId) => {
    // Find the field definition to get description
    let fieldDescription = '';
    submissions.forEach(submission => {
      if (submission.forms?.fields_schema?.fields) {
        const field = submission.forms.fields_schema.fields.find((f: any) => f.id === fieldId);
        if (field?.description) {
          fieldDescription = field.description;
        }
      }
    });

    // Use description as additional context if available
    const fieldDisplayName = fieldDescription 
      ? `${fieldLabel} - ${fieldDescription}` 
      : fieldLabel;
    
    const row: any = { 
      'Field': fieldDisplayName
    };
    
    dateColumns.forEach(date => {
      const daySubmissions = submissionsByDate.get(date) || [];
      const entries: string[] = [];
      
      daySubmissions.forEach(submission => {
        const value = submission.submission_data[fieldId];
        if (value !== undefined && value !== null && value !== '') {
          const userInitials = getUserInitials(submission.users);
          let formattedValue = '';
          
          if (Array.isArray(value)) {
            formattedValue = value.join(', ');
          } else {
            formattedValue = String(value);
          }
          
          // Keep full value and put initials inline - let cells expand naturally
          entries.push(`${formattedValue} (${userInitials})`);
        }
      });
      
      // Use newline separator for better readability when cells expand
      row[date] = entries.length > 0 ? entries.join('\n') : '';
    });
    
    pivotData.push(row);
  });

  return pivotData;
};

export const flattenClientData = (client: any) => {
  const flatClient = { ...client };
  
  // Flatten contact_info if it's an object
  if (flatClient.contact_info && typeof flatClient.contact_info === 'object') {
    const contactInfo = flatClient.contact_info;
    delete flatClient.contact_info;
    
    // Add each field from contact_info as a separate column
    Object.keys(contactInfo).forEach(key => {
      flatClient[`contact_${key}`] = contactInfo[key];
    });
  }
  
  // Format dates
  flatClient.created_at = formatDateForExport(flatClient.created_at);
  flatClient.updated_at = formatDateForExport(flatClient.updated_at);
  if (flatClient.date_of_birth) {
    flatClient.date_of_birth = new Date(flatClient.date_of_birth).toLocaleDateString();
  }
  
  return flatClient;
};