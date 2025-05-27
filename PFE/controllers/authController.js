const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

// Générer un code de vérification aléatoire
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Inscription
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: "Nom d'utilisateur ou email déjà utilisé" });
    }

    // Chemin de l'image (null si aucun fichier)
    const profileImage = req.file ? `/uploads/${req.file.filename}` : null;

    // Créer et sauvegarder l'utilisateur
    const user = new User({ 
      username, 
      email, 
      password, 
      role,
      profileImage
    });
    
    await user.save({ validateBeforeSave: false });

    // Générer un token JWT
    const token = user.generateToken();
    res.status(201).json({ 
      token,   
      role: user.role, 
      profileImage: user.profileImage,
      userId: user._id
    });

  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: "Utilisateur déjà existant", field: error.keyValue });
    } else {
      res.status(500).json({ message: "Erreur interne du serveur", error });
    }
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Vérifier les identifiants
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Identifiants invalides' });
    }

    // Vérifier si le compte est désactivé
    if (!user.isActive) {
      return res.status(403).json({ message: 'Compte désactivé. Contactez l\'administrateur.' });
    }

    // Générer et sauvegarder le code de vérification
    const verificationCode = generateVerificationCode();
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Envoyer le code par email
    await sendVerificationEmail(user.email, verificationCode);

    res.json({ 
      message: 'Code de vérification envoyé',
      userId: user._id,
      requiresVerification: true
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur de connexion', error });
  }
};

// Vérification du code
exports.verifyCode = async (req, res) => {
  try {
    const { userId, code } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier si le code est valide et non expiré
    if (user.verificationCode !== code) {
      return res.status(401).json({ message: 'Code de vérification invalide' });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(401).json({ message: 'Code de vérification expiré' });
    }

    // Réinitialiser le code de vérification
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    user.isEmailVerified = true;
    await user.save({ validateBeforeSave: false });

    // Générer le token JWT
    const token = user.generateToken();
    res.json({ 
      token, 
      role: user.role,
      message: 'Connexion réussie'
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la vérification', error });
  }
};

// Récupérer le profil
exports.profile = async (req, res) => {
  res.json({ 
    user: {
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      profileImage: req.user.profileImage
    }
  });
};

// Mettre à jour le profil
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour l'image si fournie
    if (req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    if (req.body.username) user.username = req.body.username;
    if (req.body.email) user.email = req.body.email;

    await user.save({ validateBeforeSave: false });

    res.json({
      message: 'Profil mis à jour avec succès',
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil', error: error.message });
  }
};

// Récupérer l'image de profil
exports.getProfileImage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.profileImage) {
      return res.status(404).json({ message: 'Aucune image de profil trouvée' });
    }

    // Construire l'URL complète
    const imageUrl = `${req.protocol}://${req.get('host')}${user.profileImage}`;
    
    res.json({ 
      profileImage: imageUrl
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'image de profil', 
      error: error.message 
    });
  }
};

// Demande de réinitialisation de mot de passe
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Aucun compte associé à cet email' });
    }
    
    // Générer un code de réinitialisation
    const resetCode = generateVerificationCode();
    user.resetPasswordCode = resetCode;
    user.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save({ validateBeforeSave: false });

    // Envoyer le code par email
    await sendPasswordResetEmail(user.email, resetCode);
    
    res.json({ 
      message: 'Instructions de réinitialisation envoyées par email',
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la demande de réinitialisation', 
      error: error.message 
    });
  }
};

// Vérification du code de réinitialisation
exports.verifyResetCode = async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier si le code est valide et non expiré
    if (user.resetPasswordCode !== code) {
      return res.status(401).json({ message: 'Code de réinitialisation invalide' });
    }
    
    if (user.resetPasswordExpires < new Date()) {
      return res.status(401).json({ message: 'Code de réinitialisation expiré' });
    }
    
    // Code valide, envoyer un jeton temporaire pour la réinitialisation
    const tempToken = jwt.sign(
      { id: user._id, purpose: 'reset-password' },
      jwtConfig.secret,
      { expiresIn: '15m' }
    );
    
    res.json({ 
      message: 'Code vérifié avec succès',
      tempToken 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la vérification du code', 
      error: error.message 
    });
  }
};

// Réinitialisation du mot de passe
exports.resetPassword = async (req, res) => {
  try {
    const { userId, password, tempToken } = req.body;
    
    // Vérifier le jeton temporaire
    let decoded;
    try {
      decoded = jwt.verify(tempToken, jwtConfig.secret);
    } catch (err) {
      return res.status(401).json({ message: 'Jeton invalide ou expiré' });
    }
    
    if (decoded.purpose !== 'reset-password' || decoded.id !== userId) {
      return res.status(401).json({ message: 'Jeton invalide' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Réinitialiser le mot de passe
    user.password = password;
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    await user.save({ validateBeforeSave: false });

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la réinitialisation du mot de passe', 
      error: error.message 
    });
  }
};

// Récupérer la liste des utilisateurs
exports.getUsers = async (req, res) => {
  try {
    const requestingUser = req.user;
    
    if (!requestingUser) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    let users;
    if (requestingUser.role === 'fueldatamaster') {
      users = await User.find({ role: { $in: ['admin', 'consultant', 'fueluser'] } })
        .select('-password -verificationCode -resetPasswordCode');
    } else if (requestingUser.role === 'admin') {
      users = await User.find({ role: { $in: ['consultant', 'fueluser'] } })
        .select('-password -verificationCode -resetPasswordCode');
    } else {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    res.status(200).json({ users });
  } catch (error) {
    console.error('Erreur getUsers:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
};

// Mettre à jour un utilisateur
exports.updateUser = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin ou fueldatamaster
    if (!req.user || !['admin', 'fueldatamaster'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const { userId, role, username, email } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mise à jour des champs si fournis
    if (username) user.username = username;
    if (email) user.email = email;
    if (role) user.role = role;

    await user.save({ validateBeforeSave: false });

    res.json({
      message: 'Utilisateur mis à jour avec succès',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de l\'utilisateur',
      error: error.message
    });
  }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin ou fueldatamaster
    if (!req.user || !['admin', 'fueldatamaster'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const { userId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Supprimer l'utilisateur
    await user.deleteOne();
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ 
      message: 'Erreur lors de la suppression de l\'utilisateur', 
      error: error.message 
    });
  }
};

// Activer/Désactiver un utilisateur
exports.toggleUserActiveStatus = async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin ou fueldatamaster
    if (!req.user || !['admin', 'fueldatamaster'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès interdit' });
    }

    const { userId, isActive } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Mettre à jour le statut isActive
    user.isActive = isActive;
    await user.save({ validateBeforeSave: false });

    res.json({ message: `Compte ${isActive ? 'activé' : 'désactivé'} avec succès`, user });
  } catch (error) {
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour du statut du compte', 
      error: error.message 
    });
  }
};