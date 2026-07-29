const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: String,
  sets: Number,
  reps: String,
  restSeconds: Number,
  tempo: String,
  musclesTrained: [{
    commonName: String,
    anatomicalName: String,
    role: String // primary, secondary, stabilizer
  }],
  notes: String,
  category: String // warmup, mobility, compound, isolation, cooldown
});

const daySchema = new mongoose.Schema({
  dayNumber: Number,
  dayName: String, // e.g., "Push Day", "Upper Body", "Full Body A"
  focus: String,
  warmup: [exerciseSchema],
  mobility: [exerciseSchema],
  strength: [exerciseSchema],
  cooldown: [exerciseSchema]
});

const programSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  clientAge: Number,
  clientGender: String,
  fitnessLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  goals: [String],
  injuries: String,
  equipment: String,
  daysPerWeek: { type: Number, required: true, min: 1, max: 7 },
  sessionDuration: Number, // in minutes
  programSplit: String,
  days: [daySchema],
  rationale: String, // AI-generated explanation of the approach
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

programSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Program', programSchema);
