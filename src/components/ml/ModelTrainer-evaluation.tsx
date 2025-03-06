'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart3, 
  Save, 
  Download,
  Share2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Table as TableIcon,
} from 'lucide-react';
import { ModelConfig, ModelStatus, ModelEvaluationProps, ModelVersioningProps } from './ModelTrainer-types';

// Helper function to format percentages for display
const formatPercent = (value: number) => {
  return `${(value * 100).toFixed(2)}%`;
};

export function ModelEvaluation({
  evaluationResults,
  modelConfig,
  onSaveModel,
  isSaving,
}: ModelEvaluationProps) {
  if (!evaluationResults) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2" size={18} />
            Model Evaluation
          </CardTitle>
          <CardDescription>
            Train a model to see performance metrics and evaluation results
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No evaluation results available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2" size={18} />
          Model Evaluation
        </CardTitle>
        <CardDescription>
          Performance metrics and evaluation results for your trained model
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Performance Metrics */}
        <div>
          <h3 className="text-sm font-medium mb-3">Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-muted/40">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Accuracy</div>
                <div className="text-xl font-bold">{formatPercent(evaluationResults.accuracy)}</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/40">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Precision</div>
                <div className="text-xl font-bold">{formatPercent(evaluationResults.precision)}</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/40">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Recall</div>
                <div className="text-xl font-bold">{formatPercent(evaluationResults.recall)}</div>
              </CardContent>
            </Card>
            <Card className="bg-muted/40">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">F1 Score</div>
                <div className="text-xl font-bold">{formatPercent(evaluationResults.f1Score)}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div>
          <h3 className="text-sm font-medium mb-3">Confusion Matrix</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Predicted Success</TableHead>
                  <TableHead>Predicted Failure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Actual Success</TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {evaluationResults.confusionMatrix[0][0]} (True Positive)
                  </TableCell>
                  <TableCell className="text-red-600 font-medium">
                    {evaluationResults.confusionMatrix[0][1]} (False Negative)
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Actual Failure</TableCell>
                  <TableCell className="text-red-600 font-medium">
                    {evaluationResults.confusionMatrix[1][0]} (False Positive)
                  </TableCell>
                  <TableCell className="text-green-600 font-medium">
                    {evaluationResults.confusionMatrix[1][1]} (True Negative)
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Feature Importance */}
        <div>
          <h3 className="text-sm font-medium mb-3">Feature Importance</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature</TableHead>
                  <TableHead>Importance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluationResults.featureImportance.slice(0, 10).map((item) => (
                  <TableRow key={item.feature}>
                    <TableCell className="font-medium">
                      {item.feature.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full" 
                            style={{ width: `${item.importance * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatPercent(item.importance)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onSaveModel}
          disabled={isSaving || !modelConfig}
          className="w-full"
        >
          {isSaving ? (
            <>Saving Model...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Model
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ModelVersioning({
  savedModels,
  activeModel,
  onSelectModel,
  onDeleteModel,
  onExportModel,
  isLoading,
}: ModelVersioningProps) {
  const statusBadge = (status: ModelStatus) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Ready</Badge>;
      case 'training':
        return <Badge className="bg-blue-500"><AlertCircle className="h-3 w-3 mr-1" /> Training</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      case 'deprecated':
        return <Badge className="bg-yellow-500"><AlertCircle className="h-3 w-3 mr-1" /> Deprecated</Badge>;
      default:
        return <Badge><AlertCircle className="h-3 w-3 mr-1" /> Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TableIcon className="mr-2" size={18} />
          Model Versions
        </CardTitle>
        <CardDescription>
          View and manage saved model versions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">Loading saved models...</p>
          </div>
        ) : savedModels.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">No saved models found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Trained</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedModels.map((model) => (
                  <TableRow key={model.id} className={activeModel?.id === model.id ? 'bg-muted/50' : ''}>
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell>{model.version}</TableCell>
                    <TableCell>{model.modelType.split('_').join(' ')}</TableCell>
                    <TableCell>{model.accuracy ? formatPercent(model.accuracy) : 'N/A'}</TableCell>
                    <TableCell>{statusBadge(model.status)}</TableCell>
                    <TableCell>
                      {model.lastTrained
                        ? new Date(model.lastTrained).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSelectModel(model)}
                        >
                          Select
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onExportModel(model)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteModel(model.id!)}
                        >
                          <XCircle className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 