-- Profiles (user roles)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role text check (role in ('consumer', 'retailer')) default 'consumer',
  created_at timestamptz default now()
);

-- Consumer items
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  purchase_date date,
  expiry_date date not null,
  consumed boolean default false,
  created_at timestamptz default now()
);

-- Retailer products
create table if not exists public.retailer_products (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  expiry_date date not null,
  discount numeric default 0,
  discounted boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.items enable row level security;
alter table public.retailer_products enable row level security;
alter table public.profiles enable row level security;

-- Policies
create policy "Consumers manage their own items"
  on public.items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Retailers manage their own products"
  on public.retailer_products for all
  using (auth.uid() = retailer_id)
  with check (auth.uid() = retailer_id);

create policy "Users manage their profile"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Add function to automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'consumer');
  return new;
end;
$$;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();