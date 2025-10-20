import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Heart, 
  Leaf, 
  Loader2, 
  CheckCircle, 
  Clock, 
  Package,
  TrendingUp
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

interface Product {
  id: string;
  name: string;
  expiry_date: string;
  discounted: boolean;
}

interface ReverseCommerceItem {
  id: string;
  product_id: string;
  product_name: string;
  category: 'donate' | 'compost';
  status: 'pending' | 'collected' | 'completed';
  expiry_date: string;
  ai_reasoning: string;
  co2_saved: number;
  created_at: string;
}

interface ReverseCommerceHubProps {
  retailerId: string;
}

export default function ReverseCommerceHub({ retailerId }: ReverseCommerceHubProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [reverseItems, setReverseItems] = useState<ReverseCommerceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [classifying, setClassifying] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [retailerId]);

  const fetchData = async () => {
    try {
      // Fetch expired/near-expiry products
      const { data: productsData, error: productsError } = await supabase
        .from('retailer_products')
        .select('*')
        .eq('retailer_id', retailerId)
        .order('expiry_date');

      if (productsError) throw productsError;

      // Filter products that are expired or expiring in 2 days
      const eligibleProducts = (productsData || []).filter(p => {
        const days = differenceInDays(new Date(p.expiry_date), new Date());
        return days <= 2;
      });

      setProducts(eligibleProducts);

      // Fetch reverse commerce items
      const { data: itemsData, error: itemsError } = await supabase
        .from('reverse_commerce_items')
        .select('*')
        .eq('retailer_id', retailerId)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      setReverseItems((itemsData || []) as ReverseCommerceItem[]);
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const classifyProduct = async (product: Product) => {
    setClassifying(product.id);
    try {
      const daysUntilExpiry = differenceInDays(new Date(product.expiry_date), new Date());
      
      const { data, error } = await supabase.functions.invoke('classify-reverse-commerce', {
        body: {
          productName: product.name,
          expiryDate: product.expiry_date,
          daysUntilExpiry
        }
      });

      if (error) throw error;

      // Create reverse commerce item
      const { error: insertError } = await supabase
        .from('reverse_commerce_items')
        .insert({
          retailer_id: retailerId,
          product_id: product.id,
          product_name: product.name,
          category: data.category,
          expiry_date: product.expiry_date,
          ai_reasoning: data.reasoning,
          co2_saved: data.co2_saved
        });

      if (insertError) throw insertError;

      toast({
        title: "Product classified!",
        description: `${product.name} categorized for ${data.category === 'donate' ? 'donation' : 'composting'}`
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Classification failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setClassifying(null);
    }
  };

  const updateStatus = async (itemId: string, newStatus: 'collected' | 'completed') => {
    try {
      const { error } = await supabase
        .from('reverse_commerce_items')
        .update({ status: newStatus })
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Item marked as ${newStatus}`
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const stats = {
    totalDonated: reverseItems.filter(i => i.category === 'donate').length,
    totalComposted: reverseItems.filter(i => i.category === 'compost').length,
    co2Saved: reverseItems.reduce((sum, i) => sum + (i.co2_saved || 0), 0).toFixed(1)
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'collected': return <Package className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'collected': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading Reverse Commerce Hub...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reverse Commerce Hub</h2>
        <Badge variant="outline" className="text-sm">
          Reduce • Reuse • Recycle
        </Badge>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Items Donated</p>
                <p className="text-2xl font-bold">{stats.totalDonated}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[hsl(30,70%,45%)]/20 bg-[hsl(30,70%,45%)]/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Leaf className="h-8 w-8 text-[hsl(30,70%,45%)]" />
              <div>
                <p className="text-sm text-muted-foreground">Items Composted</p>
                <p className="text-2xl font-bold">{stats.totalComposted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">CO₂ Saved</p>
                <p className="text-2xl font-bold">{stats.co2Saved} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products to Classify */}
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="text-lg">Products Ready for Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No products ready for classification
              </p>
            ) : (
              products.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Expires: {format(new Date(product.expiry_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => classifyProduct(product)}
                    disabled={classifying === product.id}
                  >
                    {classifying === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Classify'
                    )}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Classified Items */}
        <div className="space-y-4">
          {/* Donation Items */}
          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="h-5 w-5 text-green-500" />
                Donation Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reverseItems.filter(i => i.category === 'donate').length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No donation items yet</p>
              ) : (
                reverseItems.filter(i => i.category === 'donate').map(item => (
                  <div key={item.id} className="p-3 bg-background border border-green-500/20 rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">{item.ai_reasoning}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          {item.status}
                        </span>
                      </Badge>
                    </div>
                    {item.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => updateStatus(item.id, 'collected')}
                      >
                        Mark as Collected
                      </Button>
                    )}
                    {item.status === 'collected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => updateStatus(item.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Compost Items */}
          <Card className="border-[hsl(30,70%,45%)]/30 bg-[hsl(30,70%,45%)]/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Leaf className="h-5 w-5 text-[hsl(30,70%,45%)]" />
                Compost Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {reverseItems.filter(i => i.category === 'compost').length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No compost items yet</p>
              ) : (
                reverseItems.filter(i => i.category === 'compost').map(item => (
                  <div key={item.id} className="p-3 bg-background border border-[hsl(30,70%,45%)]/20 rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.product_name}</p>
                        <p className="text-xs text-muted-foreground">{item.ai_reasoning}</p>
                      </div>
                      <Badge variant="outline" className={getStatusColor(item.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(item.status)}
                          {item.status}
                        </span>
                      </Badge>
                    </div>
                    {item.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => updateStatus(item.id, 'collected')}
                      >
                        Mark as Collected
                      </Button>
                    )}
                    {item.status === 'collected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={() => updateStatus(item.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}