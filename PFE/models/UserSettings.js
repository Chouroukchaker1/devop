const mongoose = require('mongoose');

     const userSettingsSchema = new mongoose.Schema({
       userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: 'User',
         required: true,
         unique: true
       },
       notifications: {
         enabled: { type: Boolean, default: true },
         allowedTypes: {
           type: [String],
           enum: ['system','update',
      'data_missing',
      'alert',
      'warning',
      'success',
      'importation_data_refusée',
      'erreur',
      'avertissement_donnée_manquante',],
           default: ['avertissement_donnée_manquante']
         }
       },
       dataViewer: {
         columns: { type: [String], default: [] },
         filters: { type: Object, default: {} }
       },
       schedulerConfig: {
        enabled: { type: Boolean, default: false },
        hours: { type: [Number], default: [] },
        days: { type: [Number], default: [] },
        months: { type: [Number], default: [] },
        weekdays: { type: [Number], default: [] },
        startDate: { type: Date, default: null } // ⬅️ nouvelle propriété
      }
     }, {
       timestamps: true
     });

     module.exports = mongoose.model('UserSettings', userSettingsSchema);