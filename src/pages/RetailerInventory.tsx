import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Package, 
  Plus, 
  Calendar, 
  Tag,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

interface Product {
  id: string;
  name: string;
  expiry_date: string;
  discounted: boolean;
  discount: number;
  created_at: string;
}

export default function RetailerInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    expiry_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    discount: 0
  });
  
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

  const addProduct = async () => {
    if (!user || !newProduct.name || !newProduct.expiry_date) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }
    
    setSubmitting(true);
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
        title: "Product added!",
        description: `${newProduct.name} has been added to your inventory.`
      });
      
      setNewProduct({ 
        name: '', 
        expiry_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'), 
        discount: 0 
      });
      setShowAddForm(false);
      fetchProducts();
    } catch (error: any) {
      toast({
        title: "Error adding product",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDiscount = async (productId: string, currentDiscounted: boolean) => {
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
        description: currentDiscounted 
          ? "Product returned to regular price" 
          : "20% discount applied"
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
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'bg-destructive', text: 'Expired' };
    if (daysUntilExpiry <= 2) return { status: 'critical', color: 'bg-orange-500', text: 'Critical' };
    if (daysUntilExpiry <= 5) return { status: 'warning', color: 'bg-yellow-500', text: 'Warning' };
    return { status: 'safe', color: 'bg-green-500', text: 'Safe' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Inventory</h1>
          <p className="text-muted-foreground">Manage your product catalog and expiry tracking</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Package className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{products.length}</p>
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
                <p className="text-2xl font-bold">
                  {products.filter(p => {
                    const days = differenceInDays(new Date(p.expiry_date), new Date());
                    return days <= 5 && days >= 0;
                  }).length}
                </p>
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
                <p className="text-2xl font-bold">
                  {products.filter(p => p.discounted).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <Card>
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
              <Button onClick={addProduct} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Product'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Products Grid */}
      <div className="grid gap-4">
        {products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No products yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first product to start tracking inventory
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
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
                        <h3 className="font-semibold text-lg">{product.name}</h3>
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
                          {daysUntilExpiry >= 0 
                            ? `${daysUntilExpiry} days left` 
                            : `Expired ${Math.abs(daysUntilExpiry)} days ago`
                          }
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {daysUntilExpiry <= 5 && daysUntilExpiry >= 0 && (
                        <Button
                          variant={product.discounted ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleDiscount(product.id, product.discounted)}
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
  );
}