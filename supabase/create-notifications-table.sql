-- Activez la politique RLS pour gérer la table de notifications
-- Ce script est à exécuter dans l'éditeur SQL de votre tableau de bord Supabase (https://supabase.com).

-- 1. Création de la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT DEFAULT 'normal'::text,
  target_role TEXT, -- superadmin, admin, department_manager, department_member
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_extension_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  target_department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  link TEXT,
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Activation de la sécurité RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les anciennes politiques si existantes
DROP POLICY IF EXISTS "Allow users to view notifications targeting them" ON public.notifications;
DROP POLICY IF EXISTS "Allow users to update notifications targeting them" ON public.notifications;
DROP POLICY IF EXISTS "Allow authenticated users to insert notifications" ON public.notifications;

-- 4. Politique pour SELECT : lecture filtrée selon le rôle et les cibles
CREATE POLICY "Allow users to view notifications targeting them"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  -- Notification globale (tous les critères de ciblage sont nuls)
  (target_role IS NULL AND target_user_id IS NULL AND target_extension_id IS NULL AND target_department_id IS NULL)
  OR
  -- Destinée spécifiquement à cet utilisateur
  (target_user_id = auth.uid())
  OR
  -- Super Admin voit tout SAUF ce qui est personnellement adressé à quelqu'un d'autre
  (
    (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
    AND (target_user_id IS NULL OR target_user_id = auth.uid())
  )
  OR
  -- Admin voit ce qui concerne son extension (branch_id) ou cible son rôle globalement
  (
    (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'admin'
    AND (target_role IS NULL OR target_role = 'admin')
    AND (
      target_extension_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
      OR target_extension_id IS NULL
    )
  )
  OR
  -- Responsable Département voit ce qui concerne ses départements ou son extension
  (
    (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'department_manager'
    AND (target_role IS NULL OR target_role = 'department_manager')
    AND (
      target_department_id IN (
        SELECT department_id FROM public.department_members WHERE profile_id = auth.uid()
      )
      OR (target_extension_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()) AND target_department_id IS NULL)
      OR (target_extension_id IS NULL AND target_department_id IS NULL)
    )
  )
  OR
  -- Membre Département voit ce qui concerne ses départements
  (
    (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'department_member'
    AND (target_role IS NULL OR target_role = 'department_member')
    AND (
      target_department_id IN (
        SELECT department_id FROM public.department_members WHERE profile_id = auth.uid()
      )
      OR (target_extension_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid()) AND target_department_id IS NULL)
      OR (target_extension_id IS NULL AND target_department_id IS NULL)
    )
  )
);

-- 5. Politique pour UPDATE : permettre de marquer comme lu
CREATE POLICY "Allow users to update notifications targeting them"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  target_user_id = auth.uid()
  OR (
    (target_role IS NULL OR target_role = (SELECT role::text FROM public.profiles WHERE id = auth.uid()))
    AND (
      target_extension_id = (SELECT branch_id FROM public.profiles WHERE id = auth.uid())
      OR target_department_id IN (
        SELECT department_id FROM public.department_members WHERE profile_id = auth.uid()
      )
      OR (target_extension_id IS NULL AND target_department_id IS NULL)
    )
  )
  OR (
    (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'superadmin'
    AND (target_user_id IS NULL OR target_user_id = auth.uid())
  )
)
WITH CHECK (
  true
);

-- 6. Politique pour INSERT : tout utilisateur authentifié peut générer des notifications
CREATE POLICY "Allow authenticated users to insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  true
);
