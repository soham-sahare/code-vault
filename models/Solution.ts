import mongoose, { Schema, model, models } from 'mongoose';

const SolutionSchema = new Schema({
  problemId: {
    type: Schema.Types.ObjectId,
    ref: 'Problem',
    required: true,
  },
  title: {
    type: String,
    required: true, // e.g., "Brute Force", "Optimized"
  },
  approach: {
    type: String, // Short explanation of the approach
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: 'javascript',
  },
  timeComplexity: {
    type: String,
    required: true,
  },
  spaceComplexity: {
    type: String,
    required: true,
  },
}, { timestamps: true });

SolutionSchema.index({ problemId: 1 });
SolutionSchema.index({ title: 'text', approach: 'text', code: 'text' }, { language_override: 'none' });

const Solution = models.Solution || model('Solution', SolutionSchema);

export default Solution;
