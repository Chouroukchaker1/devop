require('dotenv').config();
const nodemailer = require('nodemailer');

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // true si port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Envoi d’un email de test
transporter.sendMail({
  from: `"${process.env.EMAIL_FROM}" <${process.env.EMAIL_USER}>`,
  to: 'admin@example.com', // Remplace par l'adresse réelle de l'admin
  subject: 'Test',
  text: 'Ceci est un email de test'
}, (err, info) => {
  if (err) {
    console.error('❌ Erreur lors de l\'envoi :', err);
  } else {
    console.log('✅ Email envoyé :', info.response);
  }
});
