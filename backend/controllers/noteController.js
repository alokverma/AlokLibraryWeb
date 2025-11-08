import { v4 as uuidv4 } from 'uuid';
import * as noteUtils from '../utils/noteUtils.js';

// GET all notes for the logged-in student
export const getAllNotes = async (req, res) => {
  try {
    const user = req.user;
    
    // Only students can access their own notes
    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Only students can access notes' });
    }

    const notes = await noteUtils.getAllNotes(user.id);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes', message: error.message });
  }
};

// GET note by ID
export const getNoteById = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Only students can access their own notes
    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Only students can access notes' });
    }

    const note = await noteUtils.getNoteById(id, user.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note', message: error.message });
  }
};

// POST create new note
export const createNote = async (req, res) => {
  try {
    const user = req.user;
    const { title, content } = req.body;

    // Only students can create notes
    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Only students can create notes' });
    }

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Validate content length (max 1000 characters)
    if (content.length > 1000) {
      return res.status(400).json({ error: 'Content must not exceed 1000 characters' });
    }

    const noteId = uuidv4();
    const noteData = {
      id: noteId,
      studentId: user.id,
      title: title.trim(),
      content: content.trim(),
    };

    const newNote = await noteUtils.createNote(noteData);
    res.status(201).json(newNote);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note', message: error.message });
  }
};

// PUT update note
export const updateNote = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { title, content } = req.body;

    // Only students can update their own notes
    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Only students can update notes' });
    }

    // Validation
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({ error: 'Content cannot be empty' });
      }
      // Validate content length (max 1000 characters)
      if (content.length > 1000) {
        return res.status(400).json({ error: 'Content must not exceed 1000 characters' });
      }
    }

    const noteData = {
      title: title ? title.trim() : undefined,
      content: content ? content.trim() : undefined,
    };

    const updatedNote = await noteUtils.updateNote(id, user.id, noteData);
    if (!updatedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json(updatedNote);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note', message: error.message });
  }
};

// DELETE note
export const deleteNote = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Only students can delete their own notes
    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Forbidden: Only students can delete notes' });
    }

    const deletedNote = await noteUtils.deleteNote(id, user.id);
    if (!deletedNote) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note', message: error.message });
  }
};

