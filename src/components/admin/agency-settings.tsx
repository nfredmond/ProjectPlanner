'use client';

import React, { useState } from 'react';
import { Agency, AgencySettings as AgencySettingsType } from '@/types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';

// Utility function to ensure we have complete agency data
const ensureCompleteAgencyData = (agencyData: Partial<Agency>): Agency => {
  return {
    id: agencyData.id || '',
    name: agencyData.name || '',
    region: agencyData.region || '',
    logo_url: agencyData.logo_url,
    settings: agencyData.settings || {},
    created_at: agencyData.created_at || new Date().toISOString(),
    updated_at: agencyData.updated_at
  };
};

interface AgencySettingsProps {
  agency: Partial<Agency>;
}

export default function AgencySettings({ agency: rawAgency }: AgencySettingsProps) {
  // Ensure we have complete agency data
  const agency = ensureCompleteAgencyData(rawAgency);

  const [name, setName] = useState(agency.name);
  const [region, setRegion] = useState(agency.region || '');
  const [logoUrl, setLogoUrl] = useState(agency.logo_url || '');
  const [settings, setSettings] = useState<AgencySettingsType>(agency.settings || {});
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      
      // Preview the image
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Upload logo if a new one was selected
      let updatedLogoUrl = logoUrl;
      if (logoFile) {
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `${agency.id}-logo-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('agency-logos')
          .upload(fileName, logoFile, {
            cacheControl: '3600',
            upsert: false,
          });
        
        if (uploadError) throw new Error(uploadError.message);
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('agency-logos')
          .getPublicUrl(fileName);
          
        updatedLogoUrl = publicUrl;
      }
      
      // Update agency record
      const { error: updateError } = await supabase
        .from('agencies')
        .update({
          name,
          region,
          logo_url: updatedLogoUrl,
          settings,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agency.id);
      
      if (updateError) throw new Error(updateError.message);
      
      toast({
        title: "Success",
        description: "Agency settings updated successfully",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update agency settings: ${(error as Error).message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update a specific setting value
  const updateSetting = (key: string, value: any) => {
    const camelCaseKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    setSettings({
      ...settings,
      [camelCaseKey]: value,
    });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agency Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Agency Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="region">Region</Label>
                <Input
                  id="region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="e.g., Northern California, Central Coast"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Agency Logo</Label>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-20 w-20 rounded border overflow-hidden relative bg-gray-100">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt="Agency Logo"
                      fill
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      No Logo
                    </div>
                  )}
                </div>
                <div>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recommended size: 200x200px. Max size: 2MB.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Application Settings</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="default_map_center_lat">Default Map Center (Latitude)</Label>
                  <Input
                    id="default_map_center_lat"
                    type="number"
                    step="0.000001"
                    value={settings.mapCenter?.[0] || ''}
                    onChange={(e) => updateSetting('mapCenter', [
                      parseFloat(e.target.value), 
                      settings.mapCenter?.[1] || 0
                    ])}
                    placeholder="e.g., 37.7749"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default_map_center_lng">Default Map Center (Longitude)</Label>
                  <Input
                    id="default_map_center_lng"
                    type="number"
                    step="0.000001"
                    value={settings.mapCenter?.[1] || ''}
                    onChange={(e) => updateSetting('mapCenter', [
                      settings.mapCenter?.[0] || 0,
                      parseFloat(e.target.value)
                    ])}
                    placeholder="e.g., -122.4194"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="default_map_zoom">Default Map Zoom Level</Label>
                <Input
                  id="default_map_zoom"
                  type="number"
                  min="1"
                  max="20"
                  value={settings.defaultZoom || ''}
                  onChange={(e) => updateSetting('defaultZoom', parseInt(e.target.value))}
                  placeholder="e.g., 10"
                />
                <p className="text-xs text-gray-500">
                  Zoom level between 1 (world view) and 20 (street level).
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={settings.primaryColor || '#0066cc'}
                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={settings.primaryColor || '#0066cc'}
                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={settings.secondaryColor || '#f59e0b'}
                    onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={settings.secondaryColor || '#f59e0b'}
                    onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable_community_portal"
                    checked={settings.enableCommunityPortal || false}
                    onCheckedChange={(checked: boolean | "indeterminate") => 
                      updateSetting('enableCommunityPortal', Boolean(checked === true))
                    }
                  />
                  <Label htmlFor="enable_community_portal">Enable Community Portal</Label>
                </div>
                <p className="text-xs text-gray-500 pl-6">
                  Allow public access to the community feedback portal.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable_llm_features"
                    checked={settings.enableLlm || false}
                    onCheckedChange={(checked: boolean | "indeterminate") => 
                      updateSetting('enableLlm', Boolean(checked === true))
                    }
                  />
                  <Label htmlFor="enable_llm_features">Enable AI/LLM Features</Label>
                </div>
                <p className="text-xs text-gray-500 pl-6">
                  Turn on AI-powered features like feedback response generation.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 