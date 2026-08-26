'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
}

interface User {
  id: string;
  email: string;
  name: string;
}

export default function TodosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const fetchUser = useCallback(async () => {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      router.push('/login');
      return;
    }
    const data = await res.json();
    setUser(data.user);
  }, [router]);

  const fetchTodos = useCallback(async () => {
    const params = filter === 'all' ? '' : `?completed=${filter === 'completed'}`;
    const res = await fetch(`/api/todos${params}`);
    if (res.ok) {
      const data = await res.json();
      setTodos(data.todos);
    }
  }, [filter]);

  useEffect(() => {
    Promise.all([fetchUser(), fetchTodos()]).finally(() => setLoading(false));
  }, [fetchUser, fetchTodos]);

  async function createTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim(), description: newDesc.trim() || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setTodos([data.todo, ...todos]);
        setNewTitle('');
        setNewDesc('');
        setShowForm(false);
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggleComplete(todo: Todo) {
    const res = await fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed }),
    });
    if (res.ok) {
      const data = await res.json();
      setTodos(todos.map((t) => (t.id === todo.id ? data.todo : t)));
    }
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTitle.trim(), description: editDesc.trim() || null }),
    });
    if (res.ok) {
      const data = await res.json();
      setTodos(todos.map((t) => (t.id === id ? data.todo : t)));
      setEditingId(null);
    }
  }

  async function deleteTodo(id: string) {
    if (!confirm('Delete this todo?')) return;
    const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    if (res.ok) setTodos(todos.filter((t) => t.id !== id));
  }

  async function handleFileUpload(todoId: string, file: File) {
    setUploadingFor(todoId);
    try {
      // 1. Get presigned upload URL
      const res = await fetch(`/api/todos/${todoId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Upload failed');
        return;
      }
      const { uploadUrl, attachment } = await res.json();

      // 2. Upload directly to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      // 3. Update local state
      setTodos(
        todos.map((t) =>
          t.id === todoId ? { ...t, attachments: [...t.attachments, attachment] } : t
        )
      );
    } finally {
      setUploadingFor(null);
    }
  }

  async function deleteAttachment(todoId: string, attachmentId: string) {
    const res = await fetch(`/api/todos/${todoId}/attachments/${attachmentId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setTodos(
        todos.map((t) =>
          t.id === todoId
            ? { ...t, attachments: t.attachments.filter((a) => a.id !== attachmentId) }
            : t
        )
      );
    }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  const displayedTodos =
    filter === 'all'
      ? todos
      : todos.filter((t) => (filter === 'completed' ? t.completed : !t.completed));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">CloudTodo</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* New todo form */}
        {showForm ? (
          <form onSubmit={createTodo} className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              required
              className="w-full text-sm font-medium text-gray-900 placeholder-gray-400 border-none outline-none mb-2"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full text-sm text-gray-600 placeholder-gray-400 border-none outline-none resize-none mb-3"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewTitle(''); setNewDesc(''); }}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !newTitle.trim()}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {creating ? 'Adding…' : 'Add todo'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="w-full mb-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + New todo
          </button>
        )}

        {/* Todo list */}
        <div className="space-y-3">
          {displayedTodos.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-12">
              {filter === 'completed' ? 'No completed todos yet.' : 'Nothing here. Add a todo above.'}
            </p>
          )}

          {displayedTodos.map((todo) => (
            <div
              key={todo.id}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              {editingId === todo.id ? (
                /* Edit mode */
                <div>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-sm font-medium text-gray-900 border-b border-gray-200 outline-none mb-2 pb-1"
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    className="w-full text-sm text-gray-600 border border-gray-200 rounded-lg p-2 outline-none resize-none mb-3 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveEdit(todo.id)}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div>
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleComplete(todo)}
                      aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                        todo.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                    >
                      {todo.completed && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${todo.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {todo.title}
                      </p>
                      {todo.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{todo.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(todo.id);
                          setEditTitle(todo.title);
                          setEditDesc(todo.description ?? '');
                        }}
                        aria-label="Edit todo"
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteTodo(todo.id)}
                        aria-label="Delete todo"
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Attachments */}
                  {todo.attachments.length > 0 && (
                    <div className="mt-3 pl-8 flex flex-wrap gap-2">
                      {todo.attachments.map((att) => (
                        <span
                          key={att.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-full text-xs text-gray-600"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          {att.filename}
                          <button
                            onClick={() => deleteAttachment(todo.id, att.id)}
                            aria-label={`Remove ${att.filename}`}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Attach file */}
                  <div className="mt-2 pl-8">
                    <label className="cursor-pointer text-xs text-gray-400 hover:text-blue-500 transition-colors">
                      {uploadingFor === todo.id ? 'Uploading…' : '+ Attach file'}
                      <input
                        type="file"
                        className="sr-only"
                        disabled={uploadingFor === todo.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(todo.id, file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        {todos.length > 0 && (
          <p className="mt-6 text-center text-xs text-gray-400">
            {todos.filter((t) => !t.completed).length} remaining ·{' '}
            {todos.filter((t) => t.completed).length} completed
          </p>
        )}
      </main>
    </div>
  );
}
