-- Activez la politique RLS pour permettre aux responsables de département de modifier leur propre budget.
-- Ce script est à exécuter dans l'éditeur SQL de votre tableau de bord Supabase (https://supabase.com).

-- 1. Supprimer l'ancienne politique si elle existe
DROP POLICY IF EXISTS "Allow department managers to update their own department budget" ON public.departments;

-- 2. Créer la nouvelle politique d'autorisation de mise à jour pour les responsables
CREATE POLICY "Allow department managers to update their own department budget"
ON public.departments
FOR UPDATE
TO authenticated
USING (
  manager_profile_id = auth.uid()
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin', 'admin')
)
WITH CHECK (
  manager_profile_id = auth.uid()
  OR
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('superadmin', 'admin')
);
