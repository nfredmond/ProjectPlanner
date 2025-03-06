'use client';

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Upload, Layers, Eye, EyeOff, Plus, Trash2, Edit2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { createAdminClient } from '@/lib/supabase-client';

// Supported file types
const SUPPORTED_FORMATS = ['.geojson', '.kml', '.json', '.zip'];

// Map provider types
export type MapProvider = 'leaflet' | 'google' | 'mapbox' | 'qgis';

// Layer types
export type LayerType = 'geojson' | 'kml' | 'wms' | 'vector' | 'raster';

// Layer style interface
export interface LayerStyle {
  color?: string;
  weight?: number;
  opacity?: number;
  fillColor?: string;
  fillOpacity?: number;
  radius?: number;
}

// Layer definition interface
export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  url?: string;
  visible: boolean;
  data?: any;
  style: LayerStyle;
  metadata?: Record<string, any>;
  zIndex: number;
}

// Provider configuration interface
export interface ProviderConfig {
  id: string;
  name: string;
  type: MapProvider;
  apiKey?: string;
  attribution?: string;
  url?: string;
  isDefault?: boolean;
}

// Props for the LayerManager component
interface LayerManagerProps {
  onLayerChange?: (layers: Layer[]) => void;
  onProviderChange?: (provider: ProviderConfig) => void;
  layers?: Layer[];
  providers?: ProviderConfig[];
  defaultProvider?: MapProvider;
  projectId?: string;
  readOnly?: boolean;
}

/**
 * LayerManager component for managing GIS layers and map providers
 */
export default function LayerManager({
  onLayerChange,
  onProviderChange,
  layers: initialLayers = [],
  providers: initialProviders = [],
  defaultProvider = 'leaflet',
  projectId,
  readOnly = false,
}: LayerManagerProps) {
  const [layers, setLayers] = useState<Layer[]>(initialLayers);
  const [providers, setProviders] = useState<ProviderConfig[]>(initialProviders);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentEditingLayer, setCurrentEditingLayer] = useState<Layer | null>(null);
  const [styleEditorOpen, setStyleEditorOpen] = useState(false);
  
  // Fetch layers from database
  const fetchLayers = useCallback(async () => {
    try {
      const supabase = createAdminClient();
      
      // Query different based on if we have a project ID
      let query = supabase.from('map_layers').select('*');
      
      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        query = query.is('project_id', null);
      }
      
      const { data, error } = await query.order('zIndex', { ascending: true });
      
      if (error) {
        console.error('Error fetching layers:', error);
        return;
      }
      
      if (data) {
        const formattedLayers: Layer[] = data.map(layer => ({
          id: layer.id,
          name: layer.name,
          type: layer.type as LayerType,
          url: layer.url,
          visible: layer.visible,
          data: layer.data,
          style: layer.style as LayerStyle,
          metadata: layer.metadata,
          zIndex: layer.zIndex,
        }));
        
        setLayers(formattedLayers);
        onLayerChange?.(formattedLayers);
      }
    } catch (error) {
      console.error('Error in fetchLayers:', error);
    }
  }, [projectId, onLayerChange]);
  
  // Fetch map providers from database
  const fetchProviders = useCallback(async () => {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('map_providers')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching providers:', error);
        return;
      }
      
      if (data) {
        const formattedProviders: ProviderConfig[] = data.map(provider => ({
          id: provider.id,
          name: provider.name,
          type: provider.type as MapProvider,
          apiKey: provider.api_key,
          attribution: provider.attribution,
          url: provider.url,
          isDefault: provider.is_default,
        }));
        
        setProviders(formattedProviders);
        
        // Set active provider
        const defaultProv = formattedProviders.find(p => p.isDefault);
        if (defaultProv) {
          setSelectedProvider(defaultProv.id);
          onProviderChange?.(defaultProv);
        }
      }
    } catch (error) {
      console.error('Error in fetchProviders:', error);
    }
  }, [onProviderChange]);
  
  // Initialize layers and providers
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (initialLayers.length === 0) {
      fetchLayers();
    }
    
    if (initialProviders.length === 0) {
      fetchProviders();
    }
  }, []);
  
  // Handle provider change
  const handleProviderChange = (providerId: string) => {
    const selected = providers.find(p => p.id === providerId);
    if (selected) {
      setSelectedProvider(providerId);
      onProviderChange?.(selected);
    }
  };
  
  // Handle layer visibility toggle
  const toggleLayerVisibility = (layerId: string) => {
    const updatedLayers = layers.map(layer => {
      if (layer.id === layerId) {
        return { ...layer, visible: !layer.visible };
      }
      return layer;
    });
    
    setLayers(updatedLayers);
    onLayerChange?.(updatedLayers);
    
    // Update in database
    updateLayerInDatabase(
      updatedLayers.find(l => l.id === layerId)!
    );
  };
  
  // Update layer in database
  const updateLayerInDatabase = async (layer: Layer) => {
    try {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('map_layers')
        .update({
          name: layer.name,
          type: layer.type,
          url: layer.url,
          visible: layer.visible,
          data: layer.data,
          style: layer.style,
          metadata: layer.metadata,
          zIndex: layer.zIndex,
          updated_at: new Date().toISOString(),
        })
        .eq('id', layer.id);
      
      if (error) {
        console.error('Error updating layer:', error);
      }
    } catch (error) {
      console.error('Error in updateLayerInDatabase:', error);
    }
  };
  
  // Delete layer
  const deleteLayer = async (layerId: string) => {
    try {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('map_layers')
        .delete()
        .eq('id', layerId);
      
      if (error) {
        console.error('Error deleting layer:', error);
        return;
      }
      
      const updatedLayers = layers.filter(layer => layer.id !== layerId);
      setLayers(updatedLayers);
      onLayerChange?.(updatedLayers);
    } catch (error) {
      console.error('Error in deleteLayer:', error);
    }
  };
  
  // Handle layer file upload
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    try {
      setIsUploading(true);
      
      const file = acceptedFiles[0];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      // Read file as text
      const fileContents = await readFileAsText(file);
      
      let layerData;
      let layerType: LayerType = 'geojson';
      
      // Determine the layer type based on file extension
      if (fileExtension === '.geojson' || fileExtension === '.json') {
        // Parse GeoJSON
        layerData = JSON.parse(fileContents);
        layerType = 'geojson';
      } else if (fileExtension === '.kml') {
        // For KML, we would need a proper KML to GeoJSON converter
        // This is a placeholder
        layerData = { type: 'raw', content: fileContents };
        layerType = 'kml';
      } else if (fileExtension === '.zip') {
        // For Shapefiles (.zip), we would need a proper Shapefile parser
        // This is a placeholder
        layerData = { type: 'raw', content: 'Shapefile data (binary)' };
        layerType = 'vector';
      }
      
      // Create new layer
      const newLayer: Layer = {
        id: `layer-${Date.now()}`,
        name: file.name.substring(0, file.name.lastIndexOf('.')),
        type: layerType,
        visible: true,
        data: layerData,
        style: {
          color: getRandomColor(),
          weight: 2,
          opacity: 0.8,
          fillColor: getRandomColor(),
          fillOpacity: 0.3,
        },
        zIndex: layers.length + 1,
      };
      
      // Save to database
      await saveLayerToDatabase(newLayer);
      
      // Update state
      const updatedLayers = [...layers, newLayer];
      setLayers(updatedLayers);
      onLayerChange?.(updatedLayers);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Save layer to database
  const saveLayerToDatabase = async (layer: Layer) => {
    try {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('map_layers')
        .insert({
          id: layer.id,
          name: layer.name,
          type: layer.type,
          url: layer.url,
          visible: layer.visible,
          data: layer.data,
          style: layer.style,
          metadata: layer.metadata,
          zIndex: layer.zIndex,
          project_id: projectId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (error) {
        console.error('Error saving layer:', error);
      }
    } catch (error) {
      console.error('Error in saveLayerToDatabase:', error);
    }
  };
  
  // Read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };
  
  // Get random color for layer styling
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };
  
  // Reorder layers
  const moveLayer = (layerId: string, direction: 'up' | 'down') => {
    const layerIndex = layers.findIndex(l => l.id === layerId);
    if (layerIndex === -1) return;
    
    const newLayers = [...layers];
    const layer = newLayers[layerIndex];
    
    if (direction === 'up' && layerIndex > 0) {
      // Swap with previous layer
      const temp = newLayers[layerIndex - 1];
      newLayers[layerIndex - 1] = { ...layer, zIndex: layer.zIndex - 1 };
      newLayers[layerIndex] = { ...temp, zIndex: temp.zIndex + 1 };
    } else if (direction === 'down' && layerIndex < newLayers.length - 1) {
      // Swap with next layer
      const temp = newLayers[layerIndex + 1];
      newLayers[layerIndex + 1] = { ...layer, zIndex: layer.zIndex + 1 };
      newLayers[layerIndex] = { ...temp, zIndex: temp.zIndex - 1 };
    }
    
    // Sort by zIndex
    newLayers.sort((a, b) => a.zIndex - b.zIndex);
    
    setLayers(newLayers);
    onLayerChange?.(newLayers);
    
    // Update in database
    newLayers.forEach(layer => {
      updateLayerInDatabase(layer);
    });
  };
  
  // Edit layer style
  const startEditingLayer = (layer: Layer) => {
    setCurrentEditingLayer({ ...layer });
  };
  
  // Save layer style
  const saveLayerStyle = () => {
    if (!currentEditingLayer) return;
    
    const updatedLayers = layers.map(layer => {
      if (layer.id === currentEditingLayer.id) {
        return currentEditingLayer;
      }
      return layer;
    });
    
    setLayers(updatedLayers);
    onLayerChange?.(updatedLayers);
    
    // Update in database
    updateLayerInDatabase(currentEditingLayer);
    
    // Close editor
    setCurrentEditingLayer(null);
  };
  
  // Handle style change
  const handleStyleChange = (property: keyof LayerStyle, value: any) => {
    if (!currentEditingLayer) return;
    
    setCurrentEditingLayer({
      ...currentEditingLayer,
      style: {
        ...currentEditingLayer.style,
        [property]: value,
      },
    });
  };
  
  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/geo+json': ['.geojson'],
      'application/json': ['.json'],
      'application/vnd.google-earth.kml+xml': ['.kml'],
      'application/zip': ['.zip']
    },
    disabled: isUploading || readOnly,
    maxFiles: 1
  });
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      {/* Map Provider Selector */}
      <div className="mb-4">
        <Label htmlFor="map-provider" className="text-sm font-medium">
          Map Provider
        </Label>
        <Select
          value={selectedProvider}
          onValueChange={handleProviderChange}
          disabled={readOnly}
        >
          <SelectTrigger id="map-provider" className="w-full mt-1">
            <SelectValue placeholder="Select a map provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map(provider => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Layer List */}
      <Accordion type="multiple" className="space-y-2">
        <h3 className="text-sm font-semibold mb-2">Layers</h3>
        
        {layers.map(layer => (
          <AccordionItem 
            key={layer.id} 
            value={layer.id}
            className="border rounded-md px-3 py-1 mb-2"
          >
            <div className="flex items-center justify-between">
              <AccordionTrigger className="py-1 flex-1 text-left hover:no-underline">
                <span className="text-sm">{layer.name}</span>
              </AccordionTrigger>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleLayerVisibility(layer.id)}
                  title={layer.visible ? "Hide layer" : "Show layer"}
                >
                  {layer.visible ? (
                    <Eye className="h-4 w-4 text-gray-500" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
                
                {!readOnly && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditingLayer(layer)}
                      title="Edit layer style"
                    >
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteLayer(layer.id)}
                      title="Delete layer"
                    >
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            <AccordionContent className="px-2 py-2 text-sm text-gray-700">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="capitalize">{layer.type}</span>
                </div>
                
                {layer.url && (
                  <div className="flex justify-between">
                    <span>URL:</span>
                    <span className="text-xs truncate max-w-48">{layer.url}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Style:</span>
                  <div className="flex items-center space-x-2">
                    <div 
                      className="h-4 w-4 rounded-full" 
                      style={{ backgroundColor: layer.style.fillColor || layer.style.color }}
                    />
                    <span>Opacity: {layer.style.opacity || layer.style.fillOpacity || 0.8}</span>
                  </div>
                </div>
                
                {!readOnly && (
                  <div className="flex justify-between pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveLayer(layer.id, 'up')}
                      disabled={layers.indexOf(layer) === 0}
                    >
                      Move Up
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveLayer(layer.id, 'down')}
                      disabled={layers.indexOf(layer) === layers.length - 1}
                    >
                      Move Down
                    </Button>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      {/* Upload Area */}
      {!readOnly && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors duration-200 ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center text-gray-500">
            <Upload className="h-6 w-6 mb-2" />
            <p className="text-sm">
              {isUploading
                ? 'Uploading...'
                : isDragActive
                ? 'Drop the file here'
                : 'Drag & drop a GIS file, or click to select'}
            </p>
            <p className="text-xs mt-1">
              Supported formats: {SUPPORTED_FORMATS.join(', ')}
            </p>
          </div>
        </div>
      )}
      
      {/* Layer Style Editor Modal */}
      {currentEditingLayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Edit Layer Style</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="layer-name">Layer Name</Label>
                <Input
                  id="layer-name"
                  value={currentEditingLayer.name}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentEditingLayer({ ...currentEditingLayer, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="outline-color">Outline Color</Label>
                <div className="flex items-center mt-1">
                  <input
                    type="color"
                    id="outline-color"
                    value={currentEditingLayer.style.color || '#000000'}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleStyleChange('color', e.target.value)}
                    className="w-10 h-10 p-0 border-0"
                  />
                  <Input
                    value={currentEditingLayer.style.color || '#000000'}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleStyleChange('color', e.target.value)}
                    className="ml-2 flex-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="fill-color">Fill Color</Label>
                <div className="flex items-center mt-1">
                  <input
                    type="color"
                    id="fill-color"
                    value={currentEditingLayer.style.fillColor || '#000000'}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleStyleChange('fillColor', e.target.value)}
                    className="w-10 h-10 p-0 border-0"
                  />
                  <Input
                    value={currentEditingLayer.style.fillColor || '#000000'}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleStyleChange('fillColor', e.target.value)}
                    className="ml-2 flex-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="opacity">Outline Opacity</Label>
                <div className="flex items-center mt-1">
                  <input
                    type="range"
                    id="opacity"
                    min="0"
                    max="1"
                    step="0.1"
                    value={currentEditingLayer.style.opacity || 0.8}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleStyleChange('opacity', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="ml-2 w-8 text-right">{currentEditingLayer.style.opacity || 0.8}</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="fill-opacity">Fill Opacity</Label>
                <div className="flex items-center mt-1">
                  <input
                    type="range"
                    id="fill-opacity"
                    min="0"
                    max="1"
                    step="0.1"
                    value={currentEditingLayer.style.fillOpacity || 0.3}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleStyleChange('fillOpacity', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="ml-2 w-8 text-right">{currentEditingLayer.style.fillOpacity || 0.3}</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="weight">Line Weight</Label>
                <div className="flex items-center mt-1">
                  <input
                    type="range"
                    id="weight"
                    min="1"
                    max="10"
                    step="1"
                    value={currentEditingLayer.style.weight || 2}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleStyleChange('weight', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="ml-2 w-8 text-right">{currentEditingLayer.style.weight || 2}px</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentEditingLayer(null)}
              >
                Cancel
              </Button>
              <Button onClick={saveLayerStyle}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 