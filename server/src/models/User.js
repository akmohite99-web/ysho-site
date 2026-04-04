const mongoose = require('mongoose');

const savedAddressSchema = new mongoose.Schema(
  {
    label:     { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    fullName:  { type: String, required: true, trim: true },
    phone:     { type: String, required: true, trim: true },
    line1:     { type: String, required: true, trim: true },
    line2:     { type: String, trim: true, default: '' },
    city:      { type: String, required: true, trim: true },
    state:     { type: String, required: true, trim: true },
    pincode:   { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
    },
    addresses: { type: [savedAddressSchema], default: [] },
  },
  {
    timestamps: true,
    collection: 'userdetails',
  }
);

// Strip password and __v from all JSON responses
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema, 'userdetails');
