import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Leaf, 
  Package, 
  Plus, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Trash2, 
  LogOut,
  BarChart3,
  Moon,
  Sun,
  Scan,
  XCircle,
  Search
} from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';
import GameProgress from '@/components/GameProgress';
import NutritionSummary from '@/components/NutritionSummary';
import DailyNutritionSummary from '@/components/DailyNutritionSummary';
import FreshnessDetector from '@/components/FreshnessDetector';
import DiscountedOffers from '@/components/DiscountedOffers';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, isPast } from 'date-fns';

interface Item {
  id: string;
  name: string;
  purchase_date: string;
  expiry_date: string;
  consumed: boolean;
  created_at: string;
  barcode?: string;
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

export default function Dashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showFreshnessDetector, setShowFreshnessDetector] = useState(false);
  
  const { user, profile, signOut } = useAuth();
  const { theme, setTheme, isDark } = useDarkMode();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (profile && profile.role === 'retailer') {
      navigate('/retailer');
      return;
    }
    
    fetchItems();
  }, [user, profile, navigate]);

  const fetchItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .order('expiry_date');

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading items",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsConsumed = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({ consumed: true })
        .eq('id', itemId);

      if (error) throw error;
      
      toast({
        title: "Item consumed!",
        description: "Great job reducing food waste! 🌱"
      });
      
      fetchItems();
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
      
      toast({
        title: "Item deleted",
        description: "Item removed from your list"
      });
      
      fetchItems();
    } catch (error: any) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getItemStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);
    
    if (daysUntilExpiry < 0) return { status: 'expired', color: 'bg-destructive', text: 'Expired' };
    if (daysUntilExpiry <= 2) return { status: 'critical', color: 'bg-orange-500', text: 'Critical' };
    if (daysUntilExpiry <= 5) return { status: 'warning', color: 'bg-yellow-500', text: 'Warning' };
    return { status: 'safe', color: 'bg-green-500', text: 'Safe' };
  };

  const stats = {
    total: items.length,
    consumed: items.filter(item => item.consumed).length,
    expiring: items.filter(item => !item.consumed && getItemStatus(item.expiry_date).status === 'warning').length,
    expired: items.filter(item => !item.consumed && getItemStatus(item.expiry_date).status === 'expired').length
  };

  const activeItems = items.filter(item => !item.consumed);
  const expiringItems = activeItems.filter(item => {
    const status = getItemStatus(item.expiry_date);
    return status.status === 'warning' || status.status === 'critical';
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading your food tracker...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Consumer Navigation */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="w-full px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">FreshTrack</h1>
              <Badge variant="outline" className="ml-2 text-xs">Consumer</Badge>
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
              <span className="text-sm text-muted-foreground hidden md:block">
                Welcome back!
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/reports')}>
                <BarChart3 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Reports</span>
              </Button>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full px-4 lg:px-6 py-6 lg:py-8">
        {/* Game Progress & Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <div className="xl:col-span-3 space-y-4 lg:space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <Package className="h-7 w-7 lg:h-8 lg:w-8 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs lg:text-sm text-muted-foreground">Total Items</p>
                      <p className="text-xl lg:text-2xl font-bold">{stats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <CheckCircle className="h-7 w-7 lg:h-8 lg:w-8 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs lg:text-sm text-muted-foreground">Consumed</p>
                      <p className="text-xl lg:text-2xl font-bold">{stats.consumed}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 lg:p-6">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <AlertTriangle className="h-7 w-7 lg:h-8 lg:w-8 text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs lg:text-sm text-muted-foreground">Expiring Soon</p>
                      <p className="text-xl lg:text-2xl font-bold">{stats.expiring}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Expiry Alerts */}
            {expiringItems.length > 0 && (
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-200 text-base lg:text-lg">
                    <AlertTriangle className="h-4 w-4 lg:h-5 lg:w-5" />
                    Food Expiry Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expiringItems.slice(0, 3).map(item => {
                      const status = getItemStatus(item.expiry_date);
                      const daysLeft = differenceInDays(new Date(item.expiry_date), new Date());
                      return (
                        <div key={item.id} className="text-sm">
                          • <strong>{item.name}</strong> - {daysLeft >= 0 ? `${daysLeft} days left` : `Expired ${Math.abs(daysLeft)} days ago`}
                        </div>
                      );
                    })}
                    {expiringItems.length > 3 && (
                      <div className="text-sm text-muted-foreground">
                        + {expiringItems.length - 3} more items need attention
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="xl:col-span-1">
            <GameProgress 
              totalItems={stats.total}
              consumedItems={stats.consumed}
              moneySaved={stats.consumed * 50}
              co2Reduced={stats.consumed * 0.5}
            />
          </div>
        </div>

        {/* Daily Nutrition Summary */}
        <div className="mb-6 lg:mb-8">
          <DailyNutritionSummary items={items} />
        </div>

        {/* Discounted Offers */}
        <div className="mb-6 lg:mb-8">
          <DiscountedOffers />
        </div>

        {/* Freshness Detector */}
        {showFreshnessDetector && (
          <div className="mb-6 lg:mb-8">
            <FreshnessDetector />
          </div>
        )}

        {/* Add Item Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 lg:mb-6">
          <h2 className="text-lg lg:text-xl font-semibold">Your Food Items</h2>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setShowFreshnessDetector(!showFreshnessDetector)}
              variant={showFreshnessDetector ? "default" : "outline"}
              size="sm"
            >
              <Search className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Check Freshness</span>
              <span className="sm:hidden">Freshness</span>
            </Button>
            <Button onClick={() => setShowScanner(true)} size="sm">
              <Scan className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Scan Barcode</span>
              <span className="sm:hidden">Scan</span>
            </Button>
            <Button variant="outline" onClick={() => navigate('/add-item')} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Add Manually</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid gap-3 lg:gap-4">
          {items.length === 0 ? (
            <Card>
              <CardContent className="p-6 lg:p-8 text-center">
                <Package className="h-10 w-10 lg:h-12 lg:w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No items yet</h3>
                <p className="text-sm lg:text-base text-muted-foreground mb-4">
                  Start tracking your food to reduce waste and save money!
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Button onClick={() => setShowScanner(true)} size="sm">
                    <Scan className="h-4 w-4 mr-2" />
                    Scan Barcode
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/add-item')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manually
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            items.map((item) => {
              const status = getItemStatus(item.expiry_date);
              const daysLeft = differenceInDays(new Date(item.expiry_date), new Date());
              
              return (
                <Card key={item.id} className={`hover:shadow-md transition-shadow ${item.consumed ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{item.name}</h3>
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
                          {item.consumed && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              ✓ Consumed
                            </Badge>
                          )}
                        </div>
                         <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Expires: {format(new Date(item.expiry_date), 'MMM dd, yyyy')}</span>
                          </div>
                          <div>
                            {daysLeft >= 0 ? `${daysLeft} days left` : `Expired ${Math.abs(daysLeft)} days ago`}
                          </div>
                        </div>
                        {/* Show Nutrition Summary if available */}
                        {(item.calories || item.sugar || item.protein || item.fat || item.fiber) && (
                          <div className="mt-4">
                            <NutritionSummary 
                              data={{
                                calories: item.calories,
                                sugar: item.sugar,
                                protein: item.protein,
                                fat: item.fat,
                                fiber: item.fiber,
                                carbohydrates: item.carbohydrates,
                                sodium: item.sodium,
                                health_score: item.health_score,
                                ai_feedback: item.ai_feedback,
                              }}
                              itemName={item.name}
                            />
                          </div>
                        )}
                      </div>
                      {!item.consumed && (
                        <div className="flex items-center gap-2">
                           <Button
                             variant="default"
                             size="sm"
                             onClick={() => markAsConsumed(item.id)}
                             className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:hover:bg-green-700"
                           >
                             <CheckCircle className="h-4 w-4 mr-1" />
                             Consumed
                           </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteItem(item.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
        
        {/* Barcode Scanner Modal */}
        {showScanner && (
          <BarcodeScanner
            onScanSuccess={(productData) => {
              setShowScanner(false);
              // Navigate to add item with pre-filled data
              navigate('/add-item', { 
                state: { 
                  productName: productData.name,
                  estimatedShelfLife: productData.estimatedShelfLife
                }
              });
            }}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    </div>
  );
}