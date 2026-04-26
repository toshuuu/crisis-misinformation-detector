const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  report: { type: mongoose.Schema.Types.ObjectId, ref: 'Report', required: true },
  status: { type: String, enum: ['yes', 'no'], required: true },
  distanceAtVerification: { type: Number }, // distance in meters
  userLocation: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }
  }
}, { timestamps: true });

verificationSchema.index({ user: 1, report: 1 }, { unique: true }); // Prevent duplicate responses

module.exports = mongoose.model('Verification', verificationSchema);
