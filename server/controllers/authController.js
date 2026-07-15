const User = require('../models/User');
const Otp = require('../models/Otp');
const generateToken = require('../utils/generateToken');
const mailService = require('../utils/mailService');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

// Helper to generate a 6-digit numeric OTP
const generateNumericOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const activateOrCreateUser = async ({ name, email, password, avatar = '' }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    if (existingUser.status === 'inactive') {
      existingUser.name = name || existingUser.name;
      existingUser.password = password;
      existingUser.avatar = avatar || existingUser.avatar || '';
      existingUser.status = 'active';
      await existingUser.save();
      return existingUser;
    }

    throw new Error('User already exists');
  }

  return User.create({
    name,
    email: normalizedEmail,
    password,
    avatar,
    status: 'active',
  });
};

// @desc    Register a new user (Standard Password Route)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  try {
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please enter all required fields');
    }

    const user = await activateOrCreateUser({
      name,
      email,
      password,
    });

    if (user) {
      // Send welcoming email asynchronously
      mailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
        console.error('Welcome email failed to send:', err.message);
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token (Standard Password Route)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400);
      throw new Error('Please enter both email and password');
    }

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP to email for Login or Registration
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res, next) => {
  const { email, purpose } = req.body;

  try {
    if (!email || !purpose) {
      res.status(400);
      throw new Error('Please provide email and purpose (login/register)');
    }

    if (purpose !== 'login' && purpose !== 'register') {
      res.status(400);
      throw new Error('Invalid purpose');
    }

    const userExists = await User.findOne({ email });

    if (purpose === 'login' && !userExists) {
      res.status(404);
      throw new Error('No account found with this email. Please register first.');
    }

    if (purpose === 'register' && userExists && userExists.status === 'active') {
      res.status(400);
      throw new Error('An account with this email already exists.');
    }

    // Generate a 6-digit OTP code
    const otpCode = generateNumericOtp();

    // Upsert the OTP in the database (replace existing if any)
    await Otp.findOneAndUpdate(
      { email, purpose },
      { otp: otpCode, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send the email
    await mailService.sendOtpEmail(email, otpCode, purpose);

    res.json({ message: `OTP sent successfully to ${email}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and complete Registration
// @route   POST /api/auth/verify-register-otp
// @access  Public
const verifyRegisterOtpAndRegister = async (req, res, next) => {
  const { name, email, password, otp } = req.body;

  try {
    if (!name || !email || !password || !otp) {
      res.status(400);
      throw new Error('Please enter all required fields and verification code');
    }

    // Verify OTP exists and matches
    const otpRecord = await Otp.findOne({ email, otp, purpose: 'register' });

    if (!otpRecord) {
      res.status(400);
      throw new Error('Invalid or expired verification code');
    }

    // Consume OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    const user = await activateOrCreateUser({
      name,
      email,
      password,
    });

    if (user) {
      // Send welcome email
      mailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
        console.error('Welcome email failed to send:', err.message);
      });

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and log user in
// @route   POST /api/auth/verify-login-otp
// @access  Public
const verifyLoginOtpAndLogin = async (req, res, next) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      res.status(400);
      throw new Error('Please enter email and verification code');
    }

    // Verify OTP exists and matches
    const otpRecord = await Otp.findOne({ email, otp, purpose: 'login' });

    if (!otpRecord) {
      res.status(400);
      throw new Error('Invalid or expired verification code');
    }

    // Find the user
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('User account not found');
    }

    if (user.status === 'inactive') {
      user.status = 'active';
      await user.save();
    }

    // Consume OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google real-time OAuth login
// @route   POST /api/auth/google-login
// @access  Public
const googleLogin = async (req, res, next) => {
  const { idToken, email, name, avatar } = req.body;

  try {
    let googlePayload = null;

    if (idToken) {
      const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
      if (!googleClientId) {
        res.status(500);
        throw new Error('Google client ID is not configured on the server');
      }

      const client = new OAuth2Client(googleClientId);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: googleClientId,
      });

      googlePayload = ticket.getPayload();
      if (!googlePayload || !googlePayload.email || googlePayload.email_verified === false) {
        res.status(401);
        throw new Error('Google identity verification failed');
      }
    } else {
      if (!email || !name) {
        res.status(400);
        throw new Error('Please provide email and name from Google account');
      }
      googlePayload = {
        email,
        name,
        picture: avatar,
      };
    }

    const userEmail = googlePayload.email.toLowerCase().trim();
    const userName = googlePayload.name || 'Google User';
    const userAvatar = googlePayload.picture || '';

    let user = await User.findOne({ email: userEmail });

    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
      user = await User.create({
        name: userName,
        email: userEmail,
        password: randomPassword,
        avatar: userAvatar,
        status: 'active',
      });

      mailService.sendWelcomeEmail(user.email, user.name).catch((err) => {
        console.error('Welcome email failed to send:', err.message);
      });
    } else {
      if (user.status === 'inactive') {
        user.status = 'active';
      }
      if (userAvatar && user.avatar !== userAvatar) {
        user.avatar = userAvatar;
      }
      await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      status: user.status,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send OTP to email for password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPasswordSendOtp = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      res.status(400);
      throw new Error('Please provide an email address');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('No account found with this email address');
    }

    // Generate a 6-digit OTP
    const otpCode = generateNumericOtp();

    // Upsert OTP in the database
    await Otp.findOneAndUpdate(
      { email, purpose: 'forgot-password' },
      { otp: otpCode, createdAt: new Date() },
      { upsert: true, new: true }
    );

    // Send email
    await mailService.sendPasswordResetEmail(email, otpCode);

    res.json({ message: `Password reset OTP sent to ${email}` });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP and reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPasswordWithOtp = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      res.status(400);
      throw new Error('Please provide email, OTP code, and new password');
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long');
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ email, otp, purpose: 'forgot-password' });
    if (!otpRecord) {
      res.status(400);
      throw new Error('Invalid or expired verification code');
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error('User account not found');
    }

    // Update password (pre-save hook in User model will hash it)
    user.password = newPassword;
    await user.save();

    // Consume OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
  } catch (error) {
    next(error);
  }
};


// @route   GET /api/auth/users
// @access  Private (Admin role)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    next(error);
  }
};

// @desc    Create initial admin account (seed)
// @route   POST /api/auth/create-admin
// @access  Public (only works once if no admin exists)
const createAdmin = async (req, res, next) => {
  const { email, password, name } = req.body;
  try {
    if (!email || !password || !name) {
      res.status(400);
      throw new Error('Please provide name, email, and password');
    }

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      res.status(400);
      throw new Error('An admin account already exists');
    }

    const user = await User.create({ name, email, password, role: 'admin', status: 'active' });
    const token = generateToken(user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  sendOtp,
  verifyRegisterOtpAndRegister,
  verifyLoginOtpAndLogin,
  googleLogin,
  getAllUsers,
  getMe,
  forgotPasswordSendOtp,
  resetPasswordWithOtp,
  createAdmin,
};
