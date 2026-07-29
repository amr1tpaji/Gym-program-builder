const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Program = require('../models/Program');
const Knowledge = require('../models/Knowledge');
const { generateProgram, tweakProgram } = require('../services/groqService');

// In-memory store fallback when MongoDB is unavailable
const memoryStore = new Map();

function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// Generate a new program
router.post('/generate', async (req, res) => {
  try {
    const clientData = req.body;
    
    if (!clientData.clientName || !clientData.fitnessLevel || !clientData.daysPerWeek) {
      return res.status(400).json({ 
        error: 'Missing required fields: clientName, fitnessLevel, and daysPerWeek are required' 
      });
    }

    // Fetch knowledge base context
    let knowledgeContext = '';
    try {
      if (isDbConnected()) {
        const docs = await Knowledge.find({}, 'fileName extractedText');
        docs.forEach(doc => {
          knowledgeContext += `\n\n=== FROM: "${doc.fileName}" ===\n${doc.extractedText}`;
        });
      }
    } catch (kbErr) {
      console.warn('Could not fetch knowledge base:', kbErr.message);
    }

    const aiProgram = await generateProgram(clientData, knowledgeContext);
    
    const programData = {
      clientName: clientData.clientName,
      clientAge: clientData.clientAge,
      clientGender: clientData.clientGender,
      fitnessLevel: clientData.fitnessLevel,
      goals: clientData.goals || [],
      injuries: clientData.injuries,
      equipment: clientData.equipment,
      daysPerWeek: clientData.daysPerWeek,
      sessionDuration: clientData.sessionDuration,
      programSplit: aiProgram.programSplit,
      days: aiProgram.days,
      rationale: aiProgram.rationale
    };

    if (isDbConnected()) {
      const program = new Program(programData);
      await program.save();
      res.status(201).json(program);
    } else {
      // Fallback: in-memory with generated ID
      const id = new mongoose.Types.ObjectId().toString();
      const program = { _id: id, ...programData, createdAt: new Date(), updatedAt: new Date() };
      memoryStore.set(id, program);
      res.status(201).json(program);
    }
  } catch (error) {
    console.error('Program generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate program' });
  }
});

// Tweak an existing program
router.post('/:id/tweak', async (req, res) => {
  try {
    const { id } = req.params;
    const { tweakInstructions } = req.body;
    
    if (!tweakInstructions) {
      return res.status(400).json({ error: 'tweakInstructions is required' });
    }

    let existingProgram;
    if (isDbConnected()) {
      existingProgram = await Program.findById(id);
    } else {
      existingProgram = memoryStore.get(id);
    }

    if (!existingProgram) {
      return res.status(404).json({ error: 'Program not found' });
    }

    const currentProgramData = {
      programSplit: existingProgram.programSplit,
      days: existingProgram.days,
      rationale: existingProgram.rationale
    };

    const tweakedData = await tweakProgram(currentProgramData, tweakInstructions);
    
    if (isDbConnected()) {
      existingProgram.programSplit = tweakedData.programSplit || existingProgram.programSplit;
      existingProgram.days = tweakedData.days || existingProgram.days;
      existingProgram.rationale = tweakedData.rationale || existingProgram.rationale;
      await existingProgram.save();
      res.json(existingProgram);
    } else {
      const updated = {
        ...existingProgram,
        programSplit: tweakedData.programSplit || existingProgram.programSplit,
        days: tweakedData.days || existingProgram.days,
        rationale: tweakedData.rationale || existingProgram.rationale,
        updatedAt: new Date()
      };
      memoryStore.set(id, updated);
      res.json(updated);
    }
  } catch (error) {
    console.error('Program tweak error:', error);
    res.status(500).json({ error: error.message || 'Failed to tweak program' });
  }
});

// Get all programs
router.get('/', async (req, res) => {
  try {
    if (isDbConnected()) {
      const programs = await Program.find().sort({ createdAt: -1 });
      res.json(programs);
    } else {
      const programs = Array.from(memoryStore.values()).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      res.json(programs);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single program
router.get('/:id', async (req, res) => {
  try {
    let program;
    if (isDbConnected()) {
      program = await Program.findById(req.params.id);
    } else {
      program = memoryStore.get(req.params.id);
    }
    if (!program) {
      return res.status(404).json({ error: 'Program not found' });
    }
    res.json(program);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a program (manual edits)
router.put('/:id', async (req, res) => {
  try {
    if (isDbConnected()) {
      const program = await Program.findByIdAndUpdate(
        req.params.id,
        { ...req.body, updatedAt: Date.now() },
        { new: true, runValidators: true }
      );
      if (!program) {
        return res.status(404).json({ error: 'Program not found' });
      }
      res.json(program);
    } else {
      const existing = memoryStore.get(req.params.id);
      if (!existing) return res.status(404).json({ error: 'Program not found' });
      const updated = { ...existing, ...req.body, updatedAt: new Date() };
      memoryStore.set(req.params.id, updated);
      res.json(updated);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a program
router.delete('/:id', async (req, res) => {
  try {
    if (isDbConnected()) {
      const program = await Program.findByIdAndDelete(req.params.id);
      if (!program) {
        return res.status(404).json({ error: 'Program not found' });
      }
    } else {
      if (!memoryStore.has(req.params.id)) {
        return res.status(404).json({ error: 'Program not found' });
      }
      memoryStore.delete(req.params.id);
    }
    res.json({ message: 'Program deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
