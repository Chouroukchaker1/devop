// utils/sendMail.js
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendMail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM}" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });
    console.log('✅ Email envoyé :', info.response);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi :', error);
  }
};

module.exports = sendMail;
