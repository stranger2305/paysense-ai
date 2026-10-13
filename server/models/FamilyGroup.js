const mongoose = require('mongoose');
const crypto = require('crypto');

const familyGroupSchema = new mongoose.Schema(
  {
    // Display name for the family group, e.g. "Sharma Family"
    name: {
      type: String,
      required: [true, 'Family group name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },

    // The user who created the group — has admin-like status
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // 6-character invite code other members use to join
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },

    // Denormalized list of member IDs for quick access.
    // We ALSO set user.familyGroup on each User document (two-way link)
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// -----------------------------------------------
// Static method — generates a random 6-character
// alphanumeric invite code (uppercase, easy to share)
// -----------------------------------------------
familyGroupSchema.statics.generateInviteCode = function () {
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
};

const FamilyGroup = mongoose.model('FamilyGroup', familyGroupSchema);
module.exports = FamilyGroup;