import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tag, Calendar, TrendingDown, MapPin } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface DiscountedOffer {
  id: string;
  name: string;
  expiry_date: string;
  discount: number;
  retailer_id: string;
}

export default function DiscountedOffers() {
  const [offers, setOffers] = useState<DiscountedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('retailer_products')
        .select('*')
        .eq('discounted', true)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .order('discount', { ascending: false })
        .limit(10);

      if (error) throw error;
      setOffers(data || []);
    } catch (error: any) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimOffer = (offerName: string, discount: number) => {
    toast({
      title: "Offer Claimed! 🎉",
      description: `You claimed ${discount}% off on ${offerName}. Visit the store to redeem.`
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse text-muted-foreground">Loading offers...</div>
        </CardContent>
      </Card>
    );
  }

  if (offers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Nearby Discounted Offers
          </CardTitle>
          <CardDescription>
            No active offers at the moment. Check back soon!
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          Nearby Discounted Offers
        </CardTitle>
        <CardDescription>
          Save money on items nearing expiry from local retailers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {offers.slice(0, 5).map((offer) => {
            const daysLeft = differenceInDays(new Date(offer.expiry_date), new Date());
            
            return (
              <div
                key={offer.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{offer.name}</h4>
                    <Badge variant="secondary" className="bg-green-500 text-white">
                      {offer.discount}% OFF
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{daysLeft} days left</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>Local retailer</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => claimOffer(offer.name, offer.discount)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Claim
                </Button>
              </div>
            );
          })}
        </div>
        
        {offers.length > 5 && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            +{offers.length - 5} more offers available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
