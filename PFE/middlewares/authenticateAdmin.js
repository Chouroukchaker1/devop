// middlewares/authenticateAdmin.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assurez-vous que le chemin est correct

const authenticateAdmin = async (req, res, next) => {
  try {
    // Vérifier la présence du token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentification requise'
      });
    }

    // Extraire et vérifier le token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Trouver l'utilisateur
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier les droits admin
    if (user.role !== 'admin' && user.role !== 'fueldatamaster') {
      return res.status(403).json({
        status: 'error',
        message: 'Accès refusé - Droits insuffisants'
      });
    }

    // Tout est bon, stocker l'utilisateur dans la requête et continuer
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error', 
        message: 'Token invalide'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expiré'
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Erreur lors de l\'authentification',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = authenticateAdmin;