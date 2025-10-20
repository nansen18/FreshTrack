-- Create reverse_commerce_items table to track donations and compost items
CREATE TABLE public.reverse_commerce_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retailer_id uuid NOT NULL,
  product_id uuid NOT NULL,
  product_name text NOT NULL,
  category text NOT NULL CHECK (category IN ('donate', 'compost')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'completed')),
  expiry_date date NOT NULL,
  ai_reasoning text,
  co2_saved numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reverse_commerce_items ENABLE ROW LEVEL SECURITY;

-- Retailers can manage their own reverse commerce items
CREATE POLICY "Retailers manage their own reverse commerce items"
ON public.reverse_commerce_items
FOR ALL
USING (auth.uid() = retailer_id AND has_role(auth.uid(), 'retailer'::app_role))
WITH CHECK (auth.uid() = retailer_id AND has_role(auth.uid(), 'retailer'::app_role));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_reverse_commerce_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reverse_commerce_items_updated_at
BEFORE UPDATE ON public.reverse_commerce_items
FOR EACH ROW
EXECUTE FUNCTION public.update_reverse_commerce_updated_at();