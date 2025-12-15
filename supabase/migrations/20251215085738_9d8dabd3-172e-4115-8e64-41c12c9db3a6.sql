-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monthly_logs table
CREATE TABLE public.monthly_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL, -- Format: "YYYY-MM"
  start_mileage INTEGER,
  end_mileage INTEGER,
  total_jobs INTEGER DEFAULT 0,
  total_distance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Create job_entries table
CREATE TABLE public.job_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_log_id UUID NOT NULL REFERENCES public.monthly_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_number INTEGER NOT NULL,
  order_number TEXT,
  customer TEXT,
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  mileage_start INTEGER,
  mileage_end INTEGER,
  distance INTEGER,
  amount_paid INTEGER,
  is_water_fill BOOLEAN DEFAULT FALSE,
  is_parking BOOLEAN DEFAULT FALSE,
  date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fuel_data table
CREATE TABLE public.fuel_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_log_id UUID NOT NULL UNIQUE REFERENCES public.monthly_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fuel_cf INTEGER,
  diesel_amount INTEGER,
  diesel_cost INTEGER,
  petrol_amount INTEGER,
  petrol_cost INTEGER,
  total_liters_used INTEGER,
  total_cost INTEGER,
  total_expense INTEGER,
  fuel_balance INTEGER,
  amount_earned INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create misdemeanors table
CREATE TABLE public.misdemeanors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_log_id UUID NOT NULL REFERENCES public.monthly_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  fine INTEGER,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create water_fill_sites table
CREATE TABLE public.water_fill_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.misdemeanors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_fill_sites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for monthly_logs
CREATE POLICY "Users can view their own monthly logs" ON public.monthly_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own monthly logs" ON public.monthly_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own monthly logs" ON public.monthly_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own monthly logs" ON public.monthly_logs FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for job_entries
CREATE POLICY "Users can view their own job entries" ON public.job_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own job entries" ON public.job_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own job entries" ON public.job_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own job entries" ON public.job_entries FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for fuel_data
CREATE POLICY "Users can view their own fuel data" ON public.fuel_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own fuel data" ON public.fuel_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own fuel data" ON public.fuel_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own fuel data" ON public.fuel_data FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for misdemeanors
CREATE POLICY "Users can view their own misdemeanors" ON public.misdemeanors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own misdemeanors" ON public.misdemeanors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own misdemeanors" ON public.misdemeanors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own misdemeanors" ON public.misdemeanors FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for water_fill_sites
CREATE POLICY "Users can view their own water fill sites" ON public.water_fill_sites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own water fill sites" ON public.water_fill_sites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own water fill sites" ON public.water_fill_sites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own water fill sites" ON public.water_fill_sites FOR DELETE USING (auth.uid() = user_id);

-- Handle new user creation - create profile automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_monthly_logs_updated_at BEFORE UPDATE ON public.monthly_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fuel_data_updated_at BEFORE UPDATE ON public.fuel_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();