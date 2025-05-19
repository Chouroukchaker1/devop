const jwt = require('jsonwebtoken');
require('dotenv').config();

// Utiliser la clé secrète définie dans .env
const secret = process.env.JWT_SECRET;

// Payload pour un utilisateur interne
const payload = {
  id: 'internal_service',
  username: 'powerbi_service',
  role: 'service',
};

// Générer un token avec une expiration longue (1 an)
const token = jwt.sign(payload, secret, { expiresIn: '1y' });

console.log('Generated JWT Token:', token);