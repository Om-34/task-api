import { screen } from '@testing-library/react';
import DashboardPage from '../src/pages/DashboardPage';
import { renderWithProviders } from './test-utils';
import { TOKEN_STORAGE_KEY } from '../src/config';

jest.mock('../src/api/auth', () => ({
  loginUser: jest.fn(),
  registerUser: jest.fn(),
}));
jest.mock('../src/api/users', () => ({
  getMyProfile: jest.fn(),
  getAllUsers: jest.fn(),
  deleteUser: jest.fn(),
}));
jest.mock('../src/api/tasks', () => ({
  getTasks: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
}));

import { getMyProfile, getAllUsers } from '../src/api/users';
import { getTasks } from '../src/api/tasks';

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem(TOKEN_STORAGE_KEY, 'fake.jwt.token');
    getTasks.mockResolvedValue([]);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('does not show the admin user panel for a normal user', async () => {
    getMyProfile.mockResolvedValue({
      id: 1,
      email: 'plain-user@example.com',
      role: 'user',
      created_at: new Date().toISOString(),
    });

    renderWithProviders(<DashboardPage />, { route: '/dashboard' });

    expect(await screen.findByText(/my tasks/i)).toBeInTheDocument();
    expect(screen.queryByText(/all users/i)).not.toBeInTheDocument();
    expect(getAllUsers).not.toHaveBeenCalled();
  });

  it('shows the admin user panel and "All tasks" heading for an admin', async () => {
    getMyProfile.mockResolvedValue({
      id: 2,
      email: 'admin@example.com',
      role: 'admin',
      created_at: new Date().toISOString(),
    });
    getAllUsers.mockResolvedValue([
      { id: 2, email: 'admin@example.com', role: 'admin', created_at: new Date().toISOString() },
    ]);

    renderWithProviders(<DashboardPage />, { route: '/dashboard' });

    expect(await screen.findByText(/all tasks/i)).toBeInTheDocument();
    expect(await screen.findByText(/all users/i)).toBeInTheDocument();
    expect(getAllUsers).toHaveBeenCalled();
  });
});
