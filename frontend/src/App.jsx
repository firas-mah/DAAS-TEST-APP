import React, { useState, useEffect, useCallback } from 'react';
import { getStatus, getNotes, createNote, updateNote, deleteNote } from './api.js';

function App() {
  const [backendStatus, setBackendStatus] = useState('loading');
  const [dbStatus, setDbStatus] = useState('loading');
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [notesError, setNotesError] = useState(null);

  // Form
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Edit modal
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Feedback
  const [feedback, setFeedback] = useState(null);

  const showFeedback = useCallback((msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const data = await getStatus();
      setBackendStatus('connected');
      setDbStatus(data.database === 'connected' ? 'connected' : 'disconnected');
    } catch {
      setBackendStatus('disconnected');
      setDbStatus('disconnected');
    }
  }, []);

  // Fetch notes
  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    setNotesError(null);
    try {
      const data = await getNotes();
      setNotes(data);
    } catch (err) {
      setNotesError(err.message);
    } finally {
      setNotesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchNotes();
    const statusInterval = setInterval(fetchStatus, 15000);
    return () => clearInterval(statusInterval);
  }, [fetchStatus, fetchNotes]);

  // Create note
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createNote(title.trim(), content.trim());
      setTitle('');
      setContent('');
      showFeedback('Note created successfully.');
      await fetchNotes();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  // Start editing
  const startEdit = (note) => {
    setEditing(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  // Save edit
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    try {
      await updateNote(editing, editTitle.trim(), editContent.trim());
      setEditing(null);
      showFeedback('Note updated successfully.');
      await fetchNotes();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  // Delete note
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    try {
      await deleteNote(id);
      showFeedback('Note deleted successfully.');
      await fetchNotes();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  return (
    <div className="app">
      <h1>DaaS Test App</h1>
      <p className="subtitle">Notes Application — Full-Stack Validation</p>

      {/* Status badges */}
      <div className="status-bar">
        <span className={`status-badge ${backendStatus}`}>
          {backendStatus === 'loading' && '⏳'}
          {backendStatus === 'connected' && '✅'}
          {backendStatus === 'disconnected' && '❌'}
          Backend: {backendStatus}
        </span>
        <span className={`status-badge ${dbStatus}`}>
          {dbStatus === 'loading' && '⏳'}
          {dbStatus === 'connected' && '✅'}
          {dbStatus === 'disconnected' && '❌'}
          Database: {dbStatus}
        </span>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={feedback.type === 'error' ? 'error-msg' : 'success-msg'}>
          {feedback.msg}
        </div>
      )}

      {/* Create form */}
      <div className="card">
        <h2>Create a new note</h2>
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              placeholder="Note title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              placeholder="Note content (optional)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={!title.trim()}>
            Create Note
          </button>
        </form>
      </div>

      {/* Notes list */}
      <div className="card">
        <h2>Notes</h2>

        {notesLoading && <div className="loading-msg">Loading notes...</div>}

        {!notesLoading && notesError && (
          <div className="error-msg">Error: {notesError}</div>
        )}

        {!notesLoading && !notesError && notes.length === 0 && (
          <div className="empty-msg">
            <p>No notes yet. Create your first note above.</p>
          </div>
        )}

        {!notesLoading && !notesError && notes.map((note) => (
          <div key={note.id} className="note-item">
            <h3>{note.title}</h3>
            <div className="meta">
              ID: {note.id} &middot; Created: {new Date(note.created_at).toLocaleString()} &middot;
              Updated: {new Date(note.updated_at).toLocaleString()}
            </div>
            {note.content && <div className="content">{note.content}</div>}
            <div className="note-actions">
              <button className="btn btn-outline btn-sm" onClick={() => startEdit(note)}>
                Edit
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(note.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editing !== null && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Note</h2>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label htmlFor="edit-title">Title</label>
                <input
                  id="edit-title"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-content">Content</label>
                <textarea
                  id="edit-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={!editTitle.trim()}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

