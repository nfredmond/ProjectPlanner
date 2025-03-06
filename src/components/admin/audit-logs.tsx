'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

interface AuditLog {
  id: string;
  created_at: string;
  user_id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  ip_address: string;
}

interface AuditLogsProps {
  agencyId: string;
}

export default function AuditLogs({ agencyId }: AuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalLogs, setTotalLogs] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [userFilter, setUserFilter] = useState<string>('');
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  // Load audit logs
  useEffect(() => {
    async function fetchLogs() {
      setIsLoading(true);
      
      try {
        // Start building the query
        let query = supabase
          .from('audit_logs')
          .select('id, created_at, user_id, user_email, action, entity_type, entity_id, details, ip_address', { count: 'exact' })
          .eq('agency_id', agencyId)
          .order('created_at', { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);
        
        // Apply filters if present
        if (actionFilter) {
          query = query.eq('action', actionFilter);
        }
        
        if (entityTypeFilter) {
          query = query.eq('entity_type', entityTypeFilter);
        }
        
        if (userFilter) {
          query = query.ilike('user_email', `%${userFilter}%`);
        }
        
        if (dateRangeStart) {
          query = query.gte('created_at', new Date(dateRangeStart).toISOString());
        }
        
        if (dateRangeEnd) {
          // Add one day to include the end date fully
          const endDate = new Date(dateRangeEnd);
          endDate.setDate(endDate.getDate() + 1);
          query = query.lt('created_at', endDate.toISOString());
        }
        
        // Execute the query
        const { data, count, error } = await query;
        
        if (error) {
          throw new Error(error.message);
        }
        
        setLogs(data || []);
        setTotalLogs(count || 0);
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to load audit logs: ${(error as Error).message}`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchLogs();
  }, [agencyId, page, pageSize, actionFilter, entityTypeFilter, userFilter, dateRangeStart, dateRangeEnd, supabase, toast]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Handle page size change
  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
    setPage(1); // Reset to first page when changing page size
  };
  
  // Clear all filters
  const clearFilters = () => {
    setActionFilter('');
    setEntityTypeFilter('');
    setUserFilter('');
    setDateRangeStart('');
    setDateRangeEnd('');
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };
  
  // Get badge color based on action
  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'login':
        return 'bg-purple-100 text-purple-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get entity type display name
  const getEntityTypeDisplay = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'user':
        return 'User';
      case 'project':
        return 'Project';
      case 'score':
        return 'Score';
      case 'agency':
        return 'Agency';
      case 'criterion':
        return 'Criterion';
      default:
        return entityType;
    }
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalLogs / pageSize);
  
  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxItems = 7; // Max number of page links to show
    
    // Calculate start and end page numbers
    let startPage = Math.max(1, page - Math.floor(maxItems / 2));
    let endPage = Math.min(totalPages, startPage + maxItems - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxItems && startPage > 1) {
      startPage = Math.max(1, endPage - maxItems + 1);
    }
    
    // Add first page if not included in range
    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      
      // Add ellipsis if there's a gap
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }
    }
    
    // Add page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={page === i} 
            onClick={() => handlePageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add last page if not included in range
    if (endPage < totalPages) {
      // Add ellipsis if there's a gap
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }
      
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => handlePageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };
  
  if (isLoading && logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>Track all important actions in your RTPA application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>Track all important actions in your RTPA application</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs mb-1 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs mb-1 block">Entity Type</label>
              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All entities</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                  <SelectItem value="score">Score</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                  <SelectItem value="criterion">Criterion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs mb-1 block">User</label>
              <Input 
                placeholder="Filter by email"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs mb-1 block">From</label>
                <Input 
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs mb-1 block">To</label>
                <Input 
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
        
        {/* Results summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <p className="text-sm text-gray-500 mb-3 sm:mb-0">
            Showing {logs.length} of {totalLogs} audit logs
          </p>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-500">Rows per page:</label>
            <Select 
              value={pageSize.toString()} 
              onValueChange={handlePageSizeChange}
            >
              <SelectTrigger className="w-16 h-8">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Logs table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-3 px-4 text-left">Time</th>
                <th className="py-3 px-4 text-left">User</th>
                <th className="py-3 px-4 text-left">Action</th>
                <th className="py-3 px-4 text-left">Entity</th>
                <th className="py-3 px-4 text-left">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      {log.user_email || <span className="text-gray-400">System</span>}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getActionBadgeColor(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span>{getEntityTypeDisplay(log.entity_type)}</span>
                        <span className="text-xs text-gray-500">{log.entity_id}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {log.details ? (
                        <details className="cursor-pointer">
                          <summary className="text-sm text-blue-600">View details</summary>
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                          </div>
                        </details>
                      ) : (
                        <span className="text-gray-400">No details</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No audit logs found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
                
                {getPaginationItems()}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 