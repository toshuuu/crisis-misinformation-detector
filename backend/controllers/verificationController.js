const Verification = require('../models/Verification');
const Report = require('../models/Report');
const User = require('../models/User');
const socketHandler = require('../socket/socketHandler');

function calcDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.verifyReport = async (req, res) => {
  try {
    const { userId, reportId, status, longitude, latitude } = req.body;

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Anti-Spam: Prevent duplicate
    const existing = await Verification.findOne({ user: userId, report: reportId });
    if (existing) return res.status(400).json({ error: 'Already verified this report' });

    // Anti-Spam: Rate limiting (max 5 per minute)
    const oneMinAgo = new Date(Date.now() - 60000);
    const recentVerifications = await Verification.countDocuments({ user: userId, createdAt: { $gte: oneMinAgo } });
    if (recentVerifications >= 5) {
      user.trustScore = Math.max(0, user.trustScore - 0.05); // Penalize spam
      await user.save();
      return res.status(429).json({ error: 'Too many verifications. Please wait.' });
    }

    const distance = calcDistanceMeters(
      parseFloat(latitude), parseFloat(longitude),
      report.location.coordinates[1], report.location.coordinates[0]
    );

    let distanceWeight = 0;
    if (distance < 2000) distanceWeight = 1.0;
    else if (distance < 10000) distanceWeight = 0.5;
    else if (distance < 20000) distanceWeight = 0.1;
    else return res.status(400).json({ error: 'Too far from location to verify' });

    await Verification.create({
      user: userId, report: reportId, status,
      distanceAtVerification: distance,
      userLocation: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] }
    });

    const voteValue = status === 'yes' ? 1 : -1;
    const weightedVote = voteValue * distanceWeight * user.trustScore;

    report.legitimacyScore += weightedVote;
    if (status === 'yes') report.confirmations += 1;
    else report.rejections += 1;

    const prevStatus = report.status;
    const totalVotes = report.confirmations + report.rejections;
    if (totalVotes >= 3) {
      if (report.legitimacyScore > 1.5) report.status = 'verified';
      else if (report.legitimacyScore < -0.5) report.status = 'false';
      else report.status = 'uncertain';
    }

    await report.save();

    user.points += 2; // +2 for participation
    user.lastActivity = Date.now();

    // Reward Logic if status changed to final state
    if (prevStatus !== report.status && (report.status === 'verified' || report.status === 'false')) {
      const reporter = await User.findById(report.reporter);
      if (reporter) {
        if (report.status === 'verified') {
          reporter.points += 20; // +20 points if report verified
          if (!reporter.badges.includes('Crisis Responder')) reporter.badges.push('Crisis Responder');
        } else if (report.status === 'false') {
          reporter.points = Math.max(0, reporter.points - 10); // Negative/0 points if false
          reporter.trustScore = Math.max(0, reporter.trustScore - 0.2);
        }
        await reporter.save();
      }

      // Reward all verifiers who were correct
      const allVerifications = await Verification.find({ report: reportId });
      for (const v of allVerifications) {
        const isCorrect = (report.status === 'verified' && v.status === 'yes') || (report.status === 'false' && v.status === 'no');
        const vUser = await User.findById(v.user);
        if (vUser) {
          if (isCorrect) {
            vUser.points += 10; // +10 for correct verification
            vUser.trustScore = Math.min(1, vUser.trustScore + 0.05);
            if (distance < 5000 && !vUser.badges.includes('Local Hero')) vUser.badges.push('Local Hero');
          } else {
            vUser.trustScore = Math.max(0, vUser.trustScore - 0.05);
          }
          if (vUser.points > 100 && !vUser.badges.includes('Top Verifier')) vUser.badges.push('Top Verifier');
          await vUser.save();
        }
      }
    } else {
      // Dynamic score for current action
      user.trustScore = Math.min(1, Math.max(0, user.trustScore + (status === 'yes' ? 0.01 : -0.01)));
    }

    await user.save();

    socketHandler.emitEvent('verification_update', { reportId, status: report.status, legitimacyScore: report.legitimacyScore });
    if (report.status !== prevStatus) {
      socketHandler.emitEvent('status_change', { reportId, status: report.status });
    }

    res.status(200).json({ status: 'success', reportStatus: report.status, userPoints: user.points });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
