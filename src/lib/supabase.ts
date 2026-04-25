import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';

// Charger les variables d'environnement
config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY);

const app = express();
app.use(express.json());

app.post('/update-password', async (req: Request, res: Response) => {
  try {
    console.log('Requête reçue:', req.body);
    const { userId, password } = req.body;

    if (!userId || !password) {
      console.error('Paramètres manquants:', { userId, password });
      return res.status(400).json({ error: 'Paramètres manquants: userId et password requis.' });
    }

    // Créer un client admin avec la clé de service
    console.log('Création du client Supabase...');
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    console.log('Mise à jour du mot de passe pour userId:', userId);
    // Mettre à jour le mot de passe de l'utilisateur
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password,
    });

    if (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Mot de passe mis à jour avec succès pour userId:', userId);
    return res.status(200).json({ success: true, message: 'Mot de passe mis à jour avec succès.' });
  } catch (err) {
    // Ajout d'un log détaillé pour afficher l'erreur réelle
    console.error('Erreur interne du serveur:', err instanceof Error ? err.stack : err);
    return res.status(500).json({ error: 'Erreur interne du serveur.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});