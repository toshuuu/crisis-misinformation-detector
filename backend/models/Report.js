const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['flood', 'fire', 'accident', 'earthquake', 'storm', 'medical', 'other']
  },
  description: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  status: { 
    type: String, 
    default: 'active', 
    enum: ['active', 'verified', 'uncertain', 'false'] 
  },
  legitimacyScore: { type: Number, default: 0 },
  confirmations: { type: Number, default: 0 },
  rejections: { type: Number, default: 0 },
  imageUrl: { type: String },
  radius: { type: Number, default: 10 } // km radius for verification
}, { timestamps: true });

reportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Report', reportSchema);
