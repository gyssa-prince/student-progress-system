import mongoose from 'mongoose';

const ContestSchema = new mongoose.Schema({
  contestId: String,
  contestName: String,
  date: Date,
  rank: Number,
  oldRating: Number,
  newRating: Number,
  ratingChange: Number,
  unsolvedProblems: Number
}, { _id: false });

const ProblemStatsSchema = new mongoose.Schema({
  history: [{
    date: Date,
    solved: Number,
    avgRating: Number,
    mostDifficult: {
      name: String,
      rating: Number
    }
  }],
  buckets: { type: Map, of: Number },
  heatmap: { type: Map, of: Number }
}, { _id: false });

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  phone: {
    type: String
  },
  cfHandle: {
    type: String,
    required: true
  },
  currentRating: {
    type: Number,
    default: 0
  },
  maxRating: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  emailNotificationsEnabled: {
    type: Boolean,
    default: true
  },
  lastReminderSent: {
    type: Date
  },
  contestHistory: [ContestSchema],
  problemStats: ProblemStatsSchema,
  cfLastSynced: Date,
  reminderCount: { type: Number, default: 0 },
  reminderDisabled: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Student', StudentSchema);