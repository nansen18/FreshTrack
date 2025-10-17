import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Package, BarChart3 } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface AnalyticsData {
  totalClaims: number;
  wasteReduction: number;
  revenueRecovered: number;
  activeCampaigns: number;
  claimsThisWeek: number;
}

export default function RetailerAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalClaims: 0,
    wasteReduction: 0,
    revenueRecovered: 0,
    activeCampaigns: 0,
    claimsThisWeek: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all claimed offers for this retailer
      const { data: claims, error: claimsError } = await supabase
        .from('claimed_offers')
        .select('*')
        .eq('retailer_id', user.id);

      if (claimsError) throw claimsError;

      // Get active discounted products
      const { data: activeProducts, error: productsError } = await supabase
        .from('retailer_products')
        .select('*')
        .eq('retailer_id', user.id)
        .eq('discounted', true);

      if (productsError) throw productsError;

      // Calculate claims this week
      const oneWeekAgo = subDays(new Date(), 7);
      const claimsThisWeek = claims?.filter(
        claim => new Date(claim.claimed_at) >= oneWeekAgo
      ).length || 0;

      // Calculate total revenue recovered (assuming average product price of $10)
      const avgProductPrice = 10;
      const totalRevenue = claims?.reduce((sum, claim) => {
        return sum + (avgProductPrice * (claim.discount / 100));
      }, 0) || 0;

      setAnalytics({
        totalClaims: claims?.length || 0,
        wasteReduction: claims?.length || 0, // Each claim = 1 item saved from waste
        revenueRecovered: totalRevenue,
        activeCampaigns: activeProducts?.length || 0,
        claimsThisWeek
      });
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse text-muted-foreground">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Store Performance Analytics
          </CardTitle>
          <CardDescription>
            Track your waste reduction impact and revenue recovery
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClaims}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics.claimsThisWeek} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waste Reduced</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.wasteReduction}</div>
            <p className="text-xs text-muted-foreground">
              Items saved from waste
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Recovered</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.revenueRecovered.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From discounted items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activeCampaigns}</div>
            <p className="text-xs text-muted-foreground">
              Discount offers running
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
