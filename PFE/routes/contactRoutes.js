const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const authenticateAdmin = require('../middlewares/authenticateAdmin');
const nodemailer = require('nodemailer');

// Configuration du transporteur pour nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou un autre service comme 'outlook', 'yahoo', etc.
  auth: {
    user: process.env.ADMIN_EMAIL, // email de l'administrateur (à définir dans .env)
    pass: process.env.EMAIL_PASSWORD // mot de passe de l'email (à définir dans .env)
  }
});

// Route pour récupérer tous les messages (protégée par authentification admin)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json({
      status: 'success',
      results: messages.length,
      data: { messages }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Route pour créer un nouveau message
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Créer et enregistrer le message dans la base de données
    const newMessage = await ContactMessage.create({
      name,
      email,
      phone,
      subject,
      message
    });

    // Envoyer une notification à l'administrateur par email
    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `Nouveau message de contact: ${subject || 'Sans sujet'}`,
      html: `
        <h3>Nouveau message de contact</h3>
        <p><strong>Nom:</strong> ${name || 'Non spécifié'}</p>
        <p><strong>Email:</strong> ${email || 'Non spécifié'}</p>
        <p><strong>Téléphone:</strong> ${phone || 'Non spécifié'}</p>
        <p><strong>Sujet:</strong> ${subject || 'Non spécifié'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p><em>Date de réception: ${new Date().toLocaleString()}</em></p>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Erreur lors de l\'envoi de l\'email à l\'admin:', error);
      } else {
        console.log('Email de notification envoyé à l\'admin:', info.response);
      }
    });

    res.status(201).json({
      status: 'success',
      data: { message: newMessage }
    });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save message',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;