import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, Loader2, AlertCircle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface FreshnessResult {
  freshness_level: 'fresh' | 'aging' | 'spoiled';
  freshness_score: number;
  product_name: string;
  description: string;
  shelf_life_days: number;
  storage_recommendation: string;
}

export default function FreshnessDetector() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<FreshnessResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number>(22);
  const [storageType, setStorageType] = useState<string>('room_temp');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processImage = async (file: File) => {
    setAnalyzing(true);
    setResult(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Convert to base64 for AI analysis
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('Calling analyze-freshness edge function...');
      
      const { data, error } = await supabase.functions.invoke('analyze-freshness', {
        body: { 
          imageBase64: base64,
          temperature,
          storageType
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(data?.error || error.message || "Couldn't detect freshness. Try another image.");
      }

      if (!data) {
        throw new Error('No response from freshness analysis');
      }

      console.log('Freshness analysis result:', data);
      setResult(data);

      // Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: dbError } = await supabase
          .from('freshness_checks')
          .insert({
            user_id: user.id,
            image_url: base64,
            freshness_level: data.freshness_level,
            freshness_score: data.freshness_score,
            ai_description: data.description,
            product_name: data.product_name || 'Unknown'
          });

        if (dbError) {
          console.error('Error saving to database:', dbError);
        }
      }

      toast({
        title: "Analysis Complete",
        description: `${data.product_name}: ${Math.round(data.freshness_score)}% fresh – ${data.shelf_life_days} days left`
      });
    } catch (error: any) {
      console.error('Error analyzing freshness:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      processImage(file);
    }
  };

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      await new Promise(resolve => {
        video.onloadedmetadata = resolve;
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      stream.getTracks().forEach(track => track.stop());

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          processImage(file);
        }
      }, 'image/jpeg', 0.95);
    } catch (error: any) {
      toast({
        title: "Camera Error",
        description: error.message || "Failed to access camera. Please use file upload instead.",
        variant: "destructive"
      });
    }
  };

  const getFreshnessColor = (level: string) => {
    switch (level) {
      case 'fresh': return 'bg-green-500';
      case 'aging': return 'bg-yellow-500';
      case 'spoiled': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getFreshnessIcon = (level: string) => {
    switch (level) {
      case 'fresh': return '🟢';
      case 'aging': return '🟡';
      case 'spoiled': return '🔴';
      default: return '⚪';
    }
  };

  const getFreshnessLabel = (level: string) => {
    switch (level) {
      case 'fresh': return 'Fresh';
      case 'aging': return 'Aging Soon';
      case 'spoiled': return 'Spoiled';
      default: return 'Unknown';
    }
  };

  const getShelfLifeColor = (days: number) => {
    if (days >= 5) return 'text-green-600 dark:text-green-400';
    if (days >= 2) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getShelfLifeEmoji = (days: number) => {
    if (days >= 5) return '🟢';
    if (days >= 2) return '🟡';
    return '🔴';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Freshness Detection
        </CardTitle>
        <CardDescription>
          Upload or capture an image of fruits or vegetables to analyze their freshness
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analyzing && !result && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium">Storage Temperature (°C)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold min-w-[3rem] text-right">{temperature}°C</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Storage Location</label>
                <select
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                >
                  <option value="refrigerated">Refrigerated (2-8°C)</option>
                  <option value="room_temp">Room Temperature</option>
                  <option value="pantry">Pantry/Cool Storage</option>
                  <option value="freezer">Freezer</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              <Button 
                onClick={handleCameraCapture}
                className="flex-1"
                variant="outline"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
            </div>
          </>
        )}

        {analyzing && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analyzing freshness...</p>
          </div>
        )}

        {result && previewImage && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={previewImage} 
                alt="Analyzed produce" 
                className="w-full h-auto max-h-64 object-contain bg-muted"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{result.product_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl">{getFreshnessIcon(result.freshness_level)}</span>
                    <Badge variant="secondary" className={getFreshnessColor(result.freshness_level) + " text-white"}>
                      {getFreshnessLabel(result.freshness_level)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {Math.round(result.freshness_score)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Fresh Score</div>
                </div>
              </div>

              <Progress value={result.freshness_score} className="h-2" />

              {/* Shelf Life Timeline */}
              <div className={`p-4 rounded-lg border-2 ${
                result.shelf_life_days >= 5 
                  ? 'bg-green-50 dark:bg-green-950/30 border-green-500' 
                  : result.shelf_life_days >= 2 
                  ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-500'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-500'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{getShelfLifeEmoji(result.shelf_life_days)}</span>
                    <div>
                      <div className={`text-2xl font-bold ${getShelfLifeColor(result.shelf_life_days)}`}>
                        {result.shelf_life_days} {result.shelf_life_days === 1 ? 'Day' : 'Days'} Left
                      </div>
                      <div className="text-xs text-muted-foreground">Estimated Shelf Life</div>
                    </div>
                  </div>
                  {result.shelf_life_days <= 2 && (
                    <Badge variant="destructive" className="animate-pulse">
                      Use Soon!
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-medium mt-2">
                  💡 {result.storage_recommendation}
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <p className="text-sm">{result.description}</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => {
                setResult(null);
                setPreviewImage(null);
              }}
              variant="outline"
              className="w-full"
            >
              Analyze Another
            </Button>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <p className="text-xs text-blue-900 dark:text-blue-200">
              <strong>Future Scope:</strong> IoT integration for real-time gas and moisture freshness detection coming soon!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
