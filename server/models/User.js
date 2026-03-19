const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        minLength : [2, 'name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    //Persona System for whom actually user using the platform
    persona: {
      type: String,
      enum: ['genz', 'family'],
      default: null,
    },

    //Personlity traits from the onboarding quiz
     personalityTraits: {
      spendingStyle: {
        type: String,
        enum: ['impulsive', 'calculated', 'balanced'],
        default: null,
      },
      savingsGoal: {
        type: String,
        enum: ['travel', 'gadgets', 'emergency', 'investment', 'education'],
        default: null,
      },
      riskAppetite: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: null,
      },
    },


    // Family Hub
    familyGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyGroup',
      default: null,
    },

    // Mothly income for budget calculations
    monthlyIncome: {
      type: Number,
      default: 0,
    },

    // currency preferences
    currency: {
      type: String,
      default: 'INR',
    },

    // Has the user completed onboarding
    isOnboarded: {
      type: Boolean,
      default: false,
    },


    // Refresh token for JWT rotation
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,

}


);

// Middleware(runs automatically before saving)

// hash password before saving to database
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// METHODS (custom functions on every user object)
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;