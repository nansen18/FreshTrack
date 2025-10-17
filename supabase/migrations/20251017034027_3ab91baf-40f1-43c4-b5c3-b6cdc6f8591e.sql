-- Create enum for application roles
CREATE TYPE public.app_role AS ENUM ('consumer', 'retailer');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update the handle_new_user function to create default consumer role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'consumer');
  
  -- Insert default consumer role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'consumer');
  
  RETURN new;
END;
$$;

-- Update retailer_products RLS to use has_role function
DROP POLICY IF EXISTS "Retailers manage their own products" ON public.retailer_products;

CREATE POLICY "Retailers manage their own products"
  ON public.retailer_products
  FOR ALL
  USING (
    auth.uid() = retailer_id 
    AND public.has_role(auth.uid(), 'retailer')
  )
  WITH CHECK (
    auth.uid() = retailer_id 
    AND public.has_role(auth.uid(), 'retailer')
  );

-- Allow consumers to view discounted products
CREATE POLICY "Consumers can view discounted products"
  ON public.retailer_products
  FOR SELECT
  USING (
    discounted = true 
    AND public.has_role(auth.uid(), 'consumer')
  );