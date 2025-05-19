const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { updateSchedulerConfig } = require('../controllers/userSettingsController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multerConfig');

const router = express.Router();

// Validation pour l'inscription
const registerValidation = [
  body('username').trim().isLength({ min: 3 }).withMessage("Le nom d'utilisateur doit contenir au moins 3 caractères."),
  body('email').trim().isEmail().withMessage("L'adresse email doit être valide."),
  body('password').isLength({ min: 6 }).withMessage("Le mot de passe doit contenir au moins 6 caractères."),
  body('role').isIn(['fueldatamaster','admin', 'consultant', 'fueluser'])
    .withMessage("Le rôle fourni n'est pas valide."),
];

const loginValidation = [
  body('username').notEmpty().withMessage("Le nom d'utilisateur est requis"),
  body('password').notEmpty().withMessage("Le mot de passe est requis"),
];

// Routes avec le nouveau middleware handleUpload
router.post('/register', upload.single('profileImage'), registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/profile', authMiddleware, authController.profile);
router.put('/profile', authMiddleware, upload.single('profileImage'), authController.updateProfile);
router.post('/verify-code', authController.verifyCode);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);
router.get('/getUsers', authMiddleware, authController.getUsers);
//router.get('/users', authMiddleware, authController.getUsers);
router.put('/update-user', authMiddleware, authController.updateUser);
router.delete('/delete-user', authMiddleware, authController.deleteUser);
router.get('/profile-image', authMiddleware, authController.getProfileImage);
router.patch('/toggle-active', authMiddleware, authController.toggleUserActiveStatus);
// Mettre à jour la configuration du scheduler
router.put('/scheduler', updateSchedulerConfig);
module.exports = router;