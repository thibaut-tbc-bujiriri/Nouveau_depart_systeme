-- 1. Ajout de la colonne avatar_url aux tables nécessaires
ALTER TABLE branches ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE church_members ADD COLUMN IF NOT EXISTS avatar_url text;

-- 2. Création du bucket 'photos' dans le Storage de Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Politiques d'accès (RLS) pour le bucket 'photos'
-- Politique de lecture publique pour tout le monde
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'photos' );

-- Politique d'insertion pour les utilisateurs authentifiés
CREATE POLICY "Authenticated User Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'photos' );

-- Politique de modification pour les utilisateurs authentifiés sur leurs fichiers
CREATE POLICY "Authenticated User Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'photos' )
WITH CHECK ( bucket_id = 'photos' );

-- Politique de suppression pour les utilisateurs authentifiés sur leurs fichiers
CREATE POLICY "Authenticated User Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'photos' );
