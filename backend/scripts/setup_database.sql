-- ==============================================================================================
-- SETUP SUPABASE SAAS DATABASE — Version 2.0 (Aligned with Controllers + Multi-Session)
-- Execute this entire script in your Supabase SQL Editor
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
    created_at timestamptz DEFAULT now()
);

-- 3. Drop old versions of functions before recreating them
DROP FUNCTION IF EXISTS public.create_school_tables(text);
DROP FUNCTION IF EXISTS public.drop_school_tables(text);

-- 4. Create the RPC function to create tables for a new school
CREATE OR REPLACE FUNCTION public.create_school_tables(school_slug text)
RETURNS void AS $$
BEGIN
    -- ── profiles ────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.profiles_%I (
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
    ', school_slug);

    -- ── students ─────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.students_%I (
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
    ', school_slug);

    -- ── payments ─────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.payments_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            student_id uuid REFERENCES public.students_%I(id) ON DELETE CASCADE,
            montant numeric NOT NULL,
            date date,
            recu text,
            note text,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug);

    -- ── parent_student mapping ────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.parent_student_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            parent_id uuid REFERENCES public.profiles_%I(id) ON DELETE CASCADE,
            student_id uuid REFERENCES public.students_%I(id) ON DELETE CASCADE,
            created_at timestamptz DEFAULT now(),
            UNIQUE(parent_id, student_id)
        )
    ', school_slug, school_slug, school_slug);

    -- ── presences ─────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.presences_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            student_id uuid REFERENCES public.students_%I(id) ON DELETE CASCADE,
            eleve_nom text,
            eleve_prenom text,
            eleve_classe text,
            date date NOT NULL,
            heure text,
            statut text NOT NULL DEFAULT ''Entrée'',
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug);

    -- ── activity_logs ─────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.activity_logs_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            utilisateur text,
            utilisateur_role text,
            action text NOT NULL,
            description text,
            date_heure timestamptz DEFAULT now(),
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', school_slug);

    -- ── matieres ─────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.matieres_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            nom text NOT NULL,
            categorie text,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', school_slug);

    -- ── classe_matieres ───────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.classe_matieres_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            classe text NOT NULL,
            matiere_id uuid REFERENCES public.matieres_%I(id) ON DELETE CASCADE,
            professeur text DEFAULT '''',
            coefficient numeric DEFAULT 1,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug);

    -- ── notes ────────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.notes_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            eleve_id uuid REFERENCES public.students_%I(id) ON DELETE CASCADE,
            matiere_id uuid REFERENCES public.matieres_%I(id) ON DELETE CASCADE,
            periode text,
            note_classe numeric,
            note_devoir numeric,
            note_compo numeric,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug, school_slug);

    -- ── badges ───────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.badges_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            parent_id uuid REFERENCES public.profiles_%I(id) ON DELETE CASCADE,
            student_id uuid REFERENCES public.students_%I(id) ON DELETE CASCADE,
            code text,
            label text NOT NULL,
            description text,
            icon text,
            earned_at timestamptz DEFAULT now(),
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug, school_slug);

    -- ── announcements ─────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.announcements_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            titre text NOT NULL,
            message text NOT NULL,
            cible text DEFAULT ''all'',
            importance text DEFAULT ''info'',
            created_by text DEFAULT ''Admin'',
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', school_slug);

    -- ── announcement_reads ────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.announcement_reads_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            announcement_id uuid REFERENCES public.announcements_%I(id) ON DELETE CASCADE,
            parent_id uuid REFERENCES public.profiles_%I(id) ON DELETE CASCADE,
            read_at timestamptz,
            remind_at timestamptz,
            created_at timestamptz DEFAULT now(),
            UNIQUE(announcement_id, parent_id)
        )
    ', school_slug, school_slug, school_slug);

    -- ── conversations ─────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.conversations_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            parent_id uuid REFERENCES public.profiles_%I(id) ON DELETE CASCADE,
            admin_role text DEFAULT ''administration'',
            last_message text,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now(),
            updated_at timestamptz DEFAULT now(),
            UNIQUE(parent_id, admin_role)
        )
    ', school_slug, school_slug);

    -- ── messages ─────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.messages_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            conversation_id uuid REFERENCES public.conversations_%I(id) ON DELETE CASCADE,
            sender_id uuid REFERENCES public.profiles_%I(id) ON DELETE CASCADE,
            message_text text,
            image_url text,
            read_status boolean DEFAULT false,
            school_year text DEFAULT ''2025-2026'',
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug, school_slug);

    -- ── app_settings ─────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.app_settings_%I (
            id text PRIMARY KEY DEFAULT ''global_settings'',
            app_name text DEFAULT ''EduFinance'',
            school_name text DEFAULT ''Établissement Scolaire'',
            school_year text DEFAULT ''2025-2026'',
            school_logo text,
            school_stamp text,
            message_remerciement text,
            message_rappel text,
            tranches jsonb DEFAULT ''[]''::jsonb,
            updated_at timestamptz DEFAULT now()
        )
    ', school_slug);

    -- ── push_subscriptions ────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.push_subscriptions_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            parent_id uuid REFERENCES public.profiles_%I(id) ON DELETE CASCADE,
            subscription jsonb NOT NULL,
            created_at timestamptz DEFAULT now(),
            UNIQUE(parent_id)
        )
    ', school_slug, school_slug);

    -- ── personnel ─────────────────────────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.personnel_%I (
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
    ', school_slug);

    -- Reload schema cache for PostgREST so the new tables are immediately accessible
    NOTIFY pgrst, 'reload schema';

END;
$$ LANGUAGE plpgsql;

-- 5. Create the RPC function to drop tables when a school is deleted
CREATE OR REPLACE FUNCTION public.drop_school_tables(school_slug text)
RETURNS void AS $$
BEGIN
    EXECUTE format('DROP TABLE IF EXISTS public.personnel_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.push_subscriptions_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.app_settings_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.messages_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.conversations_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.announcement_reads_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.announcements_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.badges_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.notes_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.classe_matieres_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.matieres_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.activity_logs_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.presences_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.parent_student_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.payments_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.students_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.profiles_%I CASCADE', school_slug);

    -- Reload schema cache for PostgREST
    NOTIFY pgrst, 'reload schema';
END;
$$ LANGUAGE plpgsql;

-- 6. Helper function: get all school slugs
CREATE OR REPLACE FUNCTION public.get_all_school_slugs()
RETURNS TABLE(slug text) AS $$
BEGIN
    RETURN QUERY SELECT s.slug FROM public.schools s;
END;
$$ LANGUAGE plpgsql;

-- 7. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
