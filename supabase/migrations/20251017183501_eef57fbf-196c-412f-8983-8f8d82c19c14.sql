-- Create table to track claimed offers
CREATE TABLE public.claimed_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.retailer_products(id) ON DELETE CASCADE,
  consumer_id UUID NOT NULL,
  retailer_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  discount NUMERIC NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.claimed_offers ENABLE ROW LEVEL SECURITY;

-- Consumers can view their own claimed offers
CREATE POLICY "Consumers can view their own claimed offers"
ON public.claimed_offers
FOR SELECT
USING (auth.uid() = consumer_id AND has_role(auth.uid(), 'consumer'::app_role));

-- Consumers can create claimed offers
CREATE POLICY "Consumers can claim offers"
ON public.claimed_offers
FOR INSERT
WITH CHECK (auth.uid() = consumer_id AND has_role(auth.uid(), 'consumer'::app_role));

-- Retailers can view claims for their products
CREATE POLICY "Retailers can view claims for their products"
ON public.claimed_offers
FOR SELECT
USING (auth.uid() = retailer_id AND has_role(auth.uid(), 'retailer'::app_role));

-- Create index for better query performance
CREATE INDEX idx_claimed_offers_retailer ON public.claimed_offers(retailer_id);
CREATE INDEX idx_claimed_offers_consumer ON public.claimed_offers(consumer_id);