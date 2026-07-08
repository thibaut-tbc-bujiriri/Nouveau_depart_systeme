-- 1. Créer la table daily_verses
CREATE TABLE IF NOT EXISTS public.daily_verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verse_reference TEXT NOT NULL,
  verse_text TEXT NOT NULL,
  inspirational_message TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, inactive, expired
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Activer la sécurité RLS sur la table
ALTER TABLE public.daily_verses ENABLE ROW LEVEL SECURITY;

-- 3. Politique RLS pour SELECT : tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Allow authenticated users to read daily_verses"
ON public.daily_verses
FOR SELECT
TO authenticated
USING (true);

-- 4. Politique RLS pour les écritures (INSERT/UPDATE/DELETE) : réservée au Super Admin
CREATE POLICY "Allow Super Admin to write daily_verses"
ON public.daily_verses
FOR ALL
TO authenticated
USING (
  (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
)
WITH CHECK (
  (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
);
