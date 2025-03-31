const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const app = express();
const PORT = process.env.PORT || 3000;
const SUPABASE_URL = 'https://ekjgfiyhkythqcnmhzea.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4';

// Initialiser Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/annonces', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'annonces.html'));
});

app.get('/annonce/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'announcement-detail.html'));
});

// API pour les annonces
app.get('/api/announcements', async (req, res) => {
    try {
        const category = req.query.category || 'all';
        
        let query = supabase
            .from('announcements')
            .select('*')
            .eq('status', 'approved')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });
            
        if (category !== 'all') {
            query = query.eq('category', category);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        res.json(data);
    } catch (error) {
        console.error('Erreur API annonces:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/api/announcements/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('announcements')
            .select('*')
            .eq('id', req.params.id)
            .single();
            
        if (error) throw error;
        
        if (!data) {
            return res.status(404).json({ error: 'Annonce introuvable' });
        }
        
        res.json(data);
    } catch (error) {
        console.error('Erreur API détail annonce:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Gestion des annonces (POST, PUT, DELETE)
app.post('/api/announcements', async (req, res) => {
    try {
        // Valider les données
        const { title, description, category, price, location, contact, user_id, image_url } = req.body;
        
        if (!title || !description || !category || !location || !contact || !user_id) {
            return res.status(400).json({ error: 'Données manquantes' });
        }
        
        // Créer l'annonce
        const { data, error } = await supabase
            .from('announcements')
            .insert({
                title,
                description,
                category,
                price,
                location,
                contact,
                user_id,
                image_url,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'pending'
            })
            .select();
            
        if (error) throw error;
        
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Erreur création annonce:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.put('/api/announcements/:id', async (req, res) => {
    try {
        const { title, description, category, price, location, contact, image_url } = req.body;
        const { user_id } = req.query;
        
        // Vérifier si l'utilisateur est le propriétaire
        const { data: announcementData, error: fetchError } = await supabase
            .from('announcements')
            .select('user_id')
            .eq('id', req.params.id)
            .single();
            
        if (fetchError) throw fetchError;
        
        if (!announcementData) {
            return res.status(404).json({ error: 'Annonce introuvable' });
        }
        
        if (announcementData.user_id !== user_id) {
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        // Mettre à jour l'annonce
        const { data, error } = await supabase
            .from('announcements')
            .update({
                title,
                description,
                category,
                price,
                location,
                contact,
                image_url
            })
            .eq('id', req.params.id)
            .select();
            
        if (error) throw error;
        
        res.json(data[0]);
    } catch (error) {
        console.error('Erreur mise à jour annonce:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.delete('/api/announcements/:id', async (req, res) => {
    try {
        const { user_id } = req.query;
        
        // Vérifier si l'utilisateur est le propriétaire
        const { data: announcementData, error: fetchError } = await supabase
            .from('announcements')
            .select('user_id')
            .eq('id', req.params.id)
            .single();
            
        if (fetchError) throw fetchError;
        
        if (!announcementData) {
            return res.status(404).json({ error: 'Annonce introuvable' });
        }
        
        if (announcementData.user_id !== user_id) {
            return res.status(403).json({ error: 'Non autorisé' });
        }
        
        // Supprimer l'annonce
        const { error } = await supabase
            .from('announcements')
            .delete()
            .eq('id', req.params.id);
            
        if (error) throw error;
        
        res.status(204).end();
    } catch (error) {
        console.error('Erreur suppression annonce:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Gestion des routes SPA (Single Page Application)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});