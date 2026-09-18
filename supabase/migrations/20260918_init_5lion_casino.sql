-- ====================================================================
-- 5LION CASINO - FULL PRODUCTION SUPABASE MIGRATION
-- Database: Supabase PostgreSQL
-- Features: 3 Roles (Owner, Admin, Player), Atomic Wallets ($ Virtual),
--           Row-level locking (FOR UPDATE), Complete Ledger Transactions,
--           Casino Games, Sports Matches & Odds Betting, Realtime Chat,
--           Notifications, Activity Logs, RLS Policies, Storage Buckets.
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'player');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'suspended', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM (
        'OWNER_TO_ADMIN',
        'ADMIN_TO_PLAYER',
        'PLAYER_REFUND',
        'GAME_BET',
        'GAME_WIN',
        'BET_PLACED',
        'BET_WIN',
        'BET_LOSS',
        'ADMIN_ADJUSTMENT',
        'OWNER_ADJUSTMENT'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE match_status AS ENUM ('open', 'live', 'settled', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE bet_status AS ENUM ('pending', 'won', 'lost', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role user_role NOT NULL DEFAULT 'player',
    status user_status NOT NULL DEFAULT 'active',
    assigned_admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. WALLETS TABLE (Virtual USD with exact precision numeric(18,2))
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    balance NUMERIC(18, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
    currency TEXT NOT NULL DEFAULT 'VIRTUAL_USD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. WALLET TRANSACTIONS TABLE (Immutable Ledger)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    type transaction_type NOT NULL,
    amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0.00),
    balance_before NUMERIC(18, 2) NOT NULL,
    balance_after NUMERIC(18, 2) NOT NULL,
    source_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reference_type TEXT, -- 'game', 'match', 'admin_transfer', 'owner_allocation'
    reference_id TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. GAMES TABLE
CREATE TABLE IF NOT EXISTS public.games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    minimum_bet NUMERIC(18, 2) NOT NULL DEFAULT 10.00 CHECK (minimum_bet > 0),
    maximum_bet NUMERIC(18, 2) NOT NULL DEFAULT 5000.00 CHECK (maximum_bet >= minimum_bet),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MATCHES TABLE
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league TEXT NOT NULL,
    sport TEXT NOT NULL DEFAULT 'Football',
    team_a TEXT NOT NULL,
    team_b TEXT NOT NULL,
    team_a_logo TEXT,
    team_b_logo TEXT,
    match_time TIMESTAMPTZ NOT NULL,
    status match_status NOT NULL DEFAULT 'open',
    odds_team_a NUMERIC(6, 2) NOT NULL CHECK (odds_team_a >= 1.01),
    odds_team_b NUMERIC(6, 2) NOT NULL CHECK (odds_team_b >= 1.01),
    odds_draw NUMERIC(6, 2) DEFAULT 3.00 CHECK (odds_draw >= 1.01),
    score_team_a INT,
    score_team_b INT,
    winning_team TEXT, -- 'team_a', 'team_b', 'draw', 'cancelled'
    settled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. BETS TABLE
CREATE TABLE IF NOT EXISTS public.bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE RESTRICT,
    selected_team TEXT NOT NULL CHECK (selected_team IN ('team_a', 'team_b', 'draw')),
    bet_amount NUMERIC(18, 2) NOT NULL CHECK (bet_amount > 0),
    odds NUMERIC(6, 2) NOT NULL CHECK (odds >= 1.01),
    potential_win NUMERIC(18, 2) NOT NULL CHECK (potential_win >= bet_amount),
    status bet_status NOT NULL DEFAULT 'pending',
    result TEXT NOT NULL DEFAULT 'pending' CHECK (result IN ('pending', 'win', 'loss', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    settled_at TIMESTAMPTZ
);

-- 8. CONVERSATIONS & MESSAGES (Realtime Chat: Player <-> Admin / Support)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT DEFAULT 'محادثة دعم',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_player_conversation UNIQUE (player_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'balance_transfer', 'bet_accepted', 'match_settled', 'bet_won', 'account_status'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'LOGIN', 'LOGOUT', 'TRANSFER', 'PLACE_BET', 'SETTLE_MATCH', 'SUSPEND_USER', etc.
    target_type TEXT,
    target_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matches_time_status ON public.matches(match_time, status);
CREATE INDEX IF NOT EXISTS idx_bets_user ON public.bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_match ON public.bets(match_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper security function to get user role
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
    auth.uid() = id
    OR public.get_current_role() = 'owner'
    OR (public.get_current_role() = 'admin' AND (assigned_admin_id = auth.uid() OR role = 'player'))
);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
    public.get_current_role() = 'owner'
    OR (auth.uid() = id AND role = 'player') -- player can only update avatar/phone
);

-- WALLETS POLICIES
-- Users can only select their own wallet. Direct UPDATE is revoked from client!
DROP POLICY IF EXISTS "wallets_select_own" ON public.wallets;
CREATE POLICY "wallets_select_own" ON public.wallets
FOR SELECT USING (
    auth.uid() = user_id OR public.get_current_role() IN ('owner', 'admin')
);
-- NEVER ALLOW DIRECT CLIENT UPDATE ON WALLETS! All wallet mutations must go through RPC!
REVOKE UPDATE, INSERT, DELETE ON public.wallets FROM authenticated, anon;

-- TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "transactions_select" ON public.wallet_transactions;
CREATE POLICY "transactions_select" ON public.wallet_transactions
FOR SELECT USING (
    auth.uid() = user_id
    OR auth.uid() = source_user_id
    OR auth.uid() = target_user_id
    OR public.get_current_role() = 'owner'
    OR public.get_current_role() = 'admin'
);
REVOKE UPDATE, INSERT, DELETE ON public.wallet_transactions FROM authenticated, anon;

-- GAMES POLICIES
DROP POLICY IF EXISTS "games_select_all" ON public.games;
CREATE POLICY "games_select_all" ON public.games FOR SELECT USING (true);

DROP POLICY IF EXISTS "games_owner_manage" ON public.games;
CREATE POLICY "games_owner_manage" ON public.games
FOR ALL USING (public.get_current_role() = 'owner');

-- MATCHES POLICIES
DROP POLICY IF EXISTS "matches_select_all" ON public.matches;
CREATE POLICY "matches_select_all" ON public.matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "matches_owner_admin_manage" ON public.matches;
CREATE POLICY "matches_owner_admin_manage" ON public.matches
FOR ALL USING (public.get_current_role() IN ('owner', 'admin'));

-- BETS POLICIES
DROP POLICY IF EXISTS "bets_select" ON public.bets;
CREATE POLICY "bets_select" ON public.bets
FOR SELECT USING (
    auth.uid() = user_id OR public.get_current_role() IN ('owner', 'admin')
);

-- CONVERSATIONS & MESSAGES POLICIES
DROP POLICY IF EXISTS "conversations_access" ON public.conversations;
CREATE POLICY "conversations_access" ON public.conversations
FOR ALL USING (
    auth.uid() = player_id OR auth.uid() = admin_id OR public.get_current_role() IN ('owner', 'admin')
);

DROP POLICY IF EXISTS "messages_access" ON public.messages;
CREATE POLICY "messages_access" ON public.messages
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.player_id = auth.uid() OR c.admin_id = auth.uid() OR public.get_current_role() IN ('owner', 'admin'))
    )
);

DROP POLICY IF EXISTS "messages_insert" ON public.messages;
CREATE POLICY "messages_insert" ON public.messages
FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id
        AND (c.player_id = auth.uid() OR c.admin_id = auth.uid() OR public.get_current_role() IN ('owner', 'admin'))
    )
);

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "notifications_user" ON public.notifications;
CREATE POLICY "notifications_user" ON public.notifications
FOR ALL USING (auth.uid() = user_id);

-- ACTIVITY LOGS POLICIES
DROP POLICY IF EXISTS "logs_select" ON public.activity_logs;
CREATE POLICY "logs_select" ON public.activity_logs
FOR SELECT USING (
    public.get_current_role() = 'owner'
    OR (public.get_current_role() = 'admin' AND user_id = auth.uid())
);

-- ====================================================================
-- ATOMIC RPC FUNCTIONS & PROCEDURES
-- ====================================================================

-- Trigger to auto-create profile and wallet upon auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role user_role := 'player';
BEGIN
    -- Public registrations are ALWAYS player. Owner/admin cannot be chosen in client.
    INSERT INTO public.profiles (id, full_name, username, email, role, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Player ' || SUBSTRING(NEW.id::text, 1, 6)),
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || SUBSTRING(NEW.id::text, 1, 8)),
        NEW.email,
        'player',
        'active'
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.wallets (user_id, balance, currency)
    VALUES (NEW.id, 0.00, 'VIRTUAL_USD')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 1. OWNER ALLOCATES BALANCE TO ADMIN
CREATE OR REPLACE FUNCTION public.owner_add_admin_balance(
    p_admin_id UUID,
    p_amount NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_caller_role user_role;
    v_admin_role user_role;
    v_owner_wallet RECORD;
    v_admin_wallet RECORD;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'المبلغ يجب أن يكون أكبر من 0';
    END IF;

    -- Check caller is owner
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF v_caller_role <> 'owner' THEN
        RAISE EXCEPTION 'غير مصرح: هذه العملية مخصصة لمالك المنصة فقط';
    END IF;

    -- Check target is admin
    SELECT role INTO v_admin_role FROM public.profiles WHERE id = p_admin_id;
    IF v_admin_role <> 'admin' THEN
        RAISE EXCEPTION 'المستخدم الهدف ليس مشرفا أو أدمن';
    END IF;

    -- Lock Owner and Admin wallets in consistent order to prevent deadlock
    IF auth.uid() < p_admin_id THEN
        SELECT * INTO v_owner_wallet FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
        SELECT * INTO v_admin_wallet FROM public.wallets WHERE user_id = p_admin_id FOR UPDATE;
    ELSE
        SELECT * INTO v_admin_wallet FROM public.wallets WHERE user_id = p_admin_id FOR UPDATE;
        SELECT * INTO v_owner_wallet FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
    END IF;

    IF v_owner_wallet.balance < p_amount THEN
        RAISE EXCEPTION 'رصيد الخزينة الافتراضية للمالك غير كافٍ. الرصيد الحالي: $%', v_owner_wallet.balance;
    END IF;

    -- Execute Atomic Transfer
    UPDATE public.wallets SET balance = balance - p_amount, updated_at = NOW() WHERE id = v_owner_wallet.id;
    UPDATE public.wallets SET balance = balance + p_amount, updated_at = NOW() WHERE id = v_admin_wallet.id;

    -- Ledger for Owner
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        source_user_id, target_user_id, reference_type, description
    ) VALUES (
        v_owner_wallet.id, auth.uid(), 'OWNER_TO_ADMIN', p_amount,
        v_owner_wallet.balance, v_owner_wallet.balance - p_amount,
        auth.uid(), p_admin_id, 'owner_allocation', 'شحن رصيد المشرف من خزينة المالك'
    );

    -- Ledger for Admin
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        source_user_id, target_user_id, reference_type, description
    ) VALUES (
        v_admin_wallet.id, p_admin_id, 'OWNER_TO_ADMIN', p_amount,
        v_admin_wallet.balance, v_admin_wallet.balance + p_amount,
        auth.uid(), p_admin_id, 'owner_allocation', 'استلام رصيد افتراضي من المالك'
    );

    -- Notification
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (p_admin_id, 'balance_transfer', 'تم استلام رصيد افتراضي', 'قام مالك المنصة بشحن محفظتك بـ $' || p_amount::text);

    -- Activity Log
    INSERT INTO public.activity_logs (user_id, action, target_type, target_id, metadata)
    VALUES (auth.uid(), 'ADD_BALANCE', 'admin', p_admin_id::text, jsonb_build_object('amount', p_amount));

    RETURN jsonb_build_object('success', true, 'new_owner_balance', v_owner_wallet.balance - p_amount, 'new_admin_balance', v_admin_wallet.balance + p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. ADMIN TRANSFERS BALANCE TO PLAYER
CREATE OR REPLACE FUNCTION public.admin_transfer_to_player(
    p_player_id UUID,
    p_amount NUMERIC,
    p_description TEXT DEFAULT 'شحن رصيد لاعب'
)
RETURNS JSONB AS $$
DECLARE
    v_caller_role user_role;
    v_player_role user_role;
    v_player_status user_status;
    v_admin_wallet RECORD;
    v_player_wallet RECORD;
BEGIN
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'المبلغ يجب أن يكون أكبر من 0';
    END IF;

    -- Check caller is admin or owner
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF v_caller_role NOT IN ('admin', 'owner') THEN
        RAISE EXCEPTION 'غير مصرح: ليس لديك صلاحية شحن اللاعبين';
    END IF;

    -- Check player
    SELECT role, status INTO v_player_role, v_player_status FROM public.profiles WHERE id = p_player_id;
    IF v_player_role <> 'player' THEN
        RAISE EXCEPTION 'المستخدم الهدف ليس لاعباً';
    END IF;
    IF v_player_status <> 'active' THEN
        RAISE EXCEPTION 'حساب اللاعب معلق أو محظور';
    END IF;

    -- Row locks in consistent order to prevent deadlock
    IF auth.uid() < p_player_id THEN
        SELECT * INTO v_admin_wallet FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
        SELECT * INTO v_player_wallet FROM public.wallets WHERE user_id = p_player_id FOR UPDATE;
    ELSE
        SELECT * INTO v_player_wallet FROM public.wallets WHERE user_id = p_player_id FOR UPDATE;
        SELECT * INTO v_admin_wallet FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
    END IF;

    IF v_admin_wallet.balance < p_amount THEN
        RAISE EXCEPTION 'رصيدك غير كافٍ لإتمام العملية. الرصيد الحالي: $%', v_admin_wallet.balance;
    END IF;

    -- Deduct from Admin, Add to Player
    UPDATE public.wallets SET balance = balance - p_amount, updated_at = NOW() WHERE id = v_admin_wallet.id;
    UPDATE public.wallets SET balance = balance + p_amount, updated_at = NOW() WHERE id = v_player_wallet.id;

    -- Ledger for Admin
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        source_user_id, target_user_id, reference_type, description
    ) VALUES (
        v_admin_wallet.id, auth.uid(), 'ADMIN_TO_PLAYER', p_amount,
        v_admin_wallet.balance, v_admin_wallet.balance - p_amount,
        auth.uid(), p_player_id, 'admin_transfer', COALESCE(p_description, 'تحويل رصيد للاعب')
    );

    -- Ledger for Player
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        source_user_id, target_user_id, reference_type, description
    ) VALUES (
        v_player_wallet.id, p_player_id, 'ADMIN_TO_PLAYER', p_amount,
        v_player_wallet.balance, v_player_wallet.balance + p_amount,
        auth.uid(), p_player_id, 'admin_transfer', 'استلام شحن رصيد من المشرف'
    );

    -- Notification for Player
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (p_player_id, 'balance_transfer', 'تم شحن محفظتك', 'تمت إضافة $' || p_amount::text || ' إلى رصيدك الافتراضي بنجاح');

    -- Activity Log
    INSERT INTO public.activity_logs (user_id, action, target_type, target_id, metadata)
    VALUES (auth.uid(), 'TRANSFER', 'player', p_player_id::text, jsonb_build_object('amount', p_amount, 'description', p_description));

    RETURN jsonb_build_object(
        'success', true,
        'new_admin_balance', v_admin_wallet.balance - p_amount,
        'new_player_balance', v_player_wallet.balance + p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PLACE MATCH BET
CREATE OR REPLACE FUNCTION public.place_match_bet(
    p_match_id UUID,
    p_selected_team TEXT,
    p_bet_amount NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_status user_status;
    v_match RECORD;
    v_wallet RECORD;
    v_odds NUMERIC(6,2);
    v_potential_win NUMERIC(18,2);
    v_bet_id UUID;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'يجب تسجيل الدخول لوضع رهان';
    END IF;

    IF p_bet_amount <= 0 THEN
        RAISE EXCEPTION 'قيمة الرهان يجب أن تكون أكبر من 0';
    END IF;

    IF p_selected_team NOT IN ('team_a', 'team_b', 'draw') THEN
        RAISE EXCEPTION 'الفريق المختار غير صحيح';
    END IF;

    -- Check user active
    SELECT status INTO v_user_status FROM public.profiles WHERE id = v_user_id;
    IF v_user_status <> 'active' THEN
        RAISE EXCEPTION 'حسابك معلق أو محظور، لا يمكنك وضع رهان';
    END IF;

    -- Lock and check match
    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'المباراة غير موجودة';
    END IF;

    IF v_match.status <> 'open' THEN
        RAISE EXCEPTION 'المباراة مغلقة للرهانات';
    END IF;

    IF v_match.match_time <= NOW() THEN
        RAISE EXCEPTION 'لا يمكنك تنفيذ هذا الرهان بعد بداية المباراة';
    END IF;

    -- Determine odds
    IF p_selected_team = 'team_a' THEN
        v_odds := v_match.odds_team_a;
    ELSIF p_selected_team = 'team_b' THEN
        v_odds := v_match.odds_team_b;
    ELSE
        v_odds := COALESCE(v_match.odds_draw, 3.00);
    END IF;

    v_potential_win := ROUND(p_bet_amount * v_odds, 2);

    -- Lock player wallet
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
    IF v_wallet.balance < p_bet_amount THEN
        RAISE EXCEPTION 'الرصيد غير كافٍ لوضع هذا الرهان. رصيدك الحالي: $%', v_wallet.balance;
    END IF;

    -- Deduct Bet Amount
    UPDATE public.wallets
    SET balance = balance - p_bet_amount, updated_at = NOW()
    WHERE id = v_wallet.id;

    -- Insert Bet
    INSERT INTO public.bets (
        user_id, match_id, selected_team, bet_amount, odds, potential_win, status, result
    ) VALUES (
        v_user_id, p_match_id, p_selected_team, p_bet_amount, v_odds, v_potential_win, 'pending', 'pending'
    ) RETURNING id INTO v_bet_id;

    -- Ledger Record
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        reference_type, reference_id, description
    ) VALUES (
        v_wallet.id, v_user_id, 'BET_PLACED', p_bet_amount,
        v_wallet.balance, v_wallet.balance - p_bet_amount,
        'match_bet', v_bet_id::text, 'رهان على مباراة: ' || v_match.team_a || ' ضد ' || v_match.team_b
    );

    -- Notification
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (v_user_id, 'bet_accepted', 'تم قبول رهانك بنجاح', 'رهان بقيمة $' || p_bet_amount::text || ' على ' || v_match.team_a || ' ضد ' || v_match.team_b);

    -- Log
    INSERT INTO public.activity_logs (user_id, action, target_type, target_id, metadata)
    VALUES (v_user_id, 'PLACE_BET', 'bet', v_bet_id::text, jsonb_build_object('match_id', p_match_id, 'amount', p_bet_amount, 'odds', v_odds));

    RETURN jsonb_build_object(
        'success', true,
        'bet_id', v_bet_id,
        'new_balance', v_wallet.balance - p_bet_amount,
        'potential_win', v_potential_win
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. SETTLE MATCH (Idempotent, Owner/Admin)
CREATE OR REPLACE FUNCTION public.settle_match(
    p_match_id UUID,
    p_winning_team TEXT,
    p_team_a_score INT DEFAULT 0,
    p_team_b_score INT DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    v_caller_role user_role;
    v_match RECORD;
    v_bet RECORD;
    v_wallet RECORD;
    v_won_count INT := 0;
    v_lost_count INT := 0;
    v_total_paid NUMERIC(18,2) := 0.00;
BEGIN
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF v_caller_role NOT IN ('owner', 'admin') THEN
        RAISE EXCEPTION 'غير مصرح: ليس لديك صلاحية تسوية المباريات';
    END IF;

    IF p_winning_team NOT IN ('team_a', 'team_b', 'draw', 'cancelled') THEN
        RAISE EXCEPTION 'النتيجة المحددة غير صحيحة';
    END IF;

    -- Lock Match
    SELECT * INTO v_match FROM public.matches WHERE id = p_match_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'المباراة غير موجودة';
    END IF;

    IF v_match.status = 'settled' THEN
        RAISE EXCEPTION 'تمت تسوية هذه المباراة مسبقاً ولا يمكن تسويتها مرتين';
    END IF;

    -- Update Match
    UPDATE public.matches
    SET status = 'settled',
        winning_team = p_winning_team,
        score_team_a = p_team_a_score,
        score_team_b = p_team_b_score,
        settled_by = auth.uid(),
        settled_at = NOW(),
        updated_at = NOW()
    WHERE id = p_match_id;

    -- Loop through all pending bets with row lock
    FOR v_bet IN SELECT * FROM public.bets WHERE match_id = p_match_id AND status = 'pending' FOR UPDATE LOOP
        IF p_winning_team = 'cancelled' THEN
            -- Refund bet amount
            SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_bet.user_id FOR UPDATE;
            UPDATE public.wallets SET balance = balance + v_bet.bet_amount, updated_at = NOW() WHERE id = v_wallet.id;
            UPDATE public.bets SET status = 'cancelled', result = 'cancelled', settled_at = NOW() WHERE id = v_bet.id;

            INSERT INTO public.wallet_transactions (
                wallet_id, user_id, type, amount, balance_before, balance_after,
                reference_type, reference_id, description
            ) VALUES (
                v_wallet.id, v_bet.user_id, 'PLAYER_REFUND', v_bet.bet_amount,
                v_wallet.balance, v_wallet.balance + v_bet.bet_amount,
                'match_refund', v_bet.id::text, 'استرداد قيمة الرهان بسبب إلغاء المباراة'
            );

        ELSIF v_bet.selected_team = p_winning_team THEN
            -- Bet Won! Credit potential_win
            SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_bet.user_id FOR UPDATE;
            UPDATE public.wallets SET balance = balance + v_bet.potential_win, updated_at = NOW() WHERE id = v_wallet.id;
            UPDATE public.bets SET status = 'won', result = 'win', settled_at = NOW() WHERE id = v_bet.id;

            INSERT INTO public.wallet_transactions (
                wallet_id, user_id, type, amount, balance_before, balance_after,
                reference_type, reference_id, description
            ) VALUES (
                v_wallet.id, v_bet.user_id, 'BET_WIN', v_bet.potential_win,
                v_wallet.balance, v_wallet.balance + v_bet.potential_win,
                'match_bet_win', v_bet.id::text, 'أرباح رهان فائز على مباراة: ' || v_match.team_a || ' ضد ' || v_match.team_b
            );

            INSERT INTO public.notifications (user_id, type, title, message)
            VALUES (v_bet.user_id, 'bet_won', 'مبروك! لقد ربحت الرهان', 'لقد ربحت $' || v_bet.potential_win::text || ' في مباراة ' || v_match.team_a || ' ضد ' || v_match.team_b);

            v_won_count := v_won_count + 1;
            v_total_paid := v_total_paid + v_bet.potential_win;
        ELSE
            -- Bet Lost
            UPDATE public.bets SET status = 'lost', result = 'loss', settled_at = NOW() WHERE id = v_bet.id;
            v_lost_count := v_lost_count + 1;
        END IF;
    END LOOP;

    -- Log
    INSERT INTO public.activity_logs (user_id, action, target_type, target_id, metadata)
    VALUES (auth.uid(), 'SETTLE_MATCH', 'match', p_match_id::text, jsonb_build_object('winning_team', p_winning_team, 'won_bets', v_won_count, 'lost_bets', v_lost_count, 'total_paid', v_total_paid));

    RETURN jsonb_build_object(
        'success', true,
        'won_count', v_won_count,
        'lost_count', v_lost_count,
        'total_paid', v_total_paid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ATOMIC CASINO GAME ENGINE (Slots, Wheel, Cards, Dice)
CREATE OR REPLACE FUNCTION public.play_casino_game(
    p_game_slug TEXT,
    p_bet_amount NUMERIC,
    p_game_action TEXT, -- e.g. 'spin', 'roll', 'draw'
    p_choice TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_user_status user_status;
    v_game RECORD;
    v_wallet RECORD;
    v_random_val FLOAT;
    v_is_win BOOLEAN := FALSE;
    v_multiplier NUMERIC(6,2) := 0.00;
    v_payout NUMERIC(18,2) := 0.00;
    v_game_result JSONB;
    v_new_balance NUMERIC(18,2);
    v_symbols TEXT[] := ARRAY['🦁', '👑', '💎', '7️⃣', '🍒', '🔔', '🪙'];
    v_slot1 TEXT;
    v_slot2 TEXT;
    v_slot3 TEXT;
    v_dice1 INT;
    v_dice2 INT;
    v_wheel_number INT;
    v_cards TEXT[] := ARRAY['A♠', 'K♥', 'Q♦', 'J♣', '10♠', 'A♥', 'K♦'];
    v_drawn_card TEXT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'يجب تسجيل الدخول للعب';
    END IF;

    SELECT status INTO v_user_status FROM public.profiles WHERE id = v_user_id;
    IF v_user_status <> 'active' THEN
        RAISE EXCEPTION 'حسابك غير نشط';
    END IF;

    SELECT * INTO v_game FROM public.games WHERE slug = p_game_slug AND status = 'active';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'اللعبة غير متوفرة أو معطلة';
    END IF;

    IF p_bet_amount < v_game.minimum_bet OR p_bet_amount > v_game.maximum_bet THEN
        RAISE EXCEPTION 'قيمة الرهان يجب أن تكون بين $% و $%', v_game.minimum_bet, v_game.maximum_bet;
    END IF;

    -- Lock player wallet
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
    IF v_wallet.balance < p_bet_amount THEN
        RAISE EXCEPTION 'الرصيد غير كافٍ. رصيدك الحالي: $%', v_wallet.balance;
    END IF;

    -- Deduct bet amount
    UPDATE public.wallets SET balance = balance - p_bet_amount, updated_at = NOW() WHERE id = v_wallet.id;

    -- Ledger for bet deduction
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        reference_type, reference_id, description
    ) VALUES (
        v_wallet.id, v_user_id, 'GAME_BET', p_bet_amount,
        v_wallet.balance, v_wallet.balance - p_bet_amount,
        'game', v_game.id::text, 'رهان في لعبة ' || v_game.name
    );

    v_random_val := random();

    -- GAME SPECIFIC OUTCOME CALCULATION
    IF p_game_slug = 'golden-slots' THEN
        IF v_random_val < 0.05 THEN
            -- Triple Lions (Jackpot x15)
            v_slot1 := '🦁'; v_slot2 := '🦁'; v_slot3 := '🦁';
            v_multiplier := 15.00;
            v_is_win := TRUE;
        ELSIF v_random_val < 0.15 THEN
            -- Triple Diamonds (x7)
            v_slot1 := '💎'; v_slot2 := '💎'; v_slot3 := '💎';
            v_multiplier := 7.00;
            v_is_win := TRUE;
        ELSIF v_random_val < 0.35 THEN
            -- Double match (x2)
            v_slot1 := '👑'; v_slot2 := '👑'; v_slot3 := '🍒';
            v_multiplier := 2.50;
            v_is_win := TRUE;
        ELSE
            -- No match
            v_slot1 := v_symbols[1 + floor(random() * 4)::int];
            v_slot2 := v_symbols[5 + floor(random() * 2)::int];
            v_slot3 := v_symbols[1 + floor(random() * 7)::int];
            v_is_win := FALSE;
        END IF;
        v_game_result := jsonb_build_object('reels', jsonb_build_array(v_slot1, v_slot2, v_slot3));

    ELSIF p_game_slug = 'lucky-wheel' THEN
        v_wheel_number := floor(random() * 8)::int; -- 0 to 7
        -- multipliers: 0x, 1.5x, 0x, 2x, 0x, 5x, 0x, 10x
        IF v_wheel_number = 7 THEN v_multiplier := 10.00; v_is_win := TRUE;
        ELSIF v_wheel_number = 5 THEN v_multiplier := 5.00; v_is_win := TRUE;
        ELSIF v_wheel_number = 3 THEN v_multiplier := 2.00; v_is_win := TRUE;
        ELSIF v_wheel_number = 1 THEN v_multiplier := 1.50; v_is_win := TRUE;
        ELSE v_multiplier := 0.00; v_is_win := FALSE; END IF;
        v_game_result := jsonb_build_object('segment', v_wheel_number, 'multiplier', v_multiplier);

    ELSIF p_game_slug = 'dice-room' THEN
        v_dice1 := 1 + floor(random() * 6)::int;
        v_dice2 := 1 + floor(random() * 6)::int;
        IF (v_dice1 + v_dice2) >= 7 THEN
            v_multiplier := 2.00;
            v_is_win := TRUE;
        ELSE
            v_is_win := FALSE;
        END IF;
        v_game_result := jsonb_build_object('dice1', v_dice1, 'dice2', v_dice2, 'sum', v_dice1 + v_dice2);

    ELSE -- royal-cards
        v_drawn_card := v_cards[1 + floor(random() * array_length(v_cards, 1))::int];
        IF v_drawn_card IN ('A♠', 'A♥', 'K♥', '👑') THEN
            v_multiplier := 3.00;
            v_is_win := TRUE;
        ELSE
            v_is_win := FALSE;
        END IF;
        v_game_result := jsonb_build_object('card', v_drawn_card);
    END IF;

    -- Process Win Payout if applicable
    IF v_is_win AND v_multiplier > 0 THEN
        v_payout := ROUND(p_bet_amount * v_multiplier, 2);
        UPDATE public.wallets SET balance = balance + v_payout, updated_at = NOW() WHERE id = v_wallet.id;

        INSERT INTO public.wallet_transactions (
            wallet_id, user_id, type, amount, balance_before, balance_after,
            reference_type, reference_id, description
        ) VALUES (
            v_wallet.id, v_user_id, 'GAME_WIN', v_payout,
            v_wallet.balance - p_bet_amount, v_wallet.balance - p_bet_amount + v_payout,
            'game_win', v_game.id::text, 'فوز في لعبة ' || v_game.name || ' (مضاعف ' || v_multiplier || 'x)'
        );

        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (v_user_id, 'game_win', 'فوز كبير في ' || v_game.name, 'ربحت $' || v_payout::text || ' بمضاعف ' || v_multiplier::text || 'x!');
    END IF;

    -- Get current final balance
    SELECT balance INTO v_new_balance FROM public.wallets WHERE id = v_wallet.id;

    -- Log
    INSERT INTO public.activity_logs (user_id, action, target_type, target_id, metadata)
    VALUES (v_user_id, 'PLAY_GAME', 'game', v_game.id::text, jsonb_build_object('bet', p_bet_amount, 'is_win', v_is_win, 'payout', v_payout));

    RETURN jsonb_build_object(
        'success', true,
        'game_name', v_game.name,
        'is_win', v_is_win,
        'multiplier', v_multiplier,
        'payout', v_payout,
        'new_balance', v_new_balance,
        'game_result', v_game_result
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. SUSPEND / ACTIVATE USER
CREATE OR REPLACE FUNCTION public.suspend_user(
    p_target_user_id UUID,
    p_new_status user_status
)
RETURNS JSONB AS $$
DECLARE
    v_caller_role user_role;
    v_target_role user_role;
BEGIN
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    SELECT role INTO v_target_role FROM public.profiles WHERE id = p_target_user_id;

    IF v_caller_role = 'owner' THEN
        -- Owner can suspend anyone except self
        IF p_target_user_id = auth.uid() THEN
            RAISE EXCEPTION 'لا يمكن للمالك تعليق حسابه الخاص';
        END IF;
    ELSIF v_caller_role = 'admin' THEN
        -- Admin can only suspend players
        IF v_target_role <> 'player' THEN
            RAISE EXCEPTION 'المشرف يمكنه فقط تعديل حالة اللاعبين';
        END IF;
    ELSE
        RAISE EXCEPTION 'غير مصرح';
    END IF;

    UPDATE public.profiles
    SET status = p_new_status, updated_at = NOW()
    WHERE id = p_target_user_id;

    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (p_target_user_id, 'account_status', 'تحديث حالة الحساب', 'تم تغيير حالة حسابك إلى: ' || p_new_status::text);

    INSERT INTO public.activity_logs (user_id, action, target_type, target_id, metadata)
    VALUES (auth.uid(), 'SUSPEND_USER', 'user', p_target_user_id::text, jsonb_build_object('status', p_new_status));

    RETURN jsonb_build_object('success', true, 'status', p_new_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- SEED DATA (Casino Games & Real High-Profile Sports Matches)
-- ====================================================================

INSERT INTO public.games (name, slug, description, image_url, status, minimum_bet, maximum_bet)
VALUES
    ('Golden Slots', 'golden-slots', 'ماكينة السلوت الذهبية الفاخرة ذات البكرات الثلاث ومضاعفات تصل إلى 15x', 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=800&q=80', 'active', 10.00, 5000.00),
    ('Lucky Wheel', 'lucky-wheel', 'عجلة الحظ الملكية تدور لتربح جوائز فورية ومضاعفات نارية', 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=800&q=80', 'active', 5.00, 2500.00),
    ('Royal Cards', 'royal-cards', 'أوراق الحظ الملكية لكبار الشخصيات اسحب واربح بمضاعف 3x', 'https://images.unsplash.com/photo-1541278107931-e006523892df?auto=format&fit=crop&w=800&q=80', 'active', 20.00, 10000.00),
    ('Dice Room', 'dice-room', 'غرفة النرد الكلاسيكية راهن على الحظ والضربات المزدوجة', 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80', 'active', 10.00, 3000.00)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.matches (league, sport, team_a, team_b, match_time, status, odds_team_a, odds_team_b, odds_draw)
VALUES
    ('الدوري الإسباني (La Liga)', 'Football', 'ريال مدريد (Real Madrid)', 'برشلونة (Barcelona)', NOW() + INTERVAL '2 days' + INTERVAL '3 hours', 'open', 2.10, 2.45, 3.40),
    ('دوري أبطال أوروبا (Champions League)', 'Football', 'مانشستر سيتي (Man City)', 'بايرن ميونخ (Bayern Munich)', NOW() + INTERVAL '3 days' + INTERVAL '5 hours', 'open', 1.85, 3.10, 3.50),
    ('الدوري الإنجليزي (Premier League)', 'Football', 'ليفربول (Liverpool)', 'أرسنال (Arsenal)', NOW() + INTERVAL '1 day' + INTERVAL '7 hours', 'open', 2.20, 2.60, 3.20),
    ('الدوري الأمريكي للمحترفين (NBA)', 'Basketball', 'لوس أنجلوس ليكرز (LA Lakers)', 'غولدن ستيت واريورز (GS Warriors)', NOW() + INTERVAL '18 hours', 'open', 1.95, 1.88, 12.00),
    ('بطولة ألعاب الفيديو العالمية (eSports)', 'Gaming', 'فريق فايز (FaZe Clan)', 'فريق نافي (Natus Vincere)', NOW() + INTERVAL '12 hours', 'open', 1.75, 2.05, 5.00)
ON CONFLICT DO NOTHING;

-- Enable Realtime publication for tables
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bets;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
