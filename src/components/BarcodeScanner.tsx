import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Scan, AlertTriangle, CheckCircle, Clock, Image as ImageIcon, Loader2 } from 'lucide-react';
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
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  const parseDateFromText = (text: string): Date | null => {
    // Common date patterns for expiry/manufacture dates
    const patterns = [
      // EXP: DD/MM/YYYY or EXP DD/MM/YY
      /(?:exp|expiry|expires|best before|use by)[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,
      // MFG: DD/MM/YYYY
      /(?:mfg|manufactured|mfd|production date)[:\s]*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/i,
      // Plain date DD/MM/YYYY or DD-MM-YYYY
      /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let [, day, month, year] = match;
        
        // Handle 2-digit years
        if (year.length === 2) {
          const currentYear = new Date().getFullYear();
          const currentCentury = Math.floor(currentYear / 100) * 100;
          year = String(currentCentury + parseInt(year));
        }

        try {
          // Create date in YYYY-MM-DD format
          const dateStr = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          const date = new Date(dateStr);
          
          if (!isNaN(date.getTime())) {
            // If it's a manufacture date, add typical shelf life
            if (pattern.source.includes('mfg|manufactured')) {
              date.setDate(date.getDate() + 365); // Add 1 year shelf life
            }
            return date;
          }
        } catch (e) {
          continue;
        }
      }
    }
    return null;
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

  const saveItemToSupabase = async (name: string, expiryDate: Date) => {
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

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    toast({
      title: "Processing Image",
      description: "Extracting text from product label...",
    });

    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      console.log('Extracted OCR text:', text);

      // Parse date from extracted text
      const expiryDate = parseDateFromText(text);
      
      if (!expiryDate) {
        toast({
          title: "Date Not Detected",
          description: "Could not find expiry date in image. Please enter manually or try another photo.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // Extract product name
      const productName = extractProductName(text);

      // Save to database
      await saveItemToSupabase(productName, expiryDate);
      setIsProcessing(false);
    } catch (error) {
      console.error('OCR processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Failed to extract text from image. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleScanSuccess = (barcode: string) => {
    setScanResult(barcode);
    stopScanner();
    
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
              <div className="text-center p-8 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-primary/50 transition-colors">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">Processing image...</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a clear photo of the product label.<br />
                      Make sure expiry date is visible.
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
              <p className="text-xs text-muted-foreground text-center">
                Supports formats like: EXP 12/03/2025, Best Before 12-03-25, MFG 01/01/2024
              </p>
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
