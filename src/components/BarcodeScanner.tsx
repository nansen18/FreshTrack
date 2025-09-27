import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Scan, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

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
        // Success callback
        handleScanSuccess(decodedText);
      },
      (error) => {
        // Error callback - we can ignore these as they're just failed attempts
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
            Barcode Scanner
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}