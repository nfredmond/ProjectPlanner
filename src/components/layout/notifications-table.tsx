'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: string;
  is_read: boolean;
  created_at: string;
  metadata: Record<string, any>;
}

export function NotificationsTable({ userId }: { userId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/notifications/send?user_id=${userId}&limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const { data } = await response.json();
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);
  
  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_id: notificationId,
          is_read: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`/api/notifications/read-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };
  
  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification_id: notificationId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
      
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.type === 'new_feedback' || notification.type === 'feedback_moderation' || notification.type === 'feedback_response') {
      if (notification.metadata?.feedback_id) {
        router.push(`/community/feedback?id=${notification.metadata.feedback_id}`);
      } else {
        router.push('/community/feedback');
      }
    } else if (notification.type === 'project_update') {
      if (notification.metadata?.project_id) {
        router.push(`/projects/${notification.metadata.project_id}`);
      } else {
        router.push('/projects');
      }
    }
  };
  
  // Get filtered notifications based on active tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !n.is_read);
      case 'read':
        return notifications.filter(n => n.is_read);
      default:
        return notifications;
    }
  };
  
  // Get notification type badge
  const getNotificationTypeBadge = (type: string) => {
    switch (type) {
      case 'new_feedback':
        return <Badge className="bg-blue-500">Feedback</Badge>;
      case 'feedback_moderation':
        return <Badge className="bg-yellow-500">Moderation</Badge>;
      case 'feedback_response':
        return <Badge className="bg-green-500">Response</Badge>;
      case 'project_update':
        return <Badge className="bg-purple-500">Project</Badge>;
      default:
        return <Badge>Notification</Badge>;
    }
  };
  
  // Fetch notifications on mount
  useEffect(() => {
    if (userId) {
      fetchNotifications();
    }
  }, [userId, fetchNotifications]);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Notifications</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchNotifications}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllAsRead}
            disabled={isLoading || notifications.every(n => n.is_read)}
          >
            Mark All as Read
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All
              <Badge className="ml-2 bg-gray-500">{notifications.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              <Badge className="ml-2 bg-blue-500">
                {notifications.filter(n => !n.is_read).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="read">
              Read
              <Badge className="ml-2 bg-green-500">
                {notifications.filter(n => n.is_read).length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
              </div>
            ) : getFilteredNotifications().length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No {activeTab !== 'all' ? activeTab : ''} notifications</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredNotifications().map(notification => (
                  <div 
                    key={notification.id}
                    className={`p-4 border rounded-lg ${!notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                        <div className="flex items-center gap-2 mb-1">
                          {getNotificationTypeBadge(notification.type)}
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <h3 className="font-medium">{notification.title}</h3>
                        <p className="text-gray-600 mt-1">{notification.content}</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.is_read && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => markAsRead(notification.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Mark as read</span>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => deleteNotification(notification.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 