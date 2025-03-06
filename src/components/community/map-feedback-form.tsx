'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2, MapPin } from 'lucide-react';
import { LatLngExpression } from 'leaflet';
import { useToast } from '@/components/ui/use-toast';

interface MapFeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: LatLngExpression;
  agencyId: string;
  projects: Array<{id: string, title: string}>;
}

export function MapFeedbackForm({
  isOpen,
  onClose,
  coordinates,
  agencyId,
  projects
}: MapFeedbackFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectId: '',
    content: '',
    isSpam: false // Honeypot field
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Feedback content is required';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Feedback must be at least 10 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleProjectChange = (value: string) => {
    setFormData(prev => ({ ...prev, projectId: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If honeypot field is filled, silently reject but pretend it was submitted
    if (formData.isSpam) {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
      onClose();
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/community/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          project_id: formData.projectId || null,
          content: formData.content,
          agency_id: agencyId,
          coordinates: coordinates,
          status: 'pending'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
      
      onClose();
      router.refresh();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
          <DialogDescription>
            Share your thoughts about this location or a nearby project.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <MapPin size={16} />
              <span>
                Location: {Array.isArray(coordinates) 
                  ? `${coordinates[0].toFixed(5)}, ${coordinates[1].toFixed(5)}`
                  : `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}`}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project">Related Project (Optional)</Label>
              <Select value={formData.projectId} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Your Feedback</Label>
              <Textarea
                id="content"
                name="content"
                rows={5}
                value={formData.content}
                onChange={handleChange}
                className={errors.content ? 'border-red-500' : ''}
              />
              {errors.content && <p className="text-red-500 text-xs">{errors.content}</p>}
            </div>
            
            {/* Honeypot field - invisible to users but bots might fill it */}
            <div className="hidden">
              <input
                type="checkbox"
                name="isSpam"
                tabIndex={-1}
                autoComplete="off"
                onChange={() => setFormData(prev => ({ ...prev, isSpam: true }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 