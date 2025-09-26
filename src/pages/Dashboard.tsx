import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Plus, Leaf, BarChart3, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, isPast } from 'date-fns';

interface FoodItem {
  id: string;
  name: string;
  purchase_date: string;
  expiry_date: string;
  consumed: boolean;
  created_at: string;
}

export default function Dashboard() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (profile?.role === 'retailer') {
      navigate('/retailer');
      return;
    }

    fetchItems();
  }, [user, profile, navigate]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user?.id)
        .order('expiry_date', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching items",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getItemStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (isPast(expiry)) {
      return { status: 'expired', color: 'expired', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 3) {
      return { status: 'warning', color: 'warning', days: daysUntilExpiry };
    } else {
      return { status: 'safe', color: 'safe', days: daysUntilExpiry };
    }
  };

  const markAsConsumed = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ consumed: true })
        .eq('id', itemId);

      if (error) throw error;
      
      await fetchItems();
      toast({
        title: "Item marked as consumed",
        description: "Great job reducing food waste!"
      });
    } catch (error: any) {
      toast({
        title: "Error updating item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      
      await fetchItems();
      toast({
        title: "Item deleted",
        description: "Item has been removed from your list"
      });
    } catch (error: any) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const nearExpiryItems = items.filter(item => !item.consumed && getItemStatus(item.expiry_date).status === 'warning');
  const expiredItems = items.filter(item => !item.consumed && getItemStatus(item.expiry_date).status === 'expired');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Leaf className="h-8 w-8 text-primary mx-auto animate-pulse" />
          <p className="mt-2 text-muted-foreground">Loading your items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">FreshTrack</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Welcome, {profile?.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Alerts */}
        {(nearExpiryItems.length > 0 || expiredItems.length > 0) && (
          <Card className="mb-6 border-warning bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Food Expiry Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expiredItems.length > 0 && (
                <div className="mb-4">
                  <p className="font-medium text-expired mb-2">Expired Items ({expiredItems.length})</p>
                  <div className="space-y-1">
                    {expiredItems.slice(0, 3).map(item => (
                      <div key={item.id} className="text-sm text-muted-foreground">
                        • {item.name} (expired {getItemStatus(item.expiry_date).days} days ago)
                      </div>
                    ))}
                    {expiredItems.length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        + {expiredItems.length - 3} more expired items
                      </div>
                    )}
                  </div>
                </div>
              )}
              {nearExpiryItems.length > 0 && (
                <div>
                  <p className="font-medium text-warning mb-2">Expiring Soon ({nearExpiryItems.length})</p>
                  <div className="space-y-1">
                    {nearExpiryItems.slice(0, 3).map(item => (
                      <div key={item.id} className="text-sm text-muted-foreground">
                        • {item.name} (expires in {getItemStatus(item.expiry_date).days} days)
                      </div>
                    ))}
                    {nearExpiryItems.length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        + {nearExpiryItems.length - 3} more expiring soon
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add Item Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Food Items</h2>
          <Button onClick={() => navigate('/add-item')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Items Grid */}
        {items.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Leaf className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No items yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking your food items to reduce waste and save money!
              </p>
              <Button onClick={() => navigate('/add-item')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const itemStatus = getItemStatus(item.expiry_date);
              return (
                <Card key={item.id} className={`${item.consumed ? 'opacity-60' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                      <Badge 
                        variant={itemStatus.status === 'safe' ? 'default' : 'secondary'}
                        className={
                          itemStatus.status === 'expired' 
                            ? 'bg-expired text-expired-foreground' 
                            : itemStatus.status === 'warning'
                            ? 'bg-warning text-warning-foreground'
                            : 'bg-safe text-safe-foreground'
                        }
                      >
                        {itemStatus.status === 'expired' 
                          ? 'Expired' 
                          : itemStatus.status === 'warning'
                          ? 'Near Expiry'
                          : 'Fresh'
                        }
                      </Badge>
                    </div>
                    <CardDescription>
                      <div className="space-y-1">
                        <div>Purchased: {format(new Date(item.purchase_date), 'MMM d, yyyy')}</div>
                        <div>Expires: {format(new Date(item.expiry_date), 'MMM d, yyyy')}</div>
                        <div className="font-medium">
                          {itemStatus.status === 'expired'
                            ? `Expired ${itemStatus.days} days ago`
                            : itemStatus.status === 'warning'
                            ? `Expires in ${itemStatus.days} days`
                            : `${itemStatus.days} days remaining`
                          }
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {item.consumed ? (
                      <div className="flex items-center gap-2 text-safe">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Consumed</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markAsConsumed(item.id)}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Consumed
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => deleteItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}