import { useState } from 'react';
import ErrorBanner from './ErrorBanner';

export default function TaskForm({ initialData, onSubmit, onCancel, submitLabel = 'Save task' }) {
  const [form, setForm] = useState(() => ({
    title: initialData?.title ?? '',
    // The backend stores an empty description as null; normalize it to ''
    // here so the textarea and validation always work with a string.
    description: initialData?.description ?? '',
    status: initialData?.status ?? 'pending',
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate(values) {
    const errors = {};
    if (!values.title.trim()) {
      errors.title = 'Title is required.';
    } else if (values.title.trim().length > 200) {
      errors.title = 'Title must be 200 characters or fewer.';
    }
    if (values.description && values.description.length > 2000) {
      errors.description = 'Description must be 2000 characters or fewer.';
    }
    return errors;
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setApiError('');

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
      });
    } catch (err) {
      setApiError(err.message || 'Could not save the task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <ErrorBanner message={apiError} />

      <div>
        <label htmlFor="task-title" className="mb-1 block text-sm font-medium text-slate-700">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="task-title"
          type="text"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="e.g. Write project report"
        />
        {fieldErrors.title && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="task-description" className="mb-1 block text-sm font-medium text-slate-700">
          Description
        </label>
        <textarea
          id="task-description"
          rows={3}
          value={form.description ?? ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Optional details…"
        />
        {fieldErrors.description && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
        )}
      </div>

      <div>
        <label htmlFor="task-status" className="mb-1 block text-sm font-medium text-slate-700">
          Status
        </label>
        <select
          id="task-status"
          value={form.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
