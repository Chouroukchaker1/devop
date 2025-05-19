const nodemailer = require('nodemailer');

// Configuration du transporteur une seule fois pour tout le fichier
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Code de vérification pour votre connexion',
    html: `
      <h1>Code de vérification</h1>
      <p>Votre code de vérification est : <strong>${code}</strong></p>
      <p>Ce code expirera dans 10 minutes.</p>
    `
  };

  return transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, resetCode) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <h1>Réinitialisation de mot de passe</h1>
        <p>Voici votre code de réinitialisation : <strong>${resetCode}</strong></p>
        <p>Ce code expirera dans 30 minutes.</p>
      `
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erreur d\'envoi d\'email:', error);
    throw new Error('Impossible d\'envoyer l\'email de réinitialisation');
  }
};

// Exporter les deux fonctions
module.exports = { 
  sendVerificationEmail,
  sendPasswordResetEmail 
};