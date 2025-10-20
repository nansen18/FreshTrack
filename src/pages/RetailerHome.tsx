import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Tag,
  Loader2,
  Heart,
  Leaf,
  ArrowRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays } from 'date-fns';
import RetailerAnalytics from '@/components/RetailerAnalytics';
import FreshnessDetector from '@/components/FreshnessDetector';

interface Product {
  id: string;
  name: string;
  expiry_date: string;
  discounted: boolean;
  discount: number;
}

export default function RetailerHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFreshness, setShowFreshness] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('retailer_products')
        .select('*')
        .eq('retailer_id', user.id)
        .order('expiry_date');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading products",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: products.length,
    expiringSoon: products.filter(p => {
      const days = differenceInDays(new Date(p.expiry_date), new Date());
      return days <= 5 && days >= 0;
    }).length,
    discounted: products.filter(p => p.discounted).length,
    avgDiscount: products.filter(p => p.discounted).length > 0 
      ? Math.round(
          products.filter(p => p.discounted)
            .reduce((sum, p) => sum + (p.discount || 0), 0) / 
          products.filter(p => p.discounted).length
        )
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome to FreshTrack</h1>
        <p className="text-muted-foreground">
          Manage your inventory, reduce waste, and maximize sustainability
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/inventory')}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">{stats.expiringSoon}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Tag className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Discounted</p>
                <p className="text-2xl font-bold">{stats.discounted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Discount</p>
                <p className="text-2xl font-bold">{stats.avgDiscount}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Freshness Detector */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                AI Freshness Detector
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Use AI to analyze produce freshness instantly
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFreshness(!showFreshness)}
            >
              {showFreshness ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {showFreshness && (
          <CardContent>
            <FreshnessDetector />
          </CardContent>
        )}
      </Card>

      {/* Performance Analytics */}
      <RetailerAnalytics retailerId={user?.id} />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/inventory')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Package className="h-10 w-10 text-primary" />
                <div>
                  <h3 className="font-semibold">Manage Inventory</h3>
                  <p className="text-sm text-muted-foreground">Add and track products</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/reverse-commerce')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Heart className="h-10 w-10 text-green-500" />
                <div>
                  <h3 className="font-semibold">Reverse Commerce</h3>
                  <p className="text-sm text-muted-foreground">Donate & compost items</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}