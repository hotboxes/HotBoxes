-- HotBoxes Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE,
    email TEXT NOT NULL,
    hotcoin_balance INTEGER DEFAULT 0 CHECK (hotcoin_balance >= 0),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (id)
);

-- Create games table
CREATE TABLE public.games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    sport TEXT NOT NULL CHECK (sport IN ('NFL', 'NBA')),
    game_date TIMESTAMP WITH TIME ZONE NOT NULL,
    entry_fee INTEGER NOT NULL CHECK (entry_fee > 0),
    home_scores INTEGER[] DEFAULT '{}',
    away_scores INTEGER[] DEFAULT '{}',
    home_numbers INTEGER[] DEFAULT '{}',
    away_numbers INTEGER[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    numbers_assigned BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create boxes table
CREATE TABLE public.boxes (
    id TEXT PRIMARY KEY,
    row INTEGER NOT NULL CHECK (row >= 0 AND row <= 9),
    column INTEGER NOT NULL CHECK (column >= 0 AND column <= 9),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(game_id, row, column)
);

-- Create hotcoin_transactions table
CREATE TABLE public.hotcoin_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('purchase', 'bet', 'payout', 'refund')),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    game_id UUID REFERENCES public.games(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_games_sport ON public.games(sport);
CREATE INDEX idx_games_game_date ON public.games(game_date);
CREATE INDEX idx_games_is_active ON public.games(is_active);
CREATE INDEX idx_games_created_by ON public.games(created_by);
CREATE INDEX idx_boxes_game_id ON public.boxes(game_id);
CREATE INDEX idx_boxes_user_id ON public.boxes(user_id);
CREATE INDEX idx_transactions_user_id ON public.hotcoin_transactions(user_id);
CREATE INDEX idx_transactions_type ON public.hotcoin_transactions(type);
CREATE INDEX idx_transactions_game_id ON public.hotcoin_transactions(game_id);
CREATE INDEX idx_transactions_created_at ON public.hotcoin_transactions(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER games_updated_at
    BEFORE UPDATE ON public.games
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotcoin_transactions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Games policies
CREATE POLICY "Anyone can view active games" ON public.games
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can view all games" ON public.games
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can insert games" ON public.games
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can update games" ON public.games
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Boxes policies
CREATE POLICY "Anyone can view boxes" ON public.boxes
    FOR SELECT USING (TRUE);

CREATE POLICY "Users can update boxes they don't own" ON public.boxes
    FOR UPDATE USING (user_id IS NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage all boxes" ON public.boxes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON public.hotcoin_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.hotcoin_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" ON public.hotcoin_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Admins can insert all transactions" ON public.hotcoin_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Create a function to generate boxes for a game
CREATE OR REPLACE FUNCTION public.create_game_boxes(game_id_param UUID)
RETURNS VOID AS $$
DECLARE
    row_num INTEGER;
    col_num INTEGER;
BEGIN
    -- Create 100 boxes (10x10 grid)
    FOR row_num IN 0..9 LOOP
        FOR col_num IN 0..9 LOOP
            INSERT INTO public.boxes (id, row, column, game_id)
            VALUES (
                game_id_param || '-' || row_num || '-' || col_num,
                row_num,
                col_num,
                game_id_param
            );
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample data for testing
INSERT INTO public.profiles (id, username, email, hotcoin_balance, is_admin)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'admin', 'admin@hotboxes.com', 1000, TRUE),
    ('00000000-0000-0000-0000-000000000002', 'testuser', 'test@hotboxes.com', 100, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Sample game
INSERT INTO public.games (
    id,
    name,
    home_team,
    away_team,
    sport,
    game_date,
    entry_fee,
    created_by
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Week 1 - Chiefs vs Bills',
    'Kansas City Chiefs',
    'Buffalo Bills',
    'NFL',
    TIMEZONE('utc'::text, NOW()) + INTERVAL '2 hours',
    5,
    '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- Create boxes for the sample game
SELECT public.create_game_boxes('11111111-1111-1111-1111-111111111111');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;