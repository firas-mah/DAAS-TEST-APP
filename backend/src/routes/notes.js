import { Router } from 'express';
import { getPool } from '../db.js';

const router = Router();

// GET /api/notes
router.get('/', async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, title, content, created_at, updated_at FROM notes ORDER BY updated_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notes:', err.message);
    res.status(500).json({ error: 'Failed to fetch notes.' });
  }
});

// POST /api/notes
router.post('/', async (req, res) => {
  const { title, content } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string.' });
  }

  const trimmedTitle = title.trim();
  const trimmedContent = typeof content === 'string' ? content.trim() : '';

  try {
    const pool = getPool();
    const result = await pool.query(
      'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING id, title, content, created_at, updated_at',
      [trimmedTitle, trimmedContent]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating note:', err.message);
    res.status(500).json({ error: 'Failed to create note.' });
  }
});

// PUT /api/notes/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!id || isNaN(parseInt(id, 10))) {
    return res.status(400).json({ error: 'Invalid note ID.' });
  }

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required and must be a non-empty string.' });
  }

  const trimmedTitle = title.trim();
  const trimmedContent = typeof content === 'string' ? content.trim() : '';

  try {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE notes SET title = $1, content = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, title, content, created_at, updated_at`,
      [trimmedTitle, trimmedContent, parseInt(id, 10)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating note:', err.message);
    res.status(500).json({ error: 'Failed to update note.' });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(parseInt(id, 10))) {
    return res.status(400).json({ error: 'Invalid note ID.' });
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM notes WHERE id = $1 RETURNING id',
      [parseInt(id, 10)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    res.json({ message: 'Note deleted.', id: result.rows[0].id });
  } catch (err) {
    console.error('Error deleting note:', err.message);
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

export default router;

