import { useState } from 'react';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import ErrorBanner from './ErrorBanner';

export default function TaskList({
  title,
  tasks,
  loading,
  error,
  showOwner,
  onCreate,
  onUpdate,
  onDelete,
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {showCreateForm ? 'Close' : '+ New task'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <TaskForm
            submitLabel="Create task"
            onCancel={() => setShowCreateForm(false)}
            onSubmit={async (values) => {
              await onCreate(values);
              setShowCreateForm(false);
            }}
          />
        </div>
      )}

      <div className="mt-4">
        <ErrorBanner message={error} />

        {loading && <LoadingSpinner label="Loading tasks…" />}

        {!loading && !error && tasks.length === 0 && (
          <EmptyState
            title="No tasks yet"
            subtitle="Create your first task using the button above."
          />
        )}

        {!loading && tasks.length > 0 && (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                showOwner={showOwner}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
