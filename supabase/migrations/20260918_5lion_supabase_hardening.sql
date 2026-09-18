-- ====================================================================
-- 5LION CASINO - HARDENING MIGRATION (PostgreSQL / Supabase)
-- Single Source of Truth, Pure Realtime & RPC, Strict Atomic Locking
-- ====================================================================

-- 1. GAME HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.game_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    bet_amount NUMERIC(18, 2) NOT NULL CHECK (bet_amount > 0),
    multiplier NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    payout NUMERIC(18, 2) NOT NULL DEFAULT 0.00,
    result TEXT NOT NULL CHECK (result IN ('win', 'loss')),
    game_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_history_user_id ON public.game_history(user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_game_id ON public.game_history(game_id);
CREATE INDEX IF NOT EXISTS idx_game_history_created_at ON public.game_history(created_at DESC);

ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_history_select" ON public.game_history;
CREATE POLICY "game_history_select" ON public.game_history
FOR SELECT USING (
    auth.uid() = user_id OR public.get_current_role() IN ('owner', 'admin')
);

REVOKE UPDATE, INSERT, DELETE ON public.game_history FROM authenticated, anon;

-- 2. OWNER TRANSFER TO ADMIN RPC
CREATE OR REPLACE FUNCTION public.owner_transfer_to_admin(
    admin_id UUID,
    amount NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_caller_role user_role;
    v_admin_role user_role;
    v_owner_wallet RECORD;
    v_admin_wallet RECORD;
BEGIN
    IF amount <= 0 THEN
        RAISE EXCEPTION 'المبلغ يجب أن يكون أكبر من 0';
    END IF;

    -- Check caller is owner
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF v_caller_role <> 'owner' THEN
        RAISE EXCEPTION 'غير مصرح: هذه العملية مخصصة لمالك المنصة فقط (Owner)';
    END IF;

    -- Check target is admin
    SELECT role INTO v_admin_role FROM public.profiles WHERE id = admin_id;
    IF v_admin_role <> 'admin' THEN
        RAISE EXCEPTION 'المستخدم الهدف ليس مشرفاً معتمداً';
    END IF;

    -- Lock Owner and Admin wallets in consistent UUID order to prevent deadlocks
    IF auth.uid() < admin_id THEN
        SELECT * INTO v_owner_wallet FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
        SELECT * INTO v_admin_wallet FROM public.wallets WHERE user_id = admin_id FOR UPDATE;
    ELSE
        SELECT * INTO v_admin_wallet FROM public.wallets WHERE user_id = admin_id FOR UPDATE;
        SELECT * INTO v_owner_wallet FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
    END IF;

    IF v_owner_wallet IS NULL THEN
        RAISE EXCEPTION 'محفظة المالك غير موجودة';
    END IF;

    IF v_admin_wallet IS NULL THEN
        RAISE EXCEPTION 'محفظة المشرف غير موجودة';
    END IF;

    IF v_owner_wallet.balance < amount THEN
        RAISE EXCEPTION 'رصيد الخزينة الافتراضية للمالك غير كافٍ. الرصيد الحالي: $%', v_owner_wallet.balance;
    END IF;

    -- Execute Atomic Transfer
    UPDATE public.wallets SET balance = balance - amount, updated_at = NOW() WHERE id = v_owner_wallet.id;
    UPDATE public.wallets SET balance = balance + amount, updated_at = NOW() WHERE id = v_admin_wallet.id;

    -- Ledger for Owner
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        source_user_id, target_user_id, reference_type, description
    ) VALUES (
        v_owner_wallet.id, auth.uid(), 'OWNER_TO_ADMIN', amount,
        v_owner_wallet.balance, v_owner_wallet.balance - amount,
        auth.uid(), admin_id, 'owner_allocation', 'تحويل رصيد افتراضي من المالك للمشرف'
    );

    -- Ledger for Admin
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        source_user_id, target_user_id, reference_type, description
    ) VALUES (
        v_admin_wallet.id, admin_id, 'OWNER_TO_ADMIN', amount,
        v_admin_wallet.balance, v_admin_wallet.balance + amount,
        auth.uid(), admin_id, 'owner_allocation', 'استلام رصيد افتراضي من المالك'
    );

    -- Notification for Admin
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (admin_id, 'balance_transfer', 'تم استلام رصيد افتراضي', 'قام مالك المنصة بتحويل $' || amount::text || ' إلى محفظتك');

    -- Activity Log
    INSERT INTO public.activity_logs (user_id, action, target_type, target_id, metadata)
    VALUES (auth.uid(), 'OWNER_TO_ADMIN', 'admin', admin_id::text, jsonb_build_object('amount', amount));

    RETURN jsonb_build_object(
        'success', true,
        'new_owner_balance', v_owner_wallet.balance - amount,
        'new_admin_balance', v_admin_wallet.balance + amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Alias for backward compatibility
CREATE OR REPLACE FUNCTION public.owner_add_admin_balance(
    p_admin_id UUID,
    p_amount NUMERIC
)
RETURNS JSONB AS $$
BEGIN
    RETURN public.owner_transfer_to_admin(p_admin_id, p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ADMIN TRANSFER TO PLAYER RPC
CREATE OR REPLACE FUNCTION public.admin_transfer_to_player(
    player_id UUID,
    amount NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    v_caller_role user_role;
    v_player_role user_role;
    v_player_status user_status;
    v_admin_wallet RECORD;
    v_player_wallet RECORD;
BEGIN
    IF amount <= 0 THEN
        RAISE EXCEPTION 'المبلغ يجب أن يكون أكبر من 0';
    END IF;

    -- Check caller is admin or owner
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF v_caller_role NOT IN ('admin', 'owner') THEN
        RAISE EXCEPTION 'غير مصرح: ليس لديك صلاحية شحن اللاعبين';
    END IF;

    -- Check player
    SELECT role, status INTO v_player_role, v_player_status FROM public.profiles WHERE id = player_id;
    IF v_player_role <> 'player' THEN
        RAISE EXCEPTION 'المستخدم الهدف ليس لاعباً';
    END IF;
    IF v_player_status <> 'active' THEN
        RAISE EXCEPTION 'حساب اللاعب معلق أو محظور';
    END IF;

    -- Row locks in consistent order to prevent deadlock
    IF auth.uid() < player_id THEN
        SELECT * INTO v_admin_wallet FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
        SELECT * INTO v_player_wallet FROM public.wallets WHERE user_id = player_id FOR UPDATE;
    ELSE
        SELECT * INTO v_player_wallet FROM public.wallets WHERE user_id = player_id FOR UPDATE;
        SELECT * INTO v_admin_wallet FROM public.wallets WHERE user_id = auth.uid() FOR UPDATE;
    END IF;

    IF v_admin_wallet IS NULL THEN
        RAISE EXCEPTION 'محفظة المشرف غير موجودة';
    END IF;

    IF v_player_wallet IS NULL THEN
        RAISE EXCEPTION 'محفظة اللاعب غير موجودة';
    END IF;

    IF v_admin_wallet.balance < amount THEN
        RAISE EXCEPTION 'رصيدك غير كافٍ لإتمام العملية. الرصيد الحالي: $%', v_admin_wallet.balance;
    END IF;

    -- Deduct from Admin, Add to Player
    UPDATE public.wallets SET balance = balance - amount, updated_at = NOW() WHERE id = v_admin_wallet.id;
    UPDATE public.wallets SET balance = balance + amount, updated_at = NOW() WHERE id = v_player_wallet.id;

    -- Ledger for Admin
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        source_user_id, target_user_id, reference_type, description
    ) VALUES (
        v_admin_wallet.id, auth.uid(), 'ADMIN_TO_PLAYER', amount,
        v_admin_wallet.balance, v_admin_wallet.balance - amount,
        auth.uid(), player_id, 'admin_transfer', 'تحويل رصيد افتراضي للاعب'
    );

    -- Ledger for Player
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        source_user_id, target_user_id, reference_type, description
    ) VALUES (
        v_player_wallet.id, player_id, 'ADMIN_TO_PLAYER', amount,
        v_player_wallet.balance, v_player_wallet.balance + amount,
        auth.uid(), player_id, 'admin_transfer', 'استلام شحن رصيد افتراضي من المشرف'
    );

    -- Notification for Player
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (player_id, 'balance_transfer', 'تم شحن محفظتك', 'تمت إضافة $' || amount::text || ' إلى رصيدك الافتراضي بنجاح');

    -- Activity Log
    INSERT INTO public.activity_logs (user_id, action, target_type, target_id, metadata)
    VALUES (auth.uid(), 'ADMIN_TO_PLAYER', 'player', player_id::text, jsonb_build_object('amount', amount));

    RETURN jsonb_build_object(
        'success', true,
        'new_admin_balance', v_admin_wallet.balance - amount,
        'new_player_balance', v_player_wallet.balance + amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. PLACE MATCH BET RPC (Strict Validation & Row Locking)
CREATE OR REPLACE FUNCTION public.place_match_bet(
    match_id UUID,
    selected_team TEXT,
    amount NUMERIC
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

    IF amount <= 0 THEN
        RAISE EXCEPTION 'قيمة الرهان يجب أن تكون أكبر من 0';
    END IF;

    IF selected_team NOT IN ('team_a', 'team_b', 'draw') THEN
        RAISE EXCEPTION 'الفريق المختار غير صحيح';
    END IF;

    -- Check user active
    SELECT status INTO v_user_status FROM public.profiles WHERE id = v_user_id;
    IF v_user_status <> 'active' THEN
        RAISE EXCEPTION 'حسابك معلق أو محظور، لا يمكنك وضع رهان';
    END IF;

    -- Lock and check match
    SELECT * INTO v_match FROM public.matches WHERE id = match_id;
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
    IF selected_team = 'team_a' THEN
        v_odds := v_match.odds_team_a;
    ELSIF selected_team = 'team_b' THEN
        v_odds := v_match.odds_team_b;
    ELSE
        v_odds := COALESCE(v_match.odds_draw, 3.00);
    END IF;

    v_potential_win := ROUND(amount * v_odds, 2);

    -- Lock player wallet
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
    IF v_wallet IS NULL THEN
        RAISE EXCEPTION 'المحفظة غير موجودة';
    END IF;

    IF v_wallet.balance < amount THEN
        RAISE EXCEPTION 'الرصيد غير كافٍ لوضع هذا الرهان. رصيدك الحالي: $%', v_wallet.balance;
    END IF;

    -- Deduct Bet Amount
    UPDATE public.wallets
    SET balance = balance - amount, updated_at = NOW()
    WHERE id = v_wallet.id;

    -- Insert Bet
    INSERT INTO public.bets (
        user_id, match_id, selected_team, bet_amount, odds, potential_win, status, result
    ) VALUES (
        v_user_id, match_id, selected_team, amount, v_odds, v_potential_win, 'pending', 'pending'
    ) RETURNING id INTO v_bet_id;

    -- Ledger Record
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        reference_type, reference_id, description
    ) VALUES (
        v_wallet.id, v_user_id, 'BET_PLACED', amount,
        v_wallet.balance, v_wallet.balance - amount,
        'match_bet', v_bet_id::text, 'رهان على مباراة: ' || v_match.team_a || ' ضد ' || v_match.team_b
    );

    -- Notification
    INSERT INTO public.notifications (user_id, type, title, message)
    VALUES (v_user_id, 'bet_accepted', 'تم قبول رهانك بنجاح', 'رهان بقيمة $' || amount::text || ' على ' || v_match.team_a || ' ضد ' || v_match.team_b);

    -- Log
    INSERT INTO public.activity_logs (user_id, action, target_type, target_id, metadata)
    VALUES (v_user_id, 'PLACE_BET', 'bet', v_bet_id::text, jsonb_build_object('match_id', match_id, 'amount', amount, 'odds', v_odds));

    RETURN jsonb_build_object(
        'success', true,
        'bet_id', v_bet_id,
        'new_balance', v_wallet.balance - amount,
        'potential_win', v_potential_win
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SETTLE MATCH RPC (Owner or Authorized Admin Only, Idempotent)
CREATE OR REPLACE FUNCTION public.settle_match(
    match_id UUID,
    winning_team TEXT,
    score_a INTEGER DEFAULT 0,
    score_b INTEGER DEFAULT 0
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

    IF winning_team NOT IN ('team_a', 'team_b', 'draw', 'cancelled') THEN
        RAISE EXCEPTION 'النتيجة المحددة غير صحيحة';
    END IF;

    -- Lock Match
    SELECT * INTO v_match FROM public.matches WHERE id = match_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'المباراة غير موجودة';
    END IF;

    IF v_match.status = 'settled' THEN
        RAISE EXCEPTION 'تمت تسوية هذه المباراة مسبقاً ولا يمكن تسويتها مرتين';
    END IF;

    -- Update Match
    UPDATE public.matches
    SET status = 'settled',
        winning_team = winning_team,
        score_team_a = score_a,
        score_team_b = score_b,
        settled_by = auth.uid(),
        settled_at = NOW(),
        updated_at = NOW()
    WHERE id = match_id;

    -- Loop through all pending bets with row lock
    FOR v_bet IN SELECT * FROM public.bets WHERE match_id = match_id AND status = 'pending' FOR UPDATE LOOP
        IF winning_team = 'cancelled' THEN
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

            INSERT INTO public.notifications (user_id, type, title, message)
            VALUES (v_bet.user_id, 'bet_refund', 'تم إلغاء المباراة واسترداد رهانك', 'تم استرداد $' || v_bet.bet_amount::text || ' إلى رصيدك لمباراة ' || v_match.team_a || ' ضد ' || v_match.team_b);

        ELSIF v_bet.selected_team = winning_team THEN
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
            INSERT INTO public.wallet_transactions (
                wallet_id, user_id, type, amount, balance_before, balance_after,
                reference_type, reference_id, description
            ) VALUES (
                (SELECT id FROM public.wallets WHERE user_id = v_bet.user_id),
                v_bet.user_id, 'BET_LOSS', v_bet.bet_amount,
                (SELECT balance FROM public.wallets WHERE user_id = v_bet.user_id),
                (SELECT balance FROM public.wallets WHERE user_id = v_bet.user_id),
                'match_bet_loss', v_bet.id::text, 'خسارة رهان على مباراة: ' || v_match.team_a || ' ضد ' || v_match.team_b
            );
            v_lost_count := v_lost_count + 1;
        END IF;
    END LOOP;

    -- Log
    INSERT INTO public.activity_logs (user_id, action, target_type, target_id, metadata)
    VALUES (auth.uid(), 'SETTLE_MATCH', 'match', match_id::text, jsonb_build_object('winning_team', winning_team, 'won_bets', v_won_count, 'lost_bets', v_lost_count, 'total_paid', v_total_paid));

    RETURN jsonb_build_object(
        'success', true,
        'won_count', v_won_count,
        'lost_count', v_lost_count,
        'total_paid', v_total_paid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. PLAY CASINO GAME (Atomic, Server-Side, Writes to game_history)
CREATE OR REPLACE FUNCTION public.play_game(
    game_slug TEXT,
    bet_amount NUMERIC,
    game_action TEXT DEFAULT 'play',
    choice TEXT DEFAULT NULL
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
        RAISE EXCEPTION 'حسابك غير نشط، لا يمكنك اللعب';
    END IF;

    SELECT * INTO v_game FROM public.games WHERE slug = game_slug AND status = 'active';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'اللعبة غير متوفرة أو معطلة';
    END IF;

    IF bet_amount < v_game.minimum_bet OR bet_amount > v_game.maximum_bet THEN
        RAISE EXCEPTION 'قيمة الرهان يجب أن تكون بين $% و $%', v_game.minimum_bet, v_game.maximum_bet;
    END IF;

    -- Lock player wallet
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;
    IF v_wallet IS NULL THEN
        RAISE EXCEPTION 'محفظتك غير موجودة';
    END IF;

    IF v_wallet.balance < bet_amount THEN
        RAISE EXCEPTION 'الرصيد غير كافٍ. رصيدك الحالي: $%', v_wallet.balance;
    END IF;

    -- Deduct bet amount
    UPDATE public.wallets SET balance = balance - bet_amount, updated_at = NOW() WHERE id = v_wallet.id;

    -- Ledger for bet deduction
    INSERT INTO public.wallet_transactions (
        wallet_id, user_id, type, amount, balance_before, balance_after,
        reference_type, reference_id, description
    ) VALUES (
        v_wallet.id, v_user_id, 'GAME_BET', bet_amount,
        v_wallet.balance, v_wallet.balance - bet_amount,
        'game', v_game.id::text, 'رهان في لعبة ' || v_game.name
    );

    v_random_val := random();

    -- GAME LOGIC
    IF game_slug = 'golden-slots' THEN
        IF v_random_val < 0.05 THEN
            v_slot1 := '🦁'; v_slot2 := '🦁'; v_slot3 := '🦁';
            v_multiplier := 15.00;
            v_is_win := TRUE;
        ELSIF v_random_val < 0.18 THEN
            v_slot1 := '💎'; v_slot2 := '💎'; v_slot3 := '💎';
            v_multiplier := 7.00;
            v_is_win := TRUE;
        ELSIF v_random_val < 0.38 THEN
            v_slot1 := '👑'; v_slot2 := '👑'; v_slot3 := '🍒';
            v_multiplier := 2.50;
            v_is_win := TRUE;
        ELSE
            v_slot1 := v_symbols[1 + floor(random() * 4)::int];
            v_slot2 := v_symbols[5 + floor(random() * 2)::int];
            v_slot3 := v_symbols[1 + floor(random() * 7)::int];
            v_is_win := FALSE;
        END IF;
        v_game_result := jsonb_build_object('reels', jsonb_build_array(v_slot1, v_slot2, v_slot3));

    ELSIF game_slug = 'lucky-wheel' THEN
        v_wheel_number := floor(random() * 8)::int;
        IF v_wheel_number = 7 THEN v_multiplier := 10.00; v_is_win := TRUE;
        ELSIF v_wheel_number = 5 THEN v_multiplier := 5.00; v_is_win := TRUE;
        ELSIF v_wheel_number = 3 THEN v_multiplier := 2.00; v_is_win := TRUE;
        ELSIF v_wheel_number = 1 THEN v_multiplier := 1.50; v_is_win := TRUE;
        ELSE v_multiplier := 0.00; v_is_win := FALSE; END IF;
        v_game_result := jsonb_build_object('segment', v_wheel_number, 'multiplier', v_multiplier);

    ELSIF game_slug = 'dice-room' THEN
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

    -- Win calculation
    IF v_is_win AND v_multiplier > 0 THEN
        v_payout := ROUND(bet_amount * v_multiplier, 2);
        UPDATE public.wallets SET balance = balance + v_payout, updated_at = NOW() WHERE id = v_wallet.id;

        INSERT INTO public.wallet_transactions (
            wallet_id, user_id, type, amount, balance_before, balance_after,
            reference_type, reference_id, description
        ) VALUES (
            v_wallet.id, v_user_id, 'GAME_WIN', v_payout,
            v_wallet.balance - bet_amount, v_wallet.balance - bet_amount + v_payout,
            'game_win', v_game.id::text, 'فوز في لعبة ' || v_game.name || ' (مضاعف ' || v_multiplier || 'x)'
        );

        INSERT INTO public.notifications (user_id, type, title, message)
        VALUES (v_user_id, 'game_win', 'فوز في ' || v_game.name, 'ربحت $' || v_payout::text || ' بمضاعف ' || v_multiplier::text || 'x!');
    END IF;

    -- Record into game_history
    INSERT INTO public.game_history (
        user_id, game_id, bet_amount, multiplier, payout, result, game_data
    ) VALUES (
        v_user_id, v_game.id, bet_amount, v_multiplier, v_payout,
        CASE WHEN v_is_win THEN 'win' ELSE 'loss' END,
        v_game_result
    );

    -- Get current final balance
    SELECT balance INTO v_new_balance FROM public.wallets WHERE id = v_wallet.id;

    -- Log
    INSERT INTO public.activity_logs (user_id, action, target_type, target_id, metadata)
    VALUES (v_user_id, 'GAME_PLAY', 'game', v_game.id::text, jsonb_build_object('bet', bet_amount, 'is_win', v_is_win, 'payout', v_payout));

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

-- Backward compatibility alias
CREATE OR REPLACE FUNCTION public.play_casino_game(
    p_game_slug TEXT,
    p_bet_amount NUMERIC,
    p_game_action TEXT DEFAULT 'spin',
    p_choice TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
    RETURN public.play_game(p_game_slug, p_bet_amount, p_game_action, p_choice);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. REALTIME PUBLICATION
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_history;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
