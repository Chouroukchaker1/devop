const mongoose = require('mongoose');

const schedulerHistorySchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  status: { type: String, enum: ['started', 'completed', 'failed'], default: 'started' },
  error: { type: String },
  details: { type: Object },
}, { timestamps: true });

module.exports = mongoose.model('SchedulerHistory', schedulerHistorySchema);