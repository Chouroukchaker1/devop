const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Aucun token fourni' });
    console.log("🔐 Token reçu :", token);

    const decoded = jwt.verify(token, jwtConfig.secret);
    console.log("✅ JWT décodé :", decoded);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé' });

    req.user = user;
    next();
  } catch (error) {
    console.error("❌ Erreur de JWT :", error); 
    res.status(401).json({ message: 'Authentification invalide' });
  }
};

module.exports = { authMiddleware }; 