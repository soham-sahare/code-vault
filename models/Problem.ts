import mongoose, { Schema, model, models } from 'mongoose';

const ProblemSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
  },
  link: { type: String, required: true },
  intuition: { type: String },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
  },
  topic: [{
    type: String,
    required: true,
  }],
  tags: [{
    type: String,
  }],
  status: {
    type: String,
    enum: ['Solved', 'Todo'],
    default: 'Solved',
  },
  nextReviewDate: {
    type: Date,
    default: Date.now,
  },
  reviewInterval: {
    type: Number,
    default: 0, // Days: 0, 3, 7, 15, 30
  },
  lastPracticed: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Check review status
ProblemSchema.virtual('isDue').get(function() {
  return new Date() >= this.nextReviewDate;
});

const Problem = models.Problem || model('Problem', ProblemSchema);

export default Problem;
