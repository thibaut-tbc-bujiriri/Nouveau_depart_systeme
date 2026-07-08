-- 1. Créer la table activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_role TEXT,
  action_type TEXT NOT NULL,
  module TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'success',
  target_id UUID,
  target_name TEXT,
  extension_id UUID,
  department_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Activer la sécurité RLS sur la table activity_logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. Politique RLS pour INSERT : tout utilisateur authentifié peut écrire ses propres logs
CREATE POLICY "Allow authenticated users to insert activity logs"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 4. Politique RLS pour SELECT : lecture selon le rôle et l'extension/département
CREATE POLICY "Allow users to view activity logs based on role"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (
  -- Super Admin voit tous les logs
  (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
  OR
  -- Admin voit les logs de son extension
  (
    (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (
      extension_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
      OR extension_id IS NULL
    )
  )
  OR
  -- Responsable Département voit les logs de son département
  (
    (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'department_manager'
    AND (
      department_id IN (
        SELECT department_id FROM public.department_members WHERE profile_id = auth.uid()
      )
      OR (user_id = auth.uid())
    )
  )
  OR
  -- Membre Département ou autre voit ses propres logs
  (user_id = auth.uid())
);
