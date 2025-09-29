import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Store, 
  Package, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Plus,
  LogOut,
  BarChart3,
  Leaf,
  Users,
  Calendar,
  Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';

interface RetailerProduct {
  id: string;
  name: string;
  expiry_date: string;
  discounted: boolean;
  discount: number;
  created_at: string;
}

export default function RetailerDashboard() {
  const [products, setProducts] = useState<RetailerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    expiry_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    discount: 0
  });
  
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (profile && profile.role !== 'retailer') {
      navigate('/dashboard');
      return;
    }

    fetchProducts();
  }, [user, profile, navigate]);

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

  const addProduct = async () => {
    if (!user || !newProduct.name || !newProduct.expiry_date) return;
    
    try {
      const { error } = await supabase
        .from('retailer_products')
        .insert([{
          retailer_id: user.id,
          name: newProduct.name,
          expiry_date: newProduct.expiry_date,
          discount: newProduct.discount,
          discounted: newProduct.discount > 0
        }]);

      if (error) throw error;
      
      toast({
        title: "Product added successfully!",
        description: `${newProduct.name} has been added to your inventory.`
      });
      
      setNewProduct({ name: '', expiry_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'), discount: 0 });
      setShowAddForm(false);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error adding product",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleDiscount = async (productId: string, currentDiscount: number, currentDiscounted: boolean) => {
    try {
      const newDiscount = currentDiscounted ? 0 : 20;
      const { error } = await supabase
        .from('retailer_products')
        .update({ 
          discount: newDiscount,
          discounted: !currentDiscounted 
        })
        .eq('id', productId);

      if (error) throw error;
      
      toast({
        title: currentDiscounted ? "Discount removed" : "Discount applied",
        description: currentDiscounted ? "Product returned to regular price" : `20% discount applied to product`
      });
      
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error updating discount",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getProductStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'bg-destructive', text: 'Expired' };
    if (daysUntilExpiry <= 2) return { status: 'critical', color: 'bg-orange-500', text: 'Critical' };
    if (daysUntilExpiry <= 5) return { status: 'warning', color: 'bg-yellow-500', text: 'Warning' };
    return { status: 'safe', color: 'bg-green-500', text: 'Safe' };
  };

  const stats = {
    total: products.length,
    expiringSoon: products.filter(p => {
      const days = differenceInDays(new Date(p.expiry_date), new Date());
      return days <= 5 && days >= 0;
    }).length,
    discounted: products.filter(p => p.discounted).length,
    revenue: products.filter(p => p.discounted).reduce((sum, p) => sum + (p.discount || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Retailer Navigation */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Retailer Dashboard</h1>
              <Badge variant="outline" className="ml-2 text-xs">Retailer</Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden md:block">
                Manage your inventory
              </span>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                <Users className="h-4 w-4 mr-2" />
                Community
              </Button>
              <Button variant="outline" onClick={() => navigate('/reports')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
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

          <Card>
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

          <Card>
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

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <TrendingUp className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Discount</p>
                  <p className="text-2xl font-bold">{stats.discounted > 0 ? Math.round(stats.revenue / stats.discounted) : 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Product Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Product Inventory</h2>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>

        {/* Add Product Form */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New Product</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="product-name">Product Name</Label>
                  <Input
                    id="product-name"
                    placeholder="Enter product name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="expiry-date">Expiry Date</Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={newProduct.expiry_date}
                    onChange={(e) => setNewProduct({ ...newProduct, expiry_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="discount">Initial Discount (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={newProduct.discount}
                    onChange={(e) => setNewProduct({ ...newProduct, discount: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addProduct}>Add Product</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products List */}
        <div className="grid gap-4">
          {products.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No products yet. Add your first product to get started!</p>
              </CardContent>
            </Card>
          ) : (
            products.map((product) => {
              const status = getProductStatus(product.expiry_date);
              const daysUntilExpiry = differenceInDays(new Date(product.expiry_date), new Date());
              
              return (
                <Card key={product.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{product.name}</h3>
                           <Badge 
                             variant="secondary" 
                             className={
                               status.status === 'expired' ? 'bg-destructive text-destructive-foreground' :
                               status.status === 'critical' ? 'bg-orange-500 text-white' :
                               status.status === 'warning' ? 'bg-yellow-500 text-black' :
                               'bg-green-500 text-white'
                             }
                           >
                             {status.text}
                           </Badge>
                          {product.discounted && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              {product.discount}% OFF
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Expires: {format(new Date(product.expiry_date), 'MMM dd, yyyy')}</span>
                          </div>
                          <div>
                            {daysUntilExpiry >= 0 ? `${daysUntilExpiry} days left` : `Expired ${Math.abs(daysUntilExpiry)} days ago`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {daysUntilExpiry <= 5 && daysUntilExpiry >= 0 && (
                          <Button
                            variant={product.discounted ? "destructive" : "default"}
                            size="sm"
                            onClick={() => toggleDiscount(product.id, product.discount || 0, product.discounted || false)}
                          >
                            {product.discounted ? "Remove Discount" : "Apply Discount"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}