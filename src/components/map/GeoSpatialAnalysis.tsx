'use client';

import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  CircleMarker,
  Popup,
  useMap,
  GeoJSON,
  Tooltip,
  Circle
} from 'react-leaflet';
import L from 'leaflet';
import { createAdminClient } from '@/lib/supabase-client';
import { Layer, LayerStyle } from './LayerManager';
import { Card } from '@/components/ui/card';
import { CardContent } from '@/components/ui/card';
import { CardDescription } from '@/components/ui/card';
import { CardHeader } from '@/components/ui/card';
import { CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { SelectContent } from '@/components/ui/select';
import { SelectItem } from '@/components/ui/select';
import { SelectTrigger } from '@/components/ui/select';
import { SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { TabsContent } from '@/components/ui/tabs';
import { TabsList } from '@/components/ui/tabs';
import { TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Activity, 
  Filter, 
  AlertTriangle, 
  Info, 
  Map as MapIcon,
  Layers,
  Circle as CircleIcon,
  Square
} from 'lucide-react';

// Types of geospatial analysis
export type AnalysisType = 
  | 'overlay' 
  | 'buffer' 
  | 'density' 
  | 'intersection' 
  | 'proximity';

// Analysis result type
export interface AnalysisResult {
  id: string;
  type: AnalysisType;
  name: string;
  layer: GeoJSON.FeatureCollection | GeoJSON.Feature; // More specific than any
  metadata?: Record<string, unknown>; // More specific than any
  style: LayerStyle;
  createdAt: string;
}

// Analysis setting type
export interface AnalysisSetting {
  type: AnalysisType;
  buffer?: number;
  units?: 'miles' | 'kilometers' | 'meters';
  targetLayer?: string;
  sourceLayer?: string;
  category?: string;
  threshold?: number;
  radius?: number;
}

// Props interface
interface GeoSpatialAnalysisProps {
  projectId?: string;
  layers: Layer[];
  onAnalysisComplete?: (result: AnalysisResult) => void;
  onAddResultToLayers?: (layer: Layer) => void;
  className?: string;
}

/**
 * GeoSpatialAnalysis component for advanced geospatial analysis
 */
export default function GeoSpatialAnalysis({
  projectId,
  layers,
  onAnalysisComplete,
  onAddResultToLayers,
  className = '',
}: GeoSpatialAnalysisProps) {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('overlay');
  const [settings, setSettings] = useState<AnalysisSetting>({
    type: 'overlay',
    buffer: 0.5,
    units: 'miles',
  });
  const [selectedLayers, setSelectedLayers] = useState<{source?: string, target?: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [showResults, setShowResults] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize when layers change
  useEffect(() => {
    if (layers.length > 0 && !selectedLayers.source) {
      setSelectedLayers({
        source: layers[0].id,
        target: layers.length > 1 ? layers[1].id : layers[0].id
      });
    }
  }, [layers, selectedLayers.source]);
  
  // Update settings when analysis type changes
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      type: analysisType,
    }));
  }, [analysisType]);
  
  // Run geospatial analysis
  const runAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get selected layers
      const sourceLayer = layers.find(l => l.id === selectedLayers.source);
      const targetLayer = layers.find(l => l.id === selectedLayers.target);
      
      if (!sourceLayer) {
        setError('Source layer not selected');
        setIsLoading(false);
        return;
      }
      
      // Perform different analysis based on type
      let result: AnalysisResult;
      
      switch (analysisType) {
        case 'overlay':
          result = await performOverlayAnalysis(sourceLayer, targetLayer);
          break;
        case 'buffer':
          result = await performBufferAnalysis(sourceLayer, settings.buffer || 0.5, settings.units || 'miles');
          break;
        case 'density':
          result = await performDensityAnalysis(sourceLayer, settings.radius || 1, settings.units || 'miles');
          break;
        case 'intersection':
          if (!targetLayer) {
            setError('Target layer required for intersection analysis');
            setIsLoading(false);
            return;
          }
          result = await performIntersectionAnalysis(sourceLayer, targetLayer);
          break;
        case 'proximity':
          if (!targetLayer) {
            setError('Target layer required for proximity analysis');
            setIsLoading(false);
            return;
          }
          result = await performProximityAnalysis(sourceLayer, targetLayer, settings.threshold || 1, settings.units || 'miles');
          break;
        default:
          setError('Invalid analysis type');
          setIsLoading(false);
          return;
      }
      
      // Save result
      setResults(prev => [result, ...prev]);
      
      // Notify parent
      onAnalysisComplete?.(result);
      
      // Add to layers if requested
      if (onAddResultToLayers) {
        const newLayer: Layer = {
          id: `analysis-${result.id}`,
          name: result.name,
          type: 'geojson',
          visible: true,
          data: result.layer,
          style: result.style,
          zIndex: layers.length + 1,
          metadata: {
            analysisType: result.type,
            analysisMetadata: result.metadata,
            createdAt: result.createdAt
          }
        };
        
        onAddResultToLayers(newLayer);
      }
    } catch (error) {
      console.error('Error running analysis:', error);
      setError('Failed to perform analysis. See console for details.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Overlay analysis (e.g. finding projects in environmentally sensitive areas)
  const performOverlayAnalysis = async (
    sourceLayer: Layer, 
    targetLayer?: Layer
  ): Promise<AnalysisResult> => {
    try {
      const supabase = createAdminClient();
      
      // If we have a target layer, use it for overlay
      if (targetLayer) {
        // In a real implementation, we would make a PostGIS call here
        // This is a simplified implementation that might not work for complex geometries
        
        // Make a call to the backend for spatial overlay
        const { data, error } = await supabase.rpc('spatial_overlay_analysis', {
          source_geojson: JSON.stringify(sourceLayer.data),
          target_geojson: JSON.stringify(targetLayer.data),
        });
        
        if (error) {
          throw new Error(`Overlay analysis failed: ${error.message}`);
        }
        
        return {
          id: `overlay-${Date.now()}`,
          type: 'overlay',
          name: `Overlay: ${sourceLayer.name} within ${targetLayer.name}`,
          layer: data,
          metadata: {
            sourceLayer: sourceLayer.id,
            targetLayer: targetLayer.id,
          },
          style: {
            color: '#ff4500',
            weight: 2,
            opacity: 0.8,
            fillColor: '#ff4500',
            fillOpacity: 0.3
          },
          createdAt: new Date().toISOString()
        };
      } else {
        // Without a target layer, just return the source layer with different styling
        // In a real implementation, we might overlay with a default environmental layer
        
        return {
          id: `overlay-${Date.now()}`,
          type: 'overlay',
          name: `Overlay: ${sourceLayer.name}`,
          layer: sourceLayer.data,
          metadata: {
            sourceLayer: sourceLayer.id,
          },
          style: {
            color: '#ff4500',
            weight: 2,
            opacity: 0.8,
            fillColor: '#ff4500',
            fillOpacity: 0.3
          },
          createdAt: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error in overlay analysis:', error);
      throw error;
    }
  };
  
  // Buffer analysis
  const performBufferAnalysis = async (
    sourceLayer: Layer, 
    distance: number,
    units: 'miles' | 'kilometers' | 'meters'
  ): Promise<AnalysisResult> => {
    try {
      const supabase = createAdminClient();
      
      // Convert distance to meters for PostGIS
      let distanceInMeters = distance;
      if (units === 'miles') {
        distanceInMeters = distance * 1609.34;
      } else if (units === 'kilometers') {
        distanceInMeters = distance * 1000;
      }
      
      // Call PostGIS buffer function
      const { data, error } = await supabase.rpc('create_buffer', {
        source_geojson: JSON.stringify(sourceLayer.data),
        buffer_distance: distanceInMeters
      });
      
      if (error) {
        throw new Error(`Buffer analysis failed: ${error.message}`);
      }
      
      return {
        id: `buffer-${Date.now()}`,
        type: 'buffer',
        name: `Buffer: ${sourceLayer.name} (${distance} ${units})`,
        layer: data,
        metadata: {
          sourceLayer: sourceLayer.id,
          distance,
          units,
          distanceInMeters
        },
        style: {
          color: '#3388ff',
          weight: 2,
          opacity: 0.6,
          fillColor: '#3388ff',
          fillOpacity: 0.2
        },
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      // If PostGIS call fails, generate a simplified result
      // This is a fallback for demo purposes only
      console.error('Error in buffer analysis, using fallback:', error);
      
      // Create a very simplified buffer (only works well for point data)
      const bufferedFeatures = createFallbackBuffer(sourceLayer.data, distance, units);
      
      return {
        id: `buffer-${Date.now()}`,
        type: 'buffer',
        name: `Buffer: ${sourceLayer.name} (${distance} ${units})`,
        layer: {
          type: 'FeatureCollection',
          features: bufferedFeatures
        },
        metadata: {
          sourceLayer: sourceLayer.id,
          distance,
          units,
          isFallback: true
        },
        style: {
          color: '#3388ff',
          weight: 2,
          opacity: 0.6,
          fillColor: '#3388ff',
          fillOpacity: 0.2
        },
        createdAt: new Date().toISOString()
      };
    }
  };
  
  // Density analysis
  const performDensityAnalysis = async (
    sourceLayer: Layer,
    radius: number,
    units: 'miles' | 'kilometers' | 'meters'
  ): Promise<AnalysisResult> => {
    try {
      const supabase = createAdminClient();
      
      // Convert radius to meters for PostGIS
      let radiusInMeters = radius;
      if (units === 'miles') {
        radiusInMeters = radius * 1609.34;
      } else if (units === 'kilometers') {
        radiusInMeters = radius * 1000;
      }
      
      // Call PostGIS density analysis function
      const { data, error } = await supabase.rpc('create_density_heatmap', {
        source_geojson: JSON.stringify(sourceLayer.data),
        cell_size: radiusInMeters
      });
      
      if (error) {
        throw new Error(`Density analysis failed: ${error.message}`);
      }
      
      return {
        id: `density-${Date.now()}`,
        type: 'density',
        name: `Density: ${sourceLayer.name} (${radius} ${units})`,
        layer: data,
        metadata: {
          sourceLayer: sourceLayer.id,
          radius,
          units,
          radiusInMeters
        },
        style: {
          color: '#800080',
          weight: 2,
          opacity: 0.7,
          fillColor: '#800080',
          fillOpacity: 0.5
        },
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      // If PostGIS call fails, generate a simplified result
      console.error('Error in density analysis, using fallback:', error);
      
      // Generate a very simplified density map (not accurate, just for demonstration)
      return {
        id: `density-${Date.now()}`,
        type: 'density',
        name: `Density: ${sourceLayer.name} (${radius} ${units})`,
        layer: sourceLayer.data, // Just return original data with different styling
        metadata: {
          sourceLayer: sourceLayer.id,
          radius,
          units,
          isFallback: true
        },
        style: {
          color: '#800080',
          weight: 2,
          opacity: 0.7,
          fillColor: '#800080',
          fillOpacity: 0.5
        },
        createdAt: new Date().toISOString()
      };
    }
  };
  
  // Intersection analysis
  const performIntersectionAnalysis = async (
    sourceLayer: Layer,
    targetLayer: Layer
  ): Promise<AnalysisResult> => {
    try {
      const supabase = createAdminClient();
      
      // Call PostGIS intersection function
      const { data, error } = await supabase.rpc('spatial_intersection', {
        source_geojson: JSON.stringify(sourceLayer.data),
        target_geojson: JSON.stringify(targetLayer.data)
      });
      
      if (error) {
        throw new Error(`Intersection analysis failed: ${error.message}`);
      }
      
      return {
        id: `intersection-${Date.now()}`,
        type: 'intersection',
        name: `Intersection: ${sourceLayer.name} and ${targetLayer.name}`,
        layer: data,
        metadata: {
          sourceLayer: sourceLayer.id,
          targetLayer: targetLayer.id
        },
        style: {
          color: '#ff00ff',
          weight: 2,
          opacity: 0.8,
          fillColor: '#ff00ff',
          fillOpacity: 0.3
        },
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in intersection analysis:', error);
      throw error;
    }
  };
  
  // Proximity analysis
  const performProximityAnalysis = async (
    sourceLayer: Layer,
    targetLayer: Layer,
    threshold: number,
    units: 'miles' | 'kilometers' | 'meters'
  ): Promise<AnalysisResult> => {
    try {
      const supabase = createAdminClient();
      
      // Convert threshold to meters for PostGIS
      let thresholdInMeters = threshold;
      if (units === 'miles') {
        thresholdInMeters = threshold * 1609.34;
      } else if (units === 'kilometers') {
        thresholdInMeters = threshold * 1000;
      }
      
      // Call PostGIS proximity function
      const { data, error } = await supabase.rpc('find_features_within_distance', {
        source_geojson: JSON.stringify(sourceLayer.data),
        target_geojson: JSON.stringify(targetLayer.data),
        distance_meters: thresholdInMeters
      });
      
      if (error) {
        throw new Error(`Proximity analysis failed: ${error.message}`);
      }
      
      return {
        id: `proximity-${Date.now()}`,
        type: 'proximity',
        name: `Proximity: ${sourceLayer.name} within ${threshold} ${units} of ${targetLayer.name}`,
        layer: data,
        metadata: {
          sourceLayer: sourceLayer.id,
          targetLayer: targetLayer.id,
          threshold,
          units,
          thresholdInMeters
        },
        style: {
          color: '#00bfff',
          weight: 2,
          opacity: 0.8,
          fillColor: '#00bfff',
          fillOpacity: 0.3
        },
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error in proximity analysis:', error);
      throw error;
    }
  };
  
  // Define a custom type for our buffered feature
  interface BufferedFeature extends GeoJSON.Feature {
    geometry: GeoJSON.Geometry & {
      buffer?: number;
    };
    properties: GeoJSON.GeoJsonProperties & {
      buffer?: boolean;
      distance?: number;
      units?: string;
    };
  }
  
  // Fallback buffer creation for demo purposes
  const createFallbackBuffer = (geojson: GeoJSON.FeatureCollection | GeoJSON.Feature, distance: number, units: string): BufferedFeature[] => {
    // Convert distance to meters
    let distanceInMeters = distance;
    if (units === 'miles') {
      distanceInMeters = distance * 1609.34;
    } else if (units === 'kilometers') {
      distanceInMeters = distance * 1000;
    }
    
    // Process features
    const features = 'features' in geojson ? geojson.features : [geojson];
    const bufferedFeatures: BufferedFeature[] = [];
    
    for (const feature of features) {
      if (feature.geometry.type === 'Point') {
        // Add buffer as a circle feature (simplified approach)
        bufferedFeatures.push({
          type: 'Feature',
          properties: {
            ...feature.properties,
            buffer: true,
            distance: distance,
            units: units
          },
          geometry: {
            type: 'Point',
            coordinates: feature.geometry.coordinates,
            buffer: distanceInMeters // Custom property for rendering
          }
        } as BufferedFeature);
      } else {
        // For other geometry types, just return as is
        // In a real implementation, we would use proper buffer algorithms
        bufferedFeatures.push(feature as BufferedFeature);
      }
    }
    
    return bufferedFeatures;
  };
  
  // Clear analysis results
  const clearResults = () => {
    setResults([]);
  };
  
  // Create a layer from result
  const addResultToLayers = (result: AnalysisResult) => {
    const newLayer: Layer = {
      id: `analysis-${result.id}`,
      name: result.name,
      type: 'geojson',
      visible: true,
      data: result.layer,
      style: result.style,
      zIndex: layers.length + 1,
      metadata: {
        analysisType: result.type,
        analysisMetadata: result.metadata,
        createdAt: result.createdAt
      }
    };
    
    onAddResultToLayers?.(newLayer);
  };
  
  // Handle settings changes
  const updateSetting = (
    key: keyof AnalysisSetting, 
    value: AnalysisSetting[typeof key]
  ) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Render analysis settings based on type
  const renderAnalysisSettings = () => {
    switch (analysisType) {
      case 'overlay':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="source-layer" className="text-sm font-medium mb-1 block">
                Source Layer
              </Label>
              <Select
                value={selectedLayers.source}
                onValueChange={(value: string) => setSelectedLayers({...selectedLayers, source: value})}
              >
                <SelectTrigger id="source-layer" className="w-full">
                  <SelectValue placeholder="Select source layer" />
                </SelectTrigger>
                <SelectContent>
                  {layers.map(layer => (
                    <SelectItem key={layer.id} value={layer.id}>
                      {layer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                The layer to analyze
              </p>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="target-layer" className="text-sm font-medium mb-1 block">
                Target Layer (Optional)
              </Label>
              <Select
                value={selectedLayers.target}
                onValueChange={(value: string) => setSelectedLayers({...selectedLayers, target: value})}
              >
                <SelectTrigger id="target-layer" className="w-full">
                  <SelectValue placeholder="Select target layer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {layers.map(layer => (
                    <SelectItem key={layer.id} value={layer.id}>
                      {layer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                The layer to overlay against (e.g. environmental areas)
              </p>
            </div>
          </>
        );
      
      case 'buffer':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="source-layer" className="text-sm font-medium mb-1 block">
                Source Layer
              </Label>
              <Select
                value={selectedLayers.source}
                onValueChange={(value: string) => setSelectedLayers({...selectedLayers, source: value})}
              >
                <SelectTrigger id="source-layer" className="w-full">
                  <SelectValue placeholder="Select source layer" />
                </SelectTrigger>
                <SelectContent>
                  {layers.map(layer => (
                    <SelectItem key={layer.id} value={layer.id}>
                      {layer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="buffer-distance" className="text-sm font-medium mb-1 block">
                Buffer Distance
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="buffer-distance"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={settings.buffer}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateSetting('buffer', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <Select
                  value={settings.units}
                  onValueChange={(value: 'miles' | 'kilometers' | 'meters') => updateSetting('units', value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="miles">Miles</SelectItem>
                    <SelectItem value="kilometers">Kilometers</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The distance around features to create buffer
              </p>
            </div>
          </>
        );
      
      case 'density':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="source-layer" className="text-sm font-medium mb-1 block">
                Source Layer
              </Label>
              <Select
                value={selectedLayers.source}
                onValueChange={(value: string) => setSelectedLayers({...selectedLayers, source: value})}
              >
                <SelectTrigger id="source-layer" className="w-full">
                  <SelectValue placeholder="Select source layer" />
                </SelectTrigger>
                <SelectContent>
                  {layers.map(layer => (
                    <SelectItem key={layer.id} value={layer.id}>
                      {layer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="density-radius" className="text-sm font-medium mb-1 block">
                Density Radius
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="density-radius"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={settings.radius}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateSetting('radius', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <Select
                  value={settings.units}
                  onValueChange={(value: 'miles' | 'kilometers' | 'meters') => updateSetting('units', value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="miles">Miles</SelectItem>
                    <SelectItem value="kilometers">Kilometers</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The radius to use for density calculation
              </p>
            </div>
          </>
        );
      
      case 'intersection':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="source-layer" className="text-sm font-medium mb-1 block">
                Source Layer
              </Label>
              <Select
                value={selectedLayers.source}
                onValueChange={(value: string) => setSelectedLayers({...selectedLayers, source: value})}
              >
                <SelectTrigger id="source-layer" className="w-full">
                  <SelectValue placeholder="Select source layer" />
                </SelectTrigger>
                <SelectContent>
                  {layers.map(layer => (
                    <SelectItem key={layer.id} value={layer.id}>
                      {layer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="target-layer" className="text-sm font-medium mb-1 block">
                Target Layer
              </Label>
              <Select
                value={selectedLayers.target}
                onValueChange={(value: string) => setSelectedLayers({...selectedLayers, target: value})}
              >
                <SelectTrigger id="target-layer" className="w-full">
                  <SelectValue placeholder="Select target layer" />
                </SelectTrigger>
                <SelectContent>
                  {layers.map(layer => (
                    <SelectItem key={layer.id} value={layer.id}>
                      {layer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                The layer to find intersections with
              </p>
            </div>
          </>
        );
      
      case 'proximity':
        return (
          <>
            <div className="mb-4">
              <Label htmlFor="source-layer" className="text-sm font-medium mb-1 block">
                Source Layer
              </Label>
              <Select
                value={selectedLayers.source}
                onValueChange={(value: string) => setSelectedLayers({...selectedLayers, source: value})}
              >
                <SelectTrigger id="source-layer" className="w-full">
                  <SelectValue placeholder="Select source layer" />
                </SelectTrigger>
                <SelectContent>
                  {layers.map(layer => (
                    <SelectItem key={layer.id} value={layer.id}>
                      {layer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="target-layer" className="text-sm font-medium mb-1 block">
                Target Layer
              </Label>
              <Select
                value={selectedLayers.target}
                onValueChange={(value: string) => setSelectedLayers({...selectedLayers, target: value})}
              >
                <SelectTrigger id="target-layer" className="w-full">
                  <SelectValue placeholder="Select target layer" />
                </SelectTrigger>
                <SelectContent>
                  {layers.map(layer => (
                    <SelectItem key={layer.id} value={layer.id}>
                      {layer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="mb-4">
              <Label htmlFor="proximity-threshold" className="text-sm font-medium mb-1 block">
                Proximity Threshold
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="proximity-threshold"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={settings.threshold}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => updateSetting('threshold', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <Select
                  value={settings.units}
                  onValueChange={(value: 'miles' | 'kilometers' | 'meters') => updateSetting('units', value)}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue placeholder="Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="miles">Miles</SelectItem>
                    <SelectItem value="kilometers">Kilometers</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The maximum distance between features
              </p>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <Card className={`border shadow-sm ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium flex items-center">
          <MapIcon className="h-5 w-5 mr-2 text-blue-500" />
          Geospatial Analysis
        </CardTitle>
        <CardDescription>
          Analyze spatial relationships and patterns in your map data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="results">
              Results ({results.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis">
            <div className="space-y-4">
              <div className="mb-4">
                <Label htmlFor="analysis-type" className="text-sm font-medium mb-1 block">
                  Analysis Type
                </Label>
                <Select
                  value={analysisType}
                  onValueChange={(value: string) => setAnalysisType(value as AnalysisType)}
                >
                  <SelectTrigger id="analysis-type" className="w-full">
                    <SelectValue placeholder="Select analysis type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overlay">Spatial Overlay</SelectItem>
                    <SelectItem value="buffer">Buffer Analysis</SelectItem>
                    <SelectItem value="density">Density Heatmap</SelectItem>
                    <SelectItem value="intersection">Intersection Analysis</SelectItem>
                    <SelectItem value="proximity">Proximity Analysis</SelectItem>
                  </SelectContent>
                </Select>
                
                {analysisType === 'overlay' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Find features that fall within or intersect other areas (e.g., projects in environmentally sensitive zones)
                  </p>
                )}
                
                {analysisType === 'buffer' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Create buffer zones around features to analyze impact areas
                  </p>
                )}
                
                {analysisType === 'density' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Generate heatmaps showing concentration of features
                  </p>
                )}
                
                {analysisType === 'intersection' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Find areas where two layers overlap
                  </p>
                )}
                
                {analysisType === 'proximity' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Find features that are within a certain distance of other features
                  </p>
                )}
              </div>
              
              {renderAnalysisSettings()}
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
                  <div className="flex items-center text-red-800 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {error}
                  </div>
                </div>
              )}
              
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={runAnalysis}
                  disabled={isLoading || !selectedLayers.source}
                  className="flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Running Analysis...
                    </>
                  ) : (
                    <>
                      <Activity className="h-4 w-4 mr-2" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="results">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Label htmlFor="show-results" className="text-sm cursor-pointer flex items-center">
                    <Switch
                      id="show-results"
                      checked={showResults}
                      onCheckedChange={setShowResults}
                      className="mr-2"
                    />
                    Show Results on Map
                  </Label>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearResults}
                  disabled={results.length === 0}
                >
                  Clear All Results
                </Button>
              </div>
              
              {results.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No analysis results yet</p>
                  <p className="text-sm mt-1">Run an analysis to see results here</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {results.map((result) => (
                    <div 
                      key={result.id}
                      className="p-3 border rounded-md bg-white hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="h-4 w-4 rounded-full mr-2"
                            style={{ backgroundColor: result.style.fillColor || result.style.color }}
                          ></div>
                          <span className="text-sm font-medium">{result.name}</span>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addResultToLayers(result)}
                          title="Add to Layers"
                        >
                          <Layers className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        {new Date(result.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 