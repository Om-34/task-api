import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../src/pages/LoginPage';
import { renderWithProviders } from './test-utils';

// Mock the network-facing modules so this stays a component test, not a
// real HTTP call. loginUser is used by AuthContext.login(); getMyProfile is
// called right after a successful login to populate the user profile.
jest.mock('../src/api/auth', () => ({
  loginUser: jest.fn(),
  registerUser: jest.fn(),
}));
jest.mock('../src/api/users', () => ({
  getMyProfile: jest.fn(),
  getAllUsers: jest.fn(),
  deleteUser: jest.fn(),
}));

import { loginUser } from '../src/api/auth';
import { getMyProfile } from '../src/api/users';

function renderLoginPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<div>Dashboard content</div>} />
    </Routes>,
    { route: '/login' }
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('shows required-field errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(loginUser).not.toHaveBeenCalled();
  });

  it('shows a validation error for a malformed email', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/enter a valid email/i)).toBeInTheDocument();
    expect(loginUser).not.toHaveBeenCalled();
  });

  it('logs in and redirects to the dashboard on success', async () => {
    loginUser.mockResolvedValue({ access_token: 'fake.jwt.token', token_type: 'bearer' });
    getMyProfile.mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      role: 'user',
      created_at: new Date().toISOString(),
    });

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/dashboard content/i)).toBeInTheDocument();
    expect(loginUser).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' });
    expect(localStorage.getItem('task_manager_token')).toBe('fake.jwt.token');
  });

  it('displays the API error message on failed login', async () => {
    loginUser.mockRejectedValue({
      response: { status: 401, data: { detail: 'Invalid email or password' } },
    });

    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });
});
