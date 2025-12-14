import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    select: false, // Don't return password by default
  },
  defaultLanguage: {
    type: String,
    default: "", 
  },
}, { timestamps: true });

// Prevent overwrite warning in hot-reload
if (process.env.NODE_ENV === "development") {
  delete models.User;
}

const User = models.User || model("User", UserSchema);

export default User;
