-- ==============================================================================================
-- SETUP SUPABASE SAAS DATABASE — Version 2.2 (Aligned with Controllers + Multi-Session)
-- Execute this entire script in your Supabase SQL Editor
--
-- v2.1: fixed %I identifier quoting — %I must wrap the FULL table name (built as text
-- BEFORE format()), not just the school_slug suffix. The old 'students_%I' pattern
-- produced invalid SQL (e.g. public.students_"sainte-marie") for any slug containing
-- a hyphen, silently breaking school creation for hyphenated slugs.
--
-- v2.2: locked create_school_tables/drop_school_tables/get_all_school_slugs down to
-- service_role only (step 8 below — they default to PUBLIC/anon/authenticated execute
-- grants on creation, exposing them over the public REST API otherwise); pinned a
-- stable search_path on all three (SECURITY DEFINER + mutable search_path is a known
-- privilege-escalation vector); every per-school table now gets RLS enabled (no policy —
-- the backend always uses service_role, which bypasses RLS regardless); added
-- pays_indicatif to app_settings (Togo '228' default, Congo '242' supported) and fixed
-- the app_name default (was 'EduFinance', an old product name); added a CHECK constraint
-- on schools.slug matching the Joi pattern used at every entry point.
-- ==============================================================================================

-- 1. Create the global superadmins table
CREATE TABLE IF NOT EXISTS public.superadmins (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nom text NOT NULL,
    telephone text UNIQUE NOT NULL,
    password text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 2. Create the global schools table
CREATE TABLE IF NOT EXISTS public.schools (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    address text,
    phone text,
    email text,
    status text DEFAULT 'trial',
    trial_ends_at timestamptz,
    accepted_terms boolean DEFAULT false,
    accepted_privacy_policy boolean DEFAULT false,
    marketing_consent boolean DEFAULT false,
    consented_at timestamptz,
    signup_ip_hash text,
    logo_url text,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT schools_slug_format_check CHECK (slug ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$')
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;

-- 3. Drop old versions of functions before recreating them
DROP FUNCTION IF EXISTS public.create_school_tables(text);
DROP FUNCTION IF EXISTS public.drop_school_tables(text);

-- 4. Create the RPC function to create tables for a new school
CREATE OR REPLACE FUNCTION public.create_school_tables(school_slug text)
RETURNS void AS $$
DECLARE
    tbl text;
    tbl_names text[] := ARRAY[
        'school_years_','profiles_','students_','payments_','parent_student_','presences_',
        'activity_logs_','matieres_','classe_matieres_','notes_','badges_','announcements_',
        'announcement_reads_','conversations_','messages_','app_settings_','push_subscriptions_','personnel_'
    ];
BEGIN
    -- ── school_years ─────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            name text UNIQUE NOT NULL,
            status text DEFAULT ''active'',
            created_at timestamptz DEFAULT now()
        )
    ', 'school_years_' || school_slug);

    -- Insérer les sessions scolaires par défaut
    EXECUTE format('
        INSERT INTO %I (name, status)
        VALUES (''2025-2026'', ''active''), (''2026-2027'', ''active'')
        ON CONFLICT (name) DO NOTHING
    ', 'school_years_' || school_slug);

    -- ── profiles ────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            nom text NOT NULL,
            telephone text UNIQUE,
            password text,
            role text,
            accepted_terms boolean,
            accepted_privacy_policy boolean,
            marketing_consent boolean,
            consented_at timestamptz,
            signup_ip_hash text,
            push_subscription jsonb,
            created_at timestamptz DEFAULT now()
        )
    ', 'profiles_' || school_slug);

    -- ── students ─────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            nom text NOT NULL,
            prenom text DEFAULT '''',
            classe text DEFAULT ''Inconnue'',
            cycle text DEFAULT ''Primaire'',
            ecolage numeric DEFAULT 0,
            deja_paye numeric DEFAULT 0,
            restant numeric DEFAULT 0,
            status text DEFAULT ''Non soldé'',
            telephone_parent text,
            sexe text DEFAULT ''M'',
            redoublant boolean DEFAULT false,
            ecole_provenance text DEFAULT '''',
            date_naissance date,
            adsn text,
            photo_url text,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', 'students_' || school_slug);

    -- ── payments ─────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            student_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            montant numeric NOT NULL,
            date date,
            recu text,
            note text,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', 'payments_' || school_slug, 'students_' || school_slug);

    -- ── parent_student mapping ────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            parent_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            student_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            created_at timestamptz DEFAULT now(),
            UNIQUE(parent_id, student_id)
        )
    ', 'parent_student_' || school_slug, 'profiles_' || school_slug, 'students_' || school_slug);

    -- ── presences ─────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            student_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            eleve_nom text,
            eleve_prenom text,
            eleve_classe text,
            date date NOT NULL,
            heure text,
            statut text NOT NULL DEFAULT ''Entrée'',
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', 'presences_' || school_slug, 'students_' || school_slug);

    -- ── activity_logs ─────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            utilisateur text,
            utilisateur_role text,
            action text NOT NULL,
            description text,
            date_heure timestamptz DEFAULT now(),
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', 'activity_logs_' || school_slug);

    -- ── matieres ─────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            nom text NOT NULL,
            categorie text,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', 'matieres_' || school_slug);

    -- ── classe_matieres ───────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            classe text NOT NULL,
            matiere_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            professeur text DEFAULT '''',
            coefficient numeric DEFAULT 1,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', 'classe_matieres_' || school_slug, 'matieres_' || school_slug);

    -- ── notes ────────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            eleve_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            matiere_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            periode text,
            note_classe numeric,
            note_devoir numeric,
            note_compo numeric,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', 'notes_' || school_slug, 'students_' || school_slug, 'matieres_' || school_slug);

    -- ── badges ───────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            parent_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            student_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            code text,
            label text NOT NULL,
            description text,
            icon text,
            earned_at timestamptz DEFAULT now(),
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', 'badges_' || school_slug, 'profiles_' || school_slug, 'students_' || school_slug);

    -- ── announcements ─────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            titre text NOT NULL,
            message text NOT NULL,
            cible text DEFAULT ''all'',
            importance text DEFAULT ''info'',
            created_by text DEFAULT ''Admin'',
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', 'announcements_' || school_slug);

    -- ── announcement_reads ────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            announcement_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            parent_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            read_at timestamptz,
            remind_at timestamptz,
            created_at timestamptz DEFAULT now(),
            UNIQUE(announcement_id, parent_id)
        )
    ', 'announcement_reads_' || school_slug, 'announcements_' || school_slug, 'profiles_' || school_slug);

    -- ── conversations ─────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            parent_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            admin_role text DEFAULT ''administration'',
            last_message text,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now(),
            UNIQUE(parent_id, admin_role)
        )
    ', 'conversations_' || school_slug, 'profiles_' || school_slug);

    -- ── messages ─────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            conversation_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            sender_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            message_text text,
            image_url text,
            read_status boolean DEFAULT false,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', 'messages_' || school_slug, 'conversations_' || school_slug, 'profiles_' || school_slug);

    -- ── app_settings ─────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id text PRIMARY KEY DEFAULT ''global_settings'',
            app_name text DEFAULT ''GestioSchool'',
            school_name text DEFAULT ''Établissement Scolaire'',
            school_year text DEFAULT ''2025-2026'',
            pays_indicatif text DEFAULT ''228'',
            school_logo text,
            school_stamp text,
            message_remerciement text,
            message_rappel text,
            tranches jsonb DEFAULT ''[]''::jsonb,
            updated_at timestamptz DEFAULT now()
        )
    ', 'app_settings_' || school_slug);

    -- ── push_subscriptions ────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            parent_id uuid REFERENCES %I(id) ON DELETE CASCADE,
            subscription jsonb NOT NULL,
            created_at timestamptz DEFAULT now(),
            UNIQUE(parent_id)
        )
    ', 'push_subscriptions_' || school_slug, 'profiles_' || school_slug);

    -- ── personnel ─────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            nom text NOT NULL,
            prenom text,
            role text NOT NULL,
            telephone text,
            email text,
            specialite text,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', 'personnel_' || school_slug);

    -- ── Isolation : RLS activé sans policy sur toutes les tables de l'école ──
    -- Le backend utilise toujours service_role (bypass RLS) ; ceci bloque
    -- uniquement l'accès direct anon/authenticated via l'API REST Supabase.
    FOREACH tbl IN ARRAY tbl_names LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl || school_slug);
    END LOOP;

    -- Reload schema cache for PostgREST so the new tables are immediately accessible
    NOTIFY pgrst, 'reload schema';

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 5. Create the RPC function to drop tables when a school is deleted
CREATE OR REPLACE FUNCTION public.drop_school_tables(school_slug text)
RETURNS void AS $$
BEGIN
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'personnel_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'push_subscriptions_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'app_settings_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'messages_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'conversations_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'announcement_reads_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'announcements_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'badges_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'notes_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'classe_matieres_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'matieres_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'activity_logs_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'presences_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'parent_student_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'payments_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'students_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'profiles_' || school_slug);
    EXECUTE format('DROP TABLE IF EXISTS %I CASCADE', 'school_years_' || school_slug);

    -- Reload schema cache for PostgREST
    NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 6. Helper function: get all school slugs
CREATE OR REPLACE FUNCTION public.get_all_school_slugs()
RETURNS TABLE(slug text) AS $$
BEGIN
    RETURN QUERY SELECT s.slug FROM public.schools s;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 7. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';

-- 8. Restrict these SECURITY DEFINER functions to service_role only — they
-- default to PUBLIC + anon + authenticated execute grants on creation, which
-- would let anyone call them unauthenticated via the Supabase REST API
-- (e.g. POST /rest/v1/rpc/drop_school_tables with any slug).
REVOKE EXECUTE ON FUNCTION public.create_school_tables(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.drop_school_tables(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_all_school_slugs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_school_tables(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.drop_school_tables(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_all_school_slugs() TO service_role;
