const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['fueldatamaster','admin', 'consultant', 'fueluser'], 
    required: true 
  },
  profileImage: { type: String },
  permissions: [{ type: String }],
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  resetPasswordCode: { type: String },
  resetPasswordExpires: { type: Date },
}, { timestamps: true });

// Permissions par rôle
const rolePermissions = {
  admin: ['manage_users', 'manage_roles', 'view_reports'],
  fueluser: ['view_planes', 'assign_flights'],
  consultant: ['access_data', 'generate_reports']
};

UserSchema.pre('save', async function(next) {
  // Assignation des permissions
  if (this.isModified('role')) {
    this.permissions = rolePermissions[this.role] || [];
  }

  // Hash du mot de passe
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }

  next();
});

// Comparer les mots de passe
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Générer un token JWT
UserSchema.methods.generateToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role, username: this.username }, 
    jwtConfig.secret, 
    jwtConfig.options
  );
};

module.exports = mongoose.model('User', UserSchema);