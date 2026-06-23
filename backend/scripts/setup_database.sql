-- ==============================================================================================
-- SETUP SUPABASE SAAS DATABASE
-- Execute this entire script in your Supabase SQL Editor
-- ==============================================================================================

-- 1. Create the global schools table
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

-- 2. Create the RPC function to create tables for a new school
CREATE OR REPLACE FUNCTION public.create_school_tables(school_slug text)
RETURNS void AS $$
BEGIN
    -- profiles
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
            created_at timestamptz DEFAULT now()
        )
    ', school_slug);

    -- students
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.students_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            nom text NOT NULL,
            prenom text,
            classe text,
            cycle text,
            ecolage numeric DEFAULT 0,
            deja_paye numeric DEFAULT 0,
            restant numeric DEFAULT 0,
            status text DEFAULT ''actif'',
            telephone_parent text,
            created_at timestamptz DEFAULT now()
        )
    ', school_slug);

    -- payments
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.payments_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            student_id uuid REFERENCES public.students_%I(id) ON DELETE CASCADE,
            montant numeric NOT NULL,
            date date,
            recu text,
            note text,
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug);

    -- parent_student mapping
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.parent_student_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            parent_id uuid REFERENCES public.profiles_%I(id) ON DELETE CASCADE,
            student_id uuid REFERENCES public.students_%I(id) ON DELETE CASCADE,
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug, school_slug);

    -- presences
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.presences_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            student_id uuid REFERENCES public.students_%I(id) ON DELETE CASCADE,
            date date NOT NULL,
            status text NOT NULL,
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug);

    -- activity_logs
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.activity_logs_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id uuid,
            action text NOT NULL,
            details jsonb,
            created_at timestamptz DEFAULT now()
        )
    ', school_slug);

    -- matieres
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.matieres_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            nom text NOT NULL,
            coefficient numeric DEFAULT 1,
            created_at timestamptz DEFAULT now()
        )
    ', school_slug);

    -- classe_matieres
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.classe_matieres_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            classe text NOT NULL,
            matiere_id uuid REFERENCES public.matieres_%I(id) ON DELETE CASCADE,
            professeur_id uuid REFERENCES public.profiles_%I(id) ON DELETE SET NULL,
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug, school_slug);

    -- notes
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.notes_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            eleve_id uuid REFERENCES public.students_%I(id) ON DELETE CASCADE,
            matiere_id uuid REFERENCES public.matieres_%I(id) ON DELETE CASCADE,
            valeur numeric NOT NULL,
            type_evaluation text,
            periode text,
            date date,
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug, school_slug);

    -- badges
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.badges_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            student_id uuid REFERENCES public.students_%I(id) ON DELETE CASCADE,
            titre text NOT NULL,
            description text,
            icon text,
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug);

    -- announcements
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.announcements_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            titre text NOT NULL,
            contenu text NOT NULL,
            auteur_id uuid REFERENCES public.profiles_%I(id) ON DELETE SET NULL,
            cible text,
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug);

    -- announcement_reads
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.announcement_reads_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            announcement_id uuid REFERENCES public.announcements_%I(id) ON DELETE CASCADE,
            user_id uuid REFERENCES public.profiles_%I(id) ON DELETE CASCADE,
            read_at timestamptz DEFAULT now(),
            UNIQUE(announcement_id, user_id)
        )
    ', school_slug, school_slug, school_slug);

    -- messages
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.messages_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            expediteur_id uuid REFERENCES public.profiles_%I(id) ON DELETE CASCADE,
            destinataire_id uuid REFERENCES public.profiles_%I(id) ON DELETE CASCADE,
            contenu text NOT NULL,
            lu boolean DEFAULT false,
            created_at timestamptz DEFAULT now()
        )
    ', school_slug, school_slug, school_slug);

    -- app_settings
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS public.app_settings_%I (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            key text UNIQUE NOT NULL,
            value jsonb NOT NULL,
            updated_at timestamptz DEFAULT now()
        )
    ', school_slug);

    -- Reload schema cache for PostgREST so the new tables are immediately accessible
    NOTIFY pgrst, 'reload schema';

END;
$$ LANGUAGE plpgsql;

-- 3. Create the RPC function to drop tables when a school is deleted
CREATE OR REPLACE FUNCTION public.drop_school_tables(school_slug text)
RETURNS void AS $$
BEGIN
    EXECUTE format('DROP TABLE IF EXISTS public.app_settings_%I CASCADE', school_slug);
    EXECUTE format('DROP TABLE IF EXISTS public.messages_%I CASCADE', school_slug);
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

-- 4. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
