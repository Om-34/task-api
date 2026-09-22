import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import ErrorBanner from './ErrorBanner';
import EmptyState from './EmptyState';

export default function UserList({ users, loading, error, currentUserId, onDelete }) {
  const [deletingId, setDeletingId] = useState(null);
  const [rowError, setRowError] = useState('');

  async function handleDelete(user) {
    if (!window.confirm(`Delete user "${user.email}"? Their tasks will be removed too.`)) return;
    setDeletingId(user.id);
    setRowError('');
    try {
      await onDelete(user.id);
    } catch (err) {
      setRowError(err.message || 'Could not delete this user.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">All users</h2>
      <p className="mt-1 text-sm text-slate-500">Visible to admins only.</p>

      <div className="mt-4">
        <ErrorBanner message={error || rowError} />

        {loading && <LoadingSpinner label="Loading users…" />}

        {!loading && !error && users.length === 0 && (
          <EmptyState title="No users found" />
        )}

        {!loading && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Joined</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2 pr-4 font-medium text-slate-800">{u.email}</td>
                    <td className="py-2 pr-4 capitalize text-slate-600">{u.role}</td>
                    <td className="py-2 pr-4 text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      {u.id === currentUserId ? (
                        <span className="text-xs text-slate-400">(you)</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === u.id}
                          className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          {deletingId === u.id ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
