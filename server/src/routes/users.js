const express = require('express');
const User    = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/profile
router.get('/profile', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

// PUT /api/users/profile  —  update name / phone
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const update = {};
    if (name?.trim()) update.name  = name.trim();
    if (phone !== undefined) update.phone = phone.trim();

    const user = await User.findByIdAndUpdate(req.userId, update, { new: true, runValidators: true });
    res.json({ success: true, user });
  } catch (err) { next(err); }
});

// GET /api/users/addresses
router.get('/addresses', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('addresses');
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
});

// POST /api/users/addresses  —  add new address
router.post('/addresses', protect, async (req, res, next) => {
  try {
    const { label, fullName, phone, line1, line2, city, state, pincode, isDefault } = req.body;

    const user = await User.findById(req.userId);

    // If new address is default, unset others
    if (isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
    }
    // If no addresses yet, make first one default automatically
    const makeDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({ label, fullName, phone, line1, line2, city, state, pincode, isDefault: makeDefault });
    await user.save();

    res.status(201).json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
});

// PUT /api/users/addresses/:addressId  —  update address
router.put('/addresses/:addressId', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const addr = user.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found.' });

    const { label, fullName, phone, line1, line2, city, state, pincode, isDefault } = req.body;

    if (isDefault) {
      user.addresses.forEach((a) => { a.isDefault = false; });
    }

    Object.assign(addr, { label, fullName, phone, line1, line2, city, state, pincode, isDefault: !!isDefault });
    await user.save();

    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
});

// DELETE /api/users/addresses/:addressId
router.delete('/addresses/:addressId', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const addr = user.addresses.id(req.params.addressId);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found.' });

    const wasDefault = addr.isDefault;
    addr.deleteOne();

    // Assign default to first remaining address if deleted one was default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
});

// PUT /api/users/addresses/:addressId/default
router.put('/addresses/:addressId/default', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    user.addresses.forEach((a) => { a.isDefault = a._id.toString() === req.params.addressId; });
    await user.save();
    res.json({ success: true, addresses: user.addresses });
  } catch (err) { next(err); }
});

module.exports = router;
