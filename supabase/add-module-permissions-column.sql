-- Ajoutez la colonne module_permissions à la table app_settings pour stocker les configurations de permissions des rôles.
-- Ce script est à exécuter dans l'éditeur SQL de votre tableau de bord Supabase (https://supabase.com) si vous souhaitez créer la colonne dédiée.
-- Note: Le système possède déjà un mécanisme de repli automatique dans la colonne 'metadata' si cette colonne n'est pas créée.

ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS module_permissions JSONB;
