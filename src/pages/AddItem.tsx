import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Leaf, Calendar, Package } from 'lucide-react';
import AIFoodAdvisor from '@/components/AIFoodAdvisor';
import CommunityHub from '@/components/CommunityHub';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { format } from 'date-fns';

const itemSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100, 'Product name must be less than 100 characters'),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  expiry_date: z.string().min(1, 'Expiry date is required')
});

export default function AddItem() {
  const [name, setName] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [expiryDate, setExpiryDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Pre-fill data from barcode scanner
  useEffect(() => {
    if (location.state) {
      const { productName, estimatedShelfLife } = location.state as any;
      if (productName) {
        setName(productName);
      }
      if (estimatedShelfLife) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + estimatedShelfLife);
        setExpiryDate(format(expiryDate, 'yyyy-MM-dd'));
      }
    }
  }, [location.state]);

  const validateForm = () => {
    try {
      itemSchema.parse({
        name: name.trim(),
        purchase_date: purchaseDate,
        expiry_date: expiryDate
      });
      
      // Additional validation for date logic
      const purchaseDateObj = new Date(purchaseDate);
      const expiryDateObj = new Date(expiryDate);
      
      if (expiryDateObj <= purchaseDateObj) {
        setErrors({ expiry_date: 'Expiry date must be after purchase date' });
        return false;
      }
      
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('items')
        .insert([{
          user_id: user.id,
          name: name.trim(),
          purchase_date: purchaseDate,
          expiry_date: expiryDate,
          consumed: false
        }]);

      if (error) throw error;
      
      toast({
        title: "Item added successfully!",
        description: `${name} has been added to your food tracker.`
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Error adding item",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Add Food Item</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 justify-center">
                <Package className="h-5 w-5" />
                Add New Food Item
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="e.g., Organic Bananas, Whole Milk"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={errors.name ? 'border-destructive' : ''}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase-date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Purchase Date *
                  </Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className={errors.purchase_date ? 'border-destructive' : ''}
                  />
                  {errors.purchase_date && <p className="text-sm text-destructive">{errors.purchase_date}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry-date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Expiry Date *
                  </Label>
                  <Input
                    id="expiry-date"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className={errors.expiry_date ? 'border-destructive' : ''}
                  />
                  {errors.expiry_date && <p className="text-sm text-destructive">{errors.expiry_date}</p>}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Adding...' : 'Add Item'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* AI Food Advisor */}
        <div className="max-w-md mx-auto mt-6">
          {name && (
            <AIFoodAdvisor 
              productName={name}
              category="general"
              daysUntilExpiry={expiryDate ? Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 7}
            />
          )}
        </div>

        {/* Community Hub */}
        <div className="max-w-4xl mx-auto mt-6">
          <CommunityHub />
        </div>
      </div>
    </div>
  );
}