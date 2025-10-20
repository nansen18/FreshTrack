import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Scan, AlertTriangle, CheckCircle, Clock, Image as ImageIcon, Loader2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createWorker } from 'tesseract.js';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

interface Product {
  name: string;
  brand: string;
  category: string;
  suggestedAction: 'use-soon' | 'safe' | 'expired';
  estimatedShelfLife: number; // days
}

interface NutritionData {
  calories?: number;
  sugar?: number;
  protein?: number;
  fat?: number;
  fiber?: number;
  carbohydrates?: number;
  sodium?: number;
  health_score?: string;
  ai_feedback?: string;
}

interface BarcodeScannerProps {
  onScanSuccess: (productData: Product & { barcode: string }) => void;
  onClose: () => void;
}

type ScanMode = 'barcode' | 'image';

// Mock product database (in real app, this would be an API call)
const mockProductDatabase: Record<string, Product> = {
  '8901030804521': {
    name: 'Organic Whole Wheat Bread',
    brand: 'Mother Dairy',
    category: 'Bakery',
    suggestedAction: 'use-soon',
    estimatedShelfLife: 5
  },
  '8901030702024': {
    name: 'Fresh Milk',
    brand: 'Amul',
    category: 'Dairy',
    suggestedAction: 'use-soon',
    estimatedShelfLife: 7
  },
  '8902519005410': {
    name: 'Basmati Rice',
    brand: 'India Gate',
    category: 'Grains',
    suggestedAction: 'safe',
    estimatedShelfLife: 365
  },
  '8901030804538': {
    name: 'Greek Yogurt',
    brand: 'Epigamia',
    category: 'Dairy',
    suggestedAction: 'use-soon',
    estimatedShelfLife: 14
  },
  '8906010351013': {
    name: 'Mixed Fruit Jam',
    brand: 'Kissan',
    category: 'Spreads',
    suggestedAction: 'safe',
    estimatedShelfLife: 180
  }
};

export default function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [productData, setProductData] = useState<Product | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>('barcode');
  const [isProcessing, setIsProcessing] = useState(false);
  const [dateCandidates, setDateCandidates] = useState<Date[]>([]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [detectedProductName, setDetectedProductName] = useState('');
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [loadingNutrition, setLoadingNutrition] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Cache for nutrition data
  const nutritionCache = useRef<Map<string, NutritionData>>(new Map());

  useEffect(() => {
    if (scanMode === 'barcode') {
      startScanner();
    }
    return () => {
      stopScanner();
    };
  }, [scanMode]);

  const startScanner = () => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      showTorchButtonIfSupported: true,
      showZoomSliderIfSupported: true,
      defaultZoomValueIfSupported: 2
    };

    const scanner = new Html5QrcodeScanner("qr-reader", config, false);
    
    scanner.render(
      (decodedText) => {
        handleScanSuccess(decodedText);
      },
      (error) => {
        console.log("Scan attempt failed:", error);
      }
    );

    scannerRef.current = scanner;
    setIsScanning(true);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear();
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const calculateStatus = (expiryDate: Date): 'use-soon' | 'safe' | 'expired' => {
    const daysUntilExpiry = differenceInDays(expiryDate, new Date());
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 3) return 'use-soon';
    return 'safe';
  };

  const preprocessImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Resize for better OCR (max 2000px width)
        const scale = Math.min(2000 / img.width, 2000 / img.height, 1);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Draw and enhance
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Convert to grayscale and enhance contrast
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          // Enhance contrast
          const enhanced = gray < 128 ? Math.max(0, gray - 30) : Math.min(255, gray + 30);
          data[i] = data[i + 1] = data[i + 2] = enhanced;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const parseDateFromText = (text: string): Date[] => {
    const foundDates: Date[] = [];
    
    // Enhanced date patterns
    const patterns = [
      // EXP/EXPIRY/EXPIRES/BEST BEFORE/USE BY with dates
      /(?:exp(?:iry)?|expires?|best\s*before|use\s*by)[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/gi,
      // MFG/MANUFACTURED with dates
      /(?:mfg|manufactured|mfd|production\s*date)[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/gi,
      // YYYY-MM-DD format
      /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/g,
      // MM/DD/YYYY or DD/MM/YYYY (standalone)
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/g,
      // DD-MM-YY or MM-DD-YY
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})\b/g,
    ];

    const textLines = text.split('\n');
    
    for (const pattern of patterns) {
      const isMfgPattern = pattern.source.includes('mfg|manufactured');
      const isYYYYFirst = pattern.source.startsWith('(\\d{4})');
      let match;
      
      // Reset regex
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        try {
          let day, month, year;
          
          if (isYYYYFirst) {
            [, year, month, day] = match;
          } else {
            [, day, month, year] = match;
          }
          
          // Handle 2-digit years
          if (year.length === 2) {
            const currentYear = new Date().getFullYear();
            const currentCentury = Math.floor(currentYear / 100) * 100;
            const yearNum = parseInt(year);
            // If year is 00-50, assume 2000s, else 1900s
            year = String(yearNum <= 50 ? currentCentury + yearNum : currentCentury - 100 + yearNum);
          }

          // Try DD/MM/YYYY first
          let dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          let date = new Date(dateStr);
          
          // If invalid, try MM/DD/YYYY
          if (isNaN(date.getTime())) {
            dateStr = `${year}-${day.padStart(2, '0')}-${month.padStart(2, '0')}`;
            date = new Date(dateStr);
          }
          
          if (!isNaN(date.getTime()) && date.getFullYear() > 2000 && date.getFullYear() < 2100) {
            // If manufacture date, add 1 year shelf life
            if (isMfgPattern) {
              date.setFullYear(date.getFullYear() + 1);
            }
            
            // Only add future dates or recent past (max 1 month old)
            const daysDiff = differenceInDays(date, new Date());
            if (daysDiff > -30) {
              foundDates.push(date);
            }
          }
        } catch (e) {
          continue;
        }
      }
    }
    
    // Remove duplicates
    const uniqueDates = Array.from(new Set(foundDates.map(d => d.getTime())))
      .map(t => new Date(t))
      .sort((a, b) => a.getTime() - b.getTime());
    
    return uniqueDates;
  };

  const extractProductName = (text: string): string => {
    // Remove common patterns and get meaningful text
    const cleaned = text
      .replace(/(?:exp|expiry|expires|best before|use by|mfg|manufactured|mfd)[:\s]*\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/gi, '')
      .replace(/barcode|batch|lot|net weight|ingredients/gi, '');
    
    const lines = cleaned.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 3 && line.length < 50)
      .filter(line => !/^\d+$/.test(line)); // Remove pure numbers
    
    return lines[0] || "Scanned Product";
  };

  const fetchNutritionData = async (barcode: string, productName?: string): Promise<NutritionData | null> => {
    // Check cache first
    if (nutritionCache.current.has(barcode)) {
      return nutritionCache.current.get(barcode)!;
    }

    try {
      setLoadingNutrition(true);
      const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutriments = product.nutriments || {};

        // Calculate health score
        const sugar = nutriments['sugars_100g'] || 0;
        const sodium = nutriments['sodium_100g'] ? nutriments['sodium_100g'] * 1000 : 0; // Convert to mg
        const fat = nutriments['fat_100g'] || 0;
        
        let health_score = 'good';
        let ai_feedback = 'Balanced nutrition profile.';
        
        if (sugar > 15 || sodium > 500 || fat > 20) {
          health_score = 'high-risk';
          if (sugar > 15) ai_feedback = 'High sugar – consume moderately!';
          else if (sodium > 500) ai_feedback = 'High sodium – watch your salt intake!';
          else ai_feedback = 'High fat content – enjoy in moderation!';
        } else if (sugar > 10 || sodium > 300 || fat > 15) {
          health_score = 'moderate';
          ai_feedback = 'Moderate nutritional profile – balanced diet recommended.';
        } else if ((nutriments['proteins_100g'] || 0) > 10 && (nutriments['fiber_100g'] || 0) > 5) {
          ai_feedback = 'Great source of protein and fiber! 🌟';
        }

        const nutritionData: NutritionData = {
          calories: nutriments['energy-kcal_100g'] || nutriments['energy-kcal'],
          sugar: sugar,
          protein: nutriments['proteins_100g'] || nutriments['proteins'],
          fat: fat,
          fiber: nutriments['fiber_100g'] || nutriments['fiber'],
          carbohydrates: nutriments['carbohydrates_100g'] || nutriments['carbohydrates'],
          sodium: sodium,
          health_score,
          ai_feedback,
        };

        // Cache the result
        nutritionCache.current.set(barcode, nutritionData);
        setNutritionData(nutritionData);
        return nutritionData;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      return null;
    } finally {
      setLoadingNutrition(false);
    }
  };

  const saveItemToSupabase = async (name: string, expiryDate: Date, barcode?: string, nutrition?: NutritionData | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to add items.",
          variant: "destructive",
        });
        return;
      }

      const status = calculateStatus(expiryDate);
      const purchaseDate = new Date().toISOString().split('T')[0];
      const expiryDateStr = expiryDate.toISOString().split('T')[0];

      const { error } = await supabase
        .from('items')
        .insert({
          user_id: user.id,
          name: name,
          purchase_date: purchaseDate,
          expiry_date: expiryDateStr,
          consumed: false,
          barcode: barcode || null,
          calories: nutrition?.calories || null,
          sugar: nutrition?.sugar || null,
          protein: nutrition?.protein || null,
          fat: nutrition?.fat || null,
          fiber: nutrition?.fiber || null,
          carbohydrates: nutrition?.carbohydrates || null,
          sodium: nutrition?.sodium || null,
          health_score: nutrition?.health_score || null,
          ai_feedback: nutrition?.ai_feedback || null,
        });

      if (error) throw error;

      // Show status-based message
      let statusMessage = '';
      if (status === 'expired') {
        statusMessage = '⚠️ Expired – Remove or Mark Wasted';
      } else if (status === 'use-soon') {
        statusMessage = '⏰ Use Soon – Expiring in 3 days or less';
      } else {
        statusMessage = '✅ Safe to Store';
      }

      toast({
        title: `✅ Added ${name}`,
        description: `Expiring on ${expiryDate.toLocaleDateString()}. ${statusMessage}`,
      });

      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Error",
        description: "Failed to save item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const performOCR = async (imageData: string, rotation = 0): Promise<string> => {
    const worker = await createWorker('eng');
    
    if (rotation !== 0) {
      // Rotate image if needed
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = imageData;
      });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed');
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      imageData = canvas.toDataURL('image/png');
    }
    
    const { data: { text } } = await worker.recognize(imageData);
    await worker.terminate();
    return text;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setDateCandidates([]);
    setShowManualEntry(false);
    
    toast({
      title: "Processing Image",
      description: "Analyzing product label with OCR...",
    });

    try {
      // Preprocess image
      const preprocessed = await preprocessImage(file);
      
      // Try OCR with different rotations
      const rotations = [0, -5, 5, -10, 10];
      let allText = '';
      
      for (const rotation of rotations) {
        const text = await performOCR(preprocessed, rotation);
        allText += '\n' + text;
      }

      console.log('Combined OCR text:', allText);

      // Parse dates from all attempts
      const dates = parseDateFromText(allText);
      
      if (dates.length === 0) {
        setShowManualEntry(true);
        setDetectedProductName(extractProductName(allText));
        toast({
          title: "No Date Detected",
          description: "Please enter the expiry date manually.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      if (dates.length === 1) {
        // Only one date found, auto-save
        const productName = extractProductName(allText);
        await saveItemToSupabase(productName, dates[0], undefined, null);
      } else {
        // Multiple dates found, let user choose
        setDateCandidates(dates);
        setDetectedProductName(extractProductName(allText));
        toast({
          title: "Multiple Dates Found",
          description: "Please select the correct expiry date.",
        });
      }
      
      setIsProcessing(false);
    } catch (error) {
      console.error('OCR processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to extract text. Please try again or enter manually.",
        variant: "destructive",
      });
      setShowManualEntry(true);
      setIsProcessing(false);
    }
  };

  const handleManualDateSubmit = async () => {
    if (!manualDate) {
      toast({
        title: "Date Required",
        description: "Please enter an expiry date.",
        variant: "destructive",
      });
      return;
    }
    
    const date = new Date(manualDate);
    const productName = detectedProductName || "Scanned Product";
    await saveItemToSupabase(productName, date, undefined, null);
    setShowManualEntry(false);
    setManualDate('');
  };

  const handleDateCandidateSelect = async (date: Date) => {
    await saveItemToSupabase(detectedProductName, date, undefined, nutritionData);
    setDateCandidates([]);
  };

  const handleScanSuccess = async (barcode: string) => {
    setScanResult(barcode);
    stopScanner();
    
    // Fetch nutrition data from OpenFoodFacts
    const nutrition = await fetchNutritionData(barcode);
    
    // Look up product in mock database
    const product = mockProductDatabase[barcode];
    
    if (product) {
      setProductData(product);
      toast({
        title: "Product found!",
        description: `Scanned: ${product.name} by ${product.brand}`
      });
    } else {
      // Create a generic product for unknown barcodes
      const genericProduct: Product = {
        name: `Product ${barcode.slice(-6)}`,
        brand: 'Unknown Brand',
        category: 'General',
        suggestedAction: 'safe',
        estimatedShelfLife: 30
      };
      setProductData(genericProduct);
      toast({
        title: "Barcode scanned!",
        description: "Product not in database. Please enter details manually.",
        variant: "destructive"
      });
    }
  };

  const handleUseProduct = () => {
    if (productData && scanResult) {
      onScanSuccess({
        ...productData,
        barcode: scanResult
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'use-soon':
        return <Clock className="h-4 w-4" />;
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'use-soon':
        return 'bg-orange-500';
      case 'expired':
        return 'bg-destructive';
      default:
        return 'bg-green-500';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'use-soon':
        return 'Use Soon';
      case 'expired':
        return 'Check Date';
      default:
        return 'Safe to Store';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Scan className="h-5 w-5" />
            {scanMode === 'barcode' ? 'Barcode Scanner' : 'Image OCR Scanner'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scan Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={scanMode === 'barcode' ? 'default' : 'outline'}
              onClick={() => {
                setScanMode('barcode');
                setScanResult(null);
                setProductData(null);
              }}
              className="flex-1"
              disabled={isProcessing}
            >
              <Scan className="h-4 w-4 mr-2" />
              Barcode
            </Button>
            <Button
              variant={scanMode === 'image' ? 'default' : 'outline'}
              onClick={() => {
                setScanMode('image');
                stopScanner();
                setScanResult(null);
                setProductData(null);
              }}
              className="flex-1"
              disabled={isProcessing}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Photo OCR
            </Button>
          </div>

          {scanMode === 'image' ? (
            <div className="space-y-4">
              {!dateCandidates.length && !showManualEntry ? (
                <div className="text-center p-8 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-primary/50 transition-colors">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                      <p className="text-sm text-muted-foreground">Analyzing image with OCR...</p>
                      <p className="text-xs text-muted-foreground mt-2">This may take a few seconds</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Upload a clear photo of the product label.<br />
                        Make sure the expiry date is visible and well-lit.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Take Photo / Upload
                      </Button>
                    </>
                  )}
                </div>
              ) : dateCandidates.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-2">Select Expiry Date</h3>
                    <p className="text-sm text-muted-foreground">Multiple dates detected. Choose the correct one:</p>
                  </div>
                  <div className="space-y-2">
                    {dateCandidates.map((date, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleDateCandidateSelect(date)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <Badge className="ml-auto" variant={calculateStatus(date) === 'expired' ? 'destructive' : calculateStatus(date) === 'use-soon' ? 'default' : 'outline'}>
                          {calculateStatus(date) === 'expired' ? 'Expired' : calculateStatus(date) === 'use-soon' ? 'Use Soon' : 'Safe'}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setDateCandidates([]);
                      setShowManualEntry(true);
                    }}
                  >
                    None of these? Enter manually
                  </Button>
                </div>
              ) : showManualEntry ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                    <h3 className="font-semibold text-lg mb-2">Enter Date Manually</h3>
                    <p className="text-sm text-muted-foreground">No date detected in the image</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-date">Expiry Date</Label>
                    <Input
                      id="manual-date"
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={handleManualDateSubmit}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowManualEntry(false);
                        setManualDate('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
              
              {!isProcessing && !dateCandidates.length && !showManualEntry && (
                <p className="text-xs text-muted-foreground text-center">
                  Supports: EXP 12/03/2025, Best Before 12-03-25, MFG 01/01/2024, YYYY-MM-DD
                </p>
              )}
            </div>
          ) : (
            <>
              {!scanResult ? (
                <div>
                  <div id="qr-reader" className="mb-4"></div>
                  <p className="text-sm text-muted-foreground text-center">
                    Point your camera at a product barcode to scan
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {productData && (
                    <div className="space-y-3">
                      <div className="text-center">
                        <h3 className="font-semibold text-lg">{productData.name}</h3>
                        <p className="text-muted-foreground">{productData.brand}</p>
                        <Badge variant="outline" className="mt-2">
                          {productData.category}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2">
                        <Badge className={`${getActionColor(productData.suggestedAction)} text-white`}>
                          {getActionIcon(productData.suggestedAction)}
                          <span className="ml-1">{getActionText(productData.suggestedAction)}</span>
                        </Badge>
                      </div>
                      
                      <div className="text-center p-3 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Estimated shelf life:</strong> {productData.estimatedShelfLife} days
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Barcode: {scanResult}
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm font-medium">AI Recommendation:</p>
                        <p className="text-sm text-muted-foreground">
                          {productData.suggestedAction === 'use-soon' 
                            ? "This product should be consumed within a few days. Consider meal planning!"
                            : productData.suggestedAction === 'expired'
                            ? "Check the expiry date carefully before consuming."
                            : "This product has a good shelf life. Store properly for best results."
                          }
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button onClick={handleUseProduct} className="flex-1">
                      Use This Product
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setScanResult(null);
                      setProductData(null);
                      startScanner();
                    }}>
                      Scan Again
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
