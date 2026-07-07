-- Ajoutez la colonne exchange_rate à la table app_settings pour stocker le taux de change USD -> CDF.
-- Ce script est à exécuter dans l'éditeur SQL de votre tableau de bord Supabase (https://supabase.com).

ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 2500;
