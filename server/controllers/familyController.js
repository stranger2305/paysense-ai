const FamilyGroup = require('../models/FamilyGroup');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// -----------------------------------------------
// @desc    Create a new family group
// @route   POST /api/family/create
// @access  Private
// -----------------------------------------------
const createFamilyGroup = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Please provide a valid family group name' });
    }

    const existingUser = await User.findById(req.user.id);
    if (existingUser.familyGroup) {
      return res.status(400).json({ message: 'You are already part of a family group' });
    }

    let inviteCode;
    let isUnique = false;
    while (!isUnique) {
      inviteCode = FamilyGroup.generateInviteCode();
      const codeExists = await FamilyGroup.findOne({ inviteCode });
      if (!codeExists) isUnique = true;
    }

    const familyGroup = await FamilyGroup.create({
      name: name.trim(),
      createdBy: req.user.id,
      inviteCode,
      members: [req.user.id],
    });

    existingUser.familyGroup = familyGroup._id;
    await existingUser.save({ validateBeforeSave: false });

    res.status(201).json({
      message: 'Family group created successfully',
      familyGroup,
    });
  } catch (error) {
    console.error('CREATE FAMILY GROUP ERROR:', error);
    res.status(500).json({ message: 'Error creating family group' });
  }
};

// -----------------------------------------------
// @desc    Join an existing family group via invite code
// @route   POST /api/family/join
// @access  Private
// -----------------------------------------------
const joinFamilyGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ message: 'Please provide an invite code' });
    }

    const existingUser = await User.findById(req.user.id);
    if (existingUser.familyGroup) {
      return res.status(400).json({ message: 'You are already part of a family group' });
    }

    const familyGroup = await FamilyGroup.findOne({
      inviteCode: inviteCode.toUpperCase().trim(),
    });

    if (!familyGroup) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    familyGroup.members.push(req.user.id);
    await familyGroup.save();

    existingUser.familyGroup = familyGroup._id;
    await existingUser.save({ validateBeforeSave: false });

    res.status(200).json({
      message: 'Joined family group successfully',
      familyGroup,
    });
  } catch (error) {
    console.error('JOIN FAMILY GROUP ERROR:', error);
    res.status(500).json({ message: 'Error joining family group' });
  }
};

// -----------------------------------------------
// @desc    Get family group dashboard — combined stats
//          and per-member spending breakdown
// @route   GET /api/family/dashboard
// @access  Private
// -----------------------------------------------
const getFamilyDashboard = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id).populate({
      path: 'familyGroup',
      populate: { path: 'members', select: 'name email persona' },
    });

    if (!currentUser.familyGroup) {
      return res.status(404).json({ message: 'You are not part of a family group' });
    }

    const familyGroup = currentUser.familyGroup;
    const memberIds = familyGroup.members.map((m) => m._id);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const memberSpending = await Transaction.aggregate([
      {
        $match: {
          user: { $in: memberIds },
          date: { $gte: startOfMonth },
          type: 'debit',
        },
      },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    const categoryBreakdown = await Transaction.aggregate([
      {
        $match: {
          user: { $in: memberIds },
          date: { $gte: startOfMonth },
          type: 'debit',
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 6 },
    ]);

    const memberBreakdown = familyGroup.members.map((member) => {
      const spending = memberSpending.find(
        (s) => s._id.toString() === member._id.toString()
      );
      return {
        _id: member._id,
        name: member.name,
        email: member.email,
        persona: member.persona,
        totalSpent: spending?.totalSpent || 0,
        transactionCount: spending?.transactionCount || 0,
      };
    });

    const householdTotal = memberBreakdown.reduce((sum, m) => sum + m.totalSpent, 0);

    res.status(200).json({
      familyGroup: {
        _id: familyGroup._id,
        name: familyGroup.name,
        inviteCode: familyGroup.inviteCode,
        createdBy: familyGroup.createdBy,
      },
      memberBreakdown,
      categoryBreakdown,
      householdTotal,
      memberCount: familyGroup.members.length,
    });
  } catch (error) {
    console.error('FAMILY DASHBOARD ERROR:', error);
    res.status(500).json({ message: 'Error fetching family dashboard' });
  }
};

// -----------------------------------------------
// @desc    Leave the current family group
// @route   POST /api/family/leave
// @access  Private
// -----------------------------------------------
const leaveFamilyGroup = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    if (!currentUser.familyGroup) {
      return res.status(400).json({ message: 'You are not part of a family group' });
    }

    const familyGroup = await FamilyGroup.findById(currentUser.familyGroup);

    if (familyGroup) {
      familyGroup.members = familyGroup.members.filter(
        (memberId) => memberId.toString() !== req.user.id
      );

      if (familyGroup.members.length === 0) {
        await FamilyGroup.findByIdAndDelete(familyGroup._id);
      } else {
        await familyGroup.save();
      }
    }

    currentUser.familyGroup = null;
    await currentUser.save({ validateBeforeSave: false });

    res.status(200).json({ message: 'Left family group successfully' });
  } catch (error) {
    console.error('LEAVE FAMILY GROUP ERROR:', error);
    res.status(500).json({ message: 'Error leaving family group' });
  }
};

module.exports = {
  createFamilyGroup,
  joinFamilyGroup,
  getFamilyDashboard,
  leaveFamilyGroup,
};