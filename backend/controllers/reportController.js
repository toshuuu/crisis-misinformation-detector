const Report = require('../models/Report');
const socketHandler = require('../socket/socketHandler');

exports.createReport = async (req, res) => {
  try {
    const { userId, type, description, longitude, latitude, imageUrl } = req.body;
    
    const report = await Report.create({
      reporter: userId,
      type,
      description,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      },
      imageUrl
    });

    // Notify all clients about the new report
    socketHandler.emitEvent('new_report', report);

    res.status(201).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).populate('reporter', 'name trustScore');
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('reporter', 'name trustScore');
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
