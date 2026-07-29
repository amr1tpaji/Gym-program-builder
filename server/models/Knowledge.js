const mongoose = require('mongoose');

const knowledgeSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  extractedText: { type: String, required: true },
  pageCount: Number,
  charCount: Number,
  uploadedAt: { type: Date, default: Date.now }
});

// Index for text search
knowledgeSchema.index({ extractedText: 'text', fileName: 'text' });

module.exports = mongoose.model('Knowledge', knowledgeSchema);
