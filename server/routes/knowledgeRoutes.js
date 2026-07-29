const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mongoose = require('mongoose');
const Knowledge = require('../models/Knowledge');

// In-memory fallback
const memoryKnowledge = new Map();
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// Multer config — store in memory buffer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Upload a PDF and extract text
router.post('/upload', (req, res) => {
  upload.single('pdf')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file uploaded' });
      }

      // Extract text from PDF
      const pdfData = await pdfParse(req.file.buffer);
      const extractedText = pdfData.text;

      if (!extractedText || extractedText.trim().length < 10) {
        return res.status(400).json({ error: 'Could not extract text from this PDF. It may be image-based or encrypted.' });
      }

      const docData = {
        fileName: req.file.originalname.replace('.pdf', ''),
        originalName: req.file.originalname,
        extractedText: extractedText,
        pageCount: pdfData.numpages,
        charCount: extractedText.length
      };

      if (isDbConnected()) {
        const doc = new Knowledge(docData);
        await doc.save();
        res.status(201).json({
          _id: doc._id,
          fileName: doc.fileName,
          originalName: doc.originalName,
          pageCount: doc.pageCount,
          charCount: doc.charCount,
          uploadedAt: doc.uploadedAt
        });
      } else {
        const id = new mongoose.Types.ObjectId().toString();
        const doc = { _id: id, ...docData, uploadedAt: new Date() };
        memoryKnowledge.set(id, doc);
        res.status(201).json({
          _id: id,
          fileName: doc.fileName,
          originalName: doc.originalName,
          pageCount: doc.pageCount,
          charCount: doc.charCount,
          uploadedAt: doc.uploadedAt
        });
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to process PDF' });
    }
  });
});

// Get all knowledge documents (metadata only, not full text)
router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      const docs = await Knowledge.find({}, '-extractedText').sort({ uploadedAt: -1 });
      res.json(docs);
    } else {
      const docs = Array.from(memoryKnowledge.values())
        .map(({ extractedText, ...rest }) => rest)
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
      res.json(docs);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all knowledge text (for AI context)
router.get('/context', async (req, res) => {
  try {
    let allText = '';
    if (isDbConnected()) {
      const docs = await Knowledge.find({}, 'fileName extractedText');
      docs.forEach(doc => {
        allText += `\n\n=== FROM: "${doc.fileName}" ===\n${doc.extractedText}`;
      });
    } else {
      memoryKnowledge.forEach(doc => {
        allText += `\n\n=== FROM: "${doc.fileName}" ===\n${doc.extractedText}`;
      });
    }
    res.json({ text: allText, hasKnowledge: allText.trim().length > 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a knowledge document
router.delete('/:id', async (req, res) => {
  try {
    if (isDbConnected()) {
      const doc = await Knowledge.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Document not found' });
    } else {
      if (!memoryKnowledge.has(req.params.id)) {
        return res.status(404).json({ error: 'Document not found' });
      }
      memoryKnowledge.delete(req.params.id);
    }
    res.json({ message: 'Knowledge document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
