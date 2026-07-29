import { BACKEND_URL } from './config.js';

async function request(path, options = {}) {
  const url = `${BACKEND_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

export function getStatus() {
  return request('/api/status');
}

export function getNotes() {
  return request('/api/notes');
}

export function createNote(title, content) {
  return request('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  });
}

export function updateNote(id, title, content) {
  return request(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ title, content }),
  });
}

export function deleteNote(id) {
  return request(`/api/notes/${id}`, {
    method: 'DELETE',
  });
}

