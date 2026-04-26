const User = require('../models/User');

exports.login = async (req, res) => {
  try {
    const { deviceId, username } = req.body;
    let user = await User.findOne({ deviceId });
    
    if (!user) {
      user = await User.create({ deviceId, username });
    } else if (username && user.username !== username) {
      user.username = username;
      await user.save();
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ deviceId: req.params.deviceId });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find().sort({ points: -1 }).limit(10);
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
