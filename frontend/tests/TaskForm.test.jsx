import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from '../src/components/TaskForm';

describe('TaskForm', () => {
  it('shows a required-field error and does not submit when title is empty', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(<TaskForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /save task/i }));

    expect(await screen.findByText(/title is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed values with the default pending status when valid', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(<TaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), '  Write report  ');
    await user.type(screen.getByLabelText(/description/i), 'Q3 summary');
    await user.click(screen.getByRole('button', { name: /save task/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Write report',
      description: 'Q3 summary',
      status: 'pending',
    });
  });

  it('surfaces an error message when onSubmit rejects', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockRejectedValue(new Error('Server exploded'));

    render(<TaskForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/title/i), 'Any task');
    await user.click(screen.getByRole('button', { name: /save task/i }));

    expect(await screen.findByText(/server exploded/i)).toBeInTheDocument();
  });

  it('regression: editing a task whose description is null does not crash', async () => {
    // The backend stores an omitted description as `null`, not `""`.
    // TaskForm must normalize that instead of calling .trim() on null.
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const taskWithNullDescription = {
      id: 1,
      title: 'Buy groceries',
      description: null,
      status: 'pending',
    };

    render(<TaskForm initialData={taskWithNullDescription} onSubmit={onSubmit} />);

    await user.selectOptions(screen.getByLabelText(/status/i), 'completed');
    await user.click(screen.getByRole('button', { name: /save task/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Buy groceries',
      description: null,
      status: 'completed',
    });
  });
});
