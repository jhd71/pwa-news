// api/oneSignalSend.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const { message, fromUser, toUser } = req.body;

    if (!message || !fromUser) {
      return res.status(400).json({ error: "Message et expéditeur requis" });
    }

    // Pour les tests, on retourne simplement un succès
    // En production, vous pouvez décommenter le code ci-dessous pour envoyer via l'API OneSignal
    /* 
    const payload = {
      app_id: "b9a9b301-c4ff-4ea6-98f3-f8802c229794",
      contents: { "en": message },
      headings: { "en": `Nouveau message de ${fromUser}` },
      included_segments: ["All"]
    };

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
    */

    return res.status(200).json({ success: true, message: "Notification traitée (mode test)" });
  } catch (error) {
    console.error('Erreur:', error);
    return res.status(500).json({ error: error.message });
  }
};
