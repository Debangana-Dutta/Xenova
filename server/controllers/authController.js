const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate a signed JWT for a given user id
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Set the JWT as an httpOnly cookie on the response
const sendTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// Single shape for the user object returned by every auth endpoint, so the
// client never has to branch on which route the data came from.
const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  initials: user.initials,
  monthlyBudget: user.monthlyBudget,
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.status(201).json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & set cookie
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      // Deliberately identical message for "no such email" and "wrong
      // password" so the endpoint can't be used to enumerate accounts.
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.status(200).json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ user: toPublicUser(req.user) });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user's profile (name, monthly budget)
// @route   PUT /api/auth/me
// @access  Private
const updateMe = async (req, res, next) => {
  try {
    const { name, monthlyBudget } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      if (trimmed.length > 60) {
        return res.status(400).json({ message: 'Name cannot exceed 60 characters' });
      }
      user.name = trimmed;
    }

    // Previously this assigned req.body.monthlyBudget straight onto the
    // document, so a non-numeric value produced a Mongoose CastError and a
    // 500. Coerce and range-check first, and return a 400 the client can show.
    if (monthlyBudget !== undefined) {
      const budget = Number(monthlyBudget);
      if (!Number.isFinite(budget)) {
        return res.status(400).json({ message: 'Monthly budget must be a number' });
      }
      if (budget < 0) {
        return res.status(400).json({ message: 'Monthly budget cannot be negative' });
      }
      if (budget > 10000000) {
        return res.status(400).json({ message: 'Monthly budget is unrealistically large' });
      }
      user.monthlyBudget = Math.round(budget * 100) / 100;
    }

    await user.save();

    res.status(200).json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
};

// @desc    Change the current user's password
// @route   PUT /api/auth/me/password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Current password and new password are required' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    if (currentPassword === newPassword) {
      return res
        .status(400)
        .json({ message: 'New password must be different from your current password' });
    }

    // `protect` loads the user with `select('-password')`, so the hash has to
    // be fetched explicitly here before it can be compared.
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Requiring the current password means a stolen session cookie on its own
    // isn't enough to lock the real owner out of their account.
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Your current password is incorrect' });
    }

    user.password = newPassword;
    await user.save(); // the pre('save') hook re-hashes with a fresh salt

    // Issue a new token so the cookie isn't tied to the pre-change state.
    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Log the user out by clearing the auth cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res, next) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', '', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  changePassword,
  logoutUser,
};
