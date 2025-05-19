const mongoose = require('mongoose');

const PermissionSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String
});

module.exports = mongoose.model('Permission', PermissionSchema);
