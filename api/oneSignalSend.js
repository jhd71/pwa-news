// api/oneSignalSend.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const { message, fromUser, toUser } = req.body;

    if (!message || !fromUser) {
      return res.status(400).json({ error: "Message et expéditeur requis" });
    }

    const payload = {
      app_id: "b9a9b301-c4ff-4ea6-98f3-f8802c229794", // Votre App ID OneSignal
      contents: { "en": message },
      headings: { "en": `Nouveau message de ${fromUser}` },
    };

    // Si c'est pour un utilisateur spécifique
    if (toUser && toUser !== "all") {
      payload.filters = [
        {"field": "tag", "key": "username", "relation": "=", "value": toUser}
      ];
    } else {
      // Pour tous les utilisateurs
      payload.included_segments = ["All"];
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: error.message });
  }
};