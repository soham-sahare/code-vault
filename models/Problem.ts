import mongoose, { Schema, model, models } from 'mongoose';

const ProblemSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Primary index for user queries
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
    enum: ['Solved', 'Todo', 'Unsolved'],
    default: 'Todo',
  },
  nextReviewDate: {
    type: Date,
    default: Date.now,
  },
  reviewInterval: {
    type: Number,
    default: 0,
  },
  lastPracticed: {
    type: Date,
    default: Date.now,
  },
}, { 
  timestamps: true,
  // Performance optimization: use lean() by default
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
 
// CRITICAL: Compound indexes for common query patterns
// This dramatically improves query performance
ProblemSchema.index({ userId: 1, createdAt: -1 }); // Dashboard listing
ProblemSchema.index({ userId: 1, status: 1 }); // Status filtering
ProblemSchema.index({ userId: 1, nextReviewDate: 1 }); // Due problems
ProblemSchema.index({ userId: 1, difficulty: 1 }); // Difficulty filtering
ProblemSchema.index({ userId: 1, topic: 1 }); // Topic filtering
ProblemSchema.index({ userId: 1, tags: 1 }); // Tag filtering

// Text search index for search functionality
ProblemSchema.index({ title: 'text' }, { 
  weights: { title: 10 },
  name: 'problem_text_search'
});

// Virtual for checking if review is due
ProblemSchema.virtual('isDue').get(function() {
  return new Date() >= this.nextReviewDate;
});

// Prevent model recompilation in development
const Problem = models.Problem || model('Problem', ProblemSchema);

export default Problem;
