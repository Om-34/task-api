import { useState } from 'react';
import StatusBadge from './StatusBadge';
import TaskForm from './TaskForm';

export default function TaskItem({ task, showOwner, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function handleDelete() {
    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await onDelete(task.id);
    } catch (err) {
      setDeleteError(err.message || 'Could not delete this task.');
    } finally {
      setDeleting(false);
    }
  }

  if (isEditing) {
    return (
      <li className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4">
        <TaskForm
          initialData={task}
          submitLabel="Save changes"
          onCancel={() => setIsEditing(false)}
          onSubmit={async (values) => {
            await onUpdate(task.id, values);
            setIsEditing(false);
          }}
        />
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-medium text-slate-900">{task.title}</h3>
            <StatusBadge status={task.status} />
          </div>
          {task.description && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{task.description}</p>
          )}
          <p className="mt-2 text-xs text-slate-400">
            Created {new Date(task.created_at).toLocaleString()}
            {showOwner && task.owner_id != null && ` · Owner ID: ${task.owner_id}`}
          </p>
          {deleteError && <p className="mt-1 text-sm text-red-600">{deleteError}</p>}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </li>
  );
}
