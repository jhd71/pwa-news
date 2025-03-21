// api/test.js
export default function handler(req, res) {
  res.status(200).json({ message: 'API de test fonctionne!', method: req.method });
}