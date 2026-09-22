export default function StatusBadge({ status }) {
  const isCompleted = status === 'completed';
  return (
    <span
      className={
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ' +
        (isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')
      }
    >
      {isCompleted ? 'Completed' : 'Pending'}
    </span>
  );
}
