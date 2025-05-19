const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Aucun token fourni' });

    const decoded = jwt.verify(token, jwtConfig.secret);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Utilisateur non trouvé' });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentification invalide' });
  }
};

module.exports = { authMiddleware }; 