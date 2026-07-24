const fs = require('fs');
const path = require('path');
const FocusSession = require('../models/FocusSession');
const Activity = require('../models/Activity');

const startOfDay = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const dateKey = (d) => startOfDay(d).toISOString().slice(0, 10);

// ---------------------------------------------------------------------------
// Focus sessions
// ---------------------------------------------------------------------------

// @desc    Get all focus sessions for the authenticated user
// @route   GET /api/productivity/focus-sessions
// @access  Private
const getFocusSessions = async (req, res, next) => {
  try {
    const sessions = await FocusSession.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ sessions });
  } catch (error) {
    next(error);
  }
};

// @desc    Log a completed focus session
// @route   POST /api/productivity/focus-sessions
// @access  Private
const createFocusSession = async (req, res, next) => {
  try {
    const { duration, sessionType, startTime, endTime, completed } = req.body;

    if (!duration || !startTime || !endTime) {
      return res.status(400).json({ message: 'Duration, startTime and endTime are required' });
    }

    const session = await FocusSession.create({
      user: req.user._id,
      duration,
      sessionType: sessionType || 'focus',
      completed: completed !== undefined ? completed : true,
      startTime,
      endTime,
    });

    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

// @desc    Get all activities for the authenticated user
// @route   GET /api/productivity/activities
// @access  Private
const getActivities = async (req, res, next) => {
  try {
    const { activityType, status } = req.query;
    const query = { user: req.user._id };
    if (activityType) query.activityType = activityType;
    if (status) query.status = status;

    const activities = await Activity.find(query).sort({ date: -1 });
    res.status(200).json({ activities });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new activity (supports optional certificate upload)
// @route   POST /api/productivity/activities
// @access  Private
const createActivity = async (req, res, next) => {
  try {
    const { title, description, activityType, date, status, notes } = req.body;

    if (!title || !activityType || !date) {
      return res.status(400).json({ message: 'Title, activityType and date are required' });
    }

    const activity = await Activity.create({
      user: req.user._id,
      title,
      description: description || '',
      activityType,
      date,
      status: status || 'planned',
      notes: notes || '',
      certificatePath: req.file ? `/uploads/${req.file.filename}` : null,
    });

    res.status(201).json({ activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Update an activity (only if owned by the user)
// @route   PUT /api/productivity/activities/:id
// @access  Private
const updateActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findOne({ _id: req.params.id, user: req.user._id });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const { title, description, activityType, date, status, notes } = req.body;

    if (title !== undefined) activity.title = title;
    if (description !== undefined) activity.description = description;
    if (activityType !== undefined) activity.activityType = activityType;
    if (date !== undefined) activity.date = date;
    if (status !== undefined) activity.status = status;
    if (notes !== undefined) activity.notes = notes;

    if (req.file) {
      // Remove old certificate file if one exists
      if (activity.certificatePath) {
        const oldPath = path.join(__dirname, '..', activity.certificatePath);
        fs.unlink(oldPath, () => {});
      }
      activity.certificatePath = `/uploads/${req.file.filename}`;
    }

    await activity.save();

    res.status(200).json({ activity });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an activity (only if owned by the user)
// @route   DELETE /api/productivity/activities/:id
// @access  Private
const deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (activity.certificatePath) {
      const filePath = path.join(__dirname, '..', activity.certificatePath);
      fs.unlink(filePath, () => {});
    }

    res.status(200).json({ message: 'Activity deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Dashboard summary (focus stats, streak, upcoming activities)
// ---------------------------------------------------------------------------

// @desc    Get productivity summary for the dashboard
// @route   GET /api/productivity/summary
// @access  Private
const getProductivitySummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [sessions, activities] = await Promise.all([
      FocusSession.find({ user: userId }).sort({ createdAt: -1 }),
      Activity.find({ user: userId }).sort({ date: 1 }),
    ]);

    const today = startOfDay(new Date());
    const todayKey = dateKey(today);

    const completedSessions = sessions.filter((s) => s.completed && s.sessionType === 'focus');

    const todaysSessions = completedSessions.filter((s) => dateKey(s.startTime) === todayKey);
    const todaysFocusMinutes = todaysSessions.reduce((sum, s) => sum + s.duration, 0);

    // Build the set of distinct days that have "activity" (a completed focus
    // session OR an activity log entry dated that day).
    const activeDays = new Set();
    completedSessions.forEach((s) => activeDays.add(dateKey(s.startTime)));
    activities.forEach((a) => activeDays.add(dateKey(a.date)));

    // Consecutive-day streak counting backwards from today.
    let streak = 0;
    let cursor = new Date(today);
    while (activeDays.has(dateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Weekly focus stats: minutes per day for the last 7 days
    const weeklyStats = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const key = dateKey(day);
      const minutes = completedSessions
        .filter((s) => dateKey(s.startTime) === key)
        .reduce((sum, s) => sum + s.duration, 0);
      weeklyStats.push({
        date: key,
        label: day.toLocaleDateString('en-US', { weekday: 'short' }),
        minutes,
      });
    }

    const upcomingActivities = activities
      .filter((a) => new Date(a.date) >= today && a.status !== 'completed')
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    res.status(200).json({
      todaysFocusMinutes,
      todaysCompletedSessions: todaysSessions.length,
      currentStreak: streak,
      totalFocusSessions: completedSessions.length,
      weeklyStats,
      upcomingActivities,
      recentSessions: sessions.slice(0, 5),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFocusSessions,
  createFocusSession,
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getProductivitySummary,
};
