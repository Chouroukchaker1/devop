// middlewares/roleMiddleware.js
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
      try {
        // Vérifier si l'utilisateur est authentifié et possède un rôle
        if (!req.user || !req.user.role) {
          return res.status(403).json({ success: false, message: "Accès interdit. Aucun rôle détecté." });
        }
  
        // Vérifier si le rôle de l'utilisateur est dans la liste des rôles autorisés
        if (!allowedRoles.includes(req.user.role)) {
          return res.status(403).json({ success: false, message: "Accès refusé. Rôle non autorisé." });
        }
  
        // Passer au middleware suivant
        next();
      } catch (error) {
        res.status(500).json({ success: false, message: "Erreur de validation du rôle." });
      }
    };
  };
  
  module.exports = { checkRole };
  