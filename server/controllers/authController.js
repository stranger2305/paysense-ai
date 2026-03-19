const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const jwt = require('jsonwebtoken');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public

const registerUser = async (req, res) => {
    try {
        //step 1 - Extract data from request body
        const {name, email, password} = req.body;

        // check all fields are provided
        if(!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        //step 3: Check if user already exists
        const userExists = await User.findOne({ email});
        if(userExists) {
            return res.status(400).json({
                message: 'An account with this email already exists'
            });
        }

        //step 4: craete new user
        //Password gets hashed automatically by the pre-save hook in User model
        const user = await User.create({
            name, email, password,
        });

        //step 5: Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        

        //step 6 save refresh token to database
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false});

        //step 7: send refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly:true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7*24*60*60*1000,
        }
        );

        //step 8 : send response
        res.status(201).json({
            message: 'Accouunt created successfully',
            accessToken,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                persona: user.persona,
                isOnboarded: user.isOnboarded,
            },
        });





    } catch (error) {
        //handle mongosse validation errors
        if(error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map((e) => e.message);
            return res.status(400).json({ message: messages[0]});
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
};

//Login User
// @desc Login user
// @route POST /api/auth/login
// @access Public

const loginUser = async (req, res) => {
    try {
        //Extract creadiantials
        const { email, password } = req.body;

        //step 2 - check fields provided
        if( !email || !password) {
            return res.status(400).json({
                message: 'Please provide email and password'
            });
        }

        //step 3 : Find user and explicitly include password fiels
        const user = await User.findOne({ email}).select('+password');
        if(!user) {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        //step 4 - check if password matches
        const isMatch = await user.isMatchPassword(password);
        if( !isMatch) {
            return res.status(400).json({
                message: 'Invalid email or password'
            });
        }

        //step 5 - generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        //step 6: update refresh token
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false});

        //step 7: send refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly:true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7*24*60*60*1000,
        }
        );

         // Step 8 — Send response
        res.status(200).json({
        message: 'Login successful',
        accessToken,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            persona: user.persona,
            isOnboarded: user.isOnboarded,
            personalityTraits: user.personalityTraits,
        },
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
};

// above method is for the refreshing the access token using refresh token
// @route POST /api/auth/refresh
// @access Public

const refreshAccessToken = async (req, res) => {
    try {
        //get refresh token from cookies
        const token = req.cookies?.refreshToken;
        if (!token) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }

        //step 2 - verify the refresh token
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        //step 3 - find user and check if refresh token matches
        const user = await User.findById(decoded.userId).select('+refreshToken');
        if (!user || user.refreshToken !== token) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        //step 4 - generate new access token
        const newAccessToken = generateAccessToken(user._id);

        res.status(200).json({ accessToken: newAccessToken});


    } catch (error) {
        res.status(401).json({ message: 'Refresh token expired, please login again'});
    }
};

//Below is the code for logout user 
// @route POST /api/auth/logout
// @access Private

const logoutUser = async (req, res) => {
    try {
        //step 1: get refresh token from cookies
        const token = req.cookies?.refreshToken;
        if (!token) {
            return res.status(200).json({ message: "Already logged out"});
        }

        //step2 : find user and clear thier refresh token from database
        await User.findOneAndUpdate(
            { refreshToken: token},
            { refreshToken: null},
            { new: true}
        );

        //step 3: clear the cookie from browser
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });


        res.status(200).json({ message: 'Logged out successfully'});


    } catch (error) {
        res.status(500).json({ message: 'Server error during logout'});
    }
};

// Following function is for get current logged in user profile
// @route GET /api/auth/me
// @access Private
const getMe = async (req, res) => {
  try {
    // req.user is set by the auth middleware (we'll build that next)
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
};
