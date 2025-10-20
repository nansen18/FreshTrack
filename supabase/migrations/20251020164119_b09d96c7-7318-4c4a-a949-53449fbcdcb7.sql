-- Fix the function search_path issue by recreating trigger and function properly
DROP TRIGGER IF EXISTS update_reverse_commerce_items_updated_at ON public.reverse_commerce_items;
DROP FUNCTION IF EXISTS public.update_reverse_commerce_updated_at();

CREATE OR REPLACE FUNCTION public.update_reverse_commerce_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_reverse_commerce_items_updated_at
BEFORE UPDATE ON public.reverse_commerce_items
FOR EACH ROW
EXECUTE FUNCTION public.update_reverse_commerce_updated_at();