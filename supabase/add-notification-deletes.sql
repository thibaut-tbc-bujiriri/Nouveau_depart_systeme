-- 1. Créer la table notification_deletes pour suivre les suppressions par utilisateur
CREATE TABLE IF NOT EXISTS public.notification_deletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- 2. Activer RLS sur la table notification_deletes
ALTER TABLE public.notification_deletes ENABLE ROW LEVEL SECURITY;

-- 3. Politiques RLS pour notification_deletes
CREATE POLICY "Allow users to view their own deletes"
ON public.notification_deletes FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert their own deletes"
ON public.notification_deletes FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4. Recréer la politique SELECT pour notifications en filtrant les lignes supprimées
DROP POLICY IF EXISTS "Allow users to view notifications targeting them" ON public.notifications;

CREATE POLICY "Allow users to view notifications targeting them"
ON public.notifications
FOR SELECT
TO authenticated
USING (
  (
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
  )
  -- Exclure les notifications supprimées logiquement par l'utilisateur
  AND NOT EXISTS (
    SELECT 1 FROM public.notification_deletes
    WHERE notification_id = id AND user_id = auth.uid()
  )
);

-- 5. Recréer la politique UPDATE pour notifications en filtrant les lignes supprimées
DROP POLICY IF EXISTS "Allow users to update notifications targeting them" ON public.notifications;

CREATE POLICY "Allow users to update notifications targeting them"
ON public.notifications
FOR UPDATE
TO authenticated
USING (
  (
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
  -- Exclure les notifications supprimées logiquement par l'utilisateur
  AND NOT EXISTS (
    SELECT 1 FROM public.notification_deletes
    WHERE notification_id = id AND user_id = auth.uid()
  )
)
WITH CHECK (
  true
);

-- 6. Fonction RPC pour supprimer toutes les notifications visibles pour l'utilisateur en un seul appel
CREATE OR REPLACE FUNCTION public.delete_all_notifications_for_user()
RETURNS void AS $$
BEGIN
  INSERT INTO public.notification_deletes (notification_id, user_id)
  SELECT id, auth.uid()
  FROM public.notifications
  ON CONFLICT (notification_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;
