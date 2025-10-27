import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Shield, Search, Filter, Download, Eye, User, Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AuditLog {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  old_values: any;
  new_values: any;
  user_id: string | null;
  created_at: string;
  user_name?: string;
}

interface AuditTrailProps {
  businessId: string;
  userRole: string;
}

export default function AuditTrail({ businessId, userRole }: AuditTrailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [displayLimit, setDisplayLimit] = useState(20);
  const [hasMore, setHasMore] = useState(false);

  const canViewAuditTrail = userRole === 'owner' || userRole === 'manager';

  useEffect(() => {
    if (canViewAuditTrail) {
      fetchAuditLogs();
    } else {
      setLoading(false);
    }
  }, [businessId, canViewAuditTrail]);

  useEffect(() => {
    // Filter logs based on search term, action, table, and date range
    let filtered = auditLogs;
    
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (actionFilter !== "all") {
      filtered = filtered.filter(log => log.action === actionFilter);
    }
    
    if (tableFilter !== "all") {
      filtered = filtered.filter(log => log.table_name === tableFilter);
    }
    
    if (startDate) {
      filtered = filtered.filter(log => new Date(log.created_at) >= startDate);
    }
    
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter(log => new Date(log.created_at) <= endOfDay);
    }
    
    setFilteredLogs(filtered);
    setHasMore(filtered.length > displayLimit);
  }, [auditLogs, searchTerm, actionFilter, tableFilter, startDate, endDate, displayLimit]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      // Fetch more than we display to check if there are more records
      const { data: logs, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (logsError) throw logsError;
      
      // Check if there are more records than our initial display limit
      setHasMore((logs?.length || 0) > displayLimit);

      // Get user names for the logs
      const userIds = [...new Set(logs?.map(log => log.user_id).filter(Boolean) || [])];
      
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', userIds);

        if (usersError) throw usersError;

        const logsWithUserNames = (logs || []).map(log => ({
          ...log,
          user_name: users?.find(u => u.id === log.user_id)
            ? `${users.find(u => u.id === log.user_id)?.first_name || ''} ${users.find(u => u.id === log.user_id)?.last_name || ''}`.trim()
            : 'System'
        }));

        setAuditLogs(logsWithUserNames);
      } else {
        setAuditLogs(logs || []);
      }

    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit trail.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'UPDATE':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'DELETE':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const formatTableName = (tableName: string) => {
    return tableName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const exportAuditLogs = () => {
    const csvContent = [
      ['Date', 'User', 'Action', 'Table', 'Record ID'].join(','),
      ...filteredLogs.map(log => [
        formatDate(log.created_at),
        log.user_name || 'System',
        log.action,
        formatTableName(log.table_name),
        log.record_id || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Audit trail exported successfully!",
    });
  };

  if (!canViewAuditTrail) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              You don't have permission to view the audit trail.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Contact your administrator for access.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];
  const uniqueTables = [...new Set(auditLogs.map(log => log.table_name))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Audit Trail ({auditLogs.length})
            </CardTitle>
            <CardDescription>
              Track all changes and activities within your organization.
            </CardDescription>
          </div>
          <Button onClick={exportAuditLogs} disabled={filteredLogs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="space-y-4 mb-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, table, or action..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tableFilter} onValueChange={setTableFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Tables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tables</SelectItem>
                  {uniqueTables.map(table => (
                    <SelectItem key={table} value={table}>{formatTableName(table)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date Range Filters */}
            <div className="flex gap-4 items-center">
              <span className="text-sm text-muted-foreground">Date Range:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <span className="text-muted-foreground">to</span>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              {(startDate || endDate) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStartDate(undefined);
                    setEndDate(undefined);
                  }}
                >
                  Clear dates
                </Button>
              )}
            </div>
          </div>

          {/* Audit Log List */}
          <div className="space-y-3">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || actionFilter !== "all" || tableFilter !== "all" || startDate || endDate
                  ? 'No audit logs found matching your filters.'
                  : 'No audit logs available.'
                }
              </div>
            ) : (
              <>
                {filteredLogs.slice(0, displayLimit).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`${getActionColor(log.action)} border`}>
                        {log.action}
                      </Badge>
                      <span className="font-medium">{formatTableName(log.table_name)}</span>
                      {log.record_id && (
                        <Badge variant="outline">ID: {log.record_id.slice(0, 8)}...</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{log.user_name || 'System'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          <span>{formatDate(log.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>
                          Detailed information about this audit log entry.
                        </DialogDescription>
                      </DialogHeader>
                      {selectedLog && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Action</p>
                              <Badge className={`${getActionColor(selectedLog.action)} border`}>
                                {selectedLog.action}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Table</p>
                              <p className="font-medium">{formatTableName(selectedLog.table_name)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">User</p>
                              <p className="font-medium">{selectedLog.user_name || 'System'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Date</p>
                              <p className="font-medium">{formatDate(selectedLog.created_at)}</p>
                            </div>
                          </div>

                          {selectedLog.old_values && (
                            <div>
                              <p className="text-sm font-medium mb-2">Previous Values</p>
                              <div className="bg-muted/50 rounded-lg p-3">
                                <pre className="text-xs overflow-x-auto">
                                  {JSON.stringify(selectedLog.old_values, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}

                          {selectedLog.new_values && (
                            <div>
                              <p className="text-sm font-medium mb-2">New Values</p>
                              <div className="bg-muted/50 rounded-lg p-3">
                                <pre className="text-xs overflow-x-auto">
                                  {JSON.stringify(selectedLog.new_values, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMore && displayLimit < filteredLogs.length && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setDisplayLimit(prev => prev + 20)}
                  >
                    Load More ({filteredLogs.length - displayLimit} remaining)
                  </Button>
                </div>
              )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}