-- Create freshness_checks table to store freshness detection results
CREATE TABLE IF NOT EXISTS public.freshness_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  freshness_level TEXT NOT NULL CHECK (freshness_level IN ('fresh', 'aging', 'spoiled')),
  freshness_score NUMERIC NOT NULL CHECK (freshness_score >= 0 AND freshness_score <= 100),
  ai_description TEXT NOT NULL,
  product_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.freshness_checks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own freshness checks" 
ON public.freshness_checks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own freshness checks" 
ON public.freshness_checks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own freshness checks" 
ON public.freshness_checks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_freshness_checks_user_id ON public.freshness_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_freshness_checks_created_at ON public.freshness_checks(created_at DESC);