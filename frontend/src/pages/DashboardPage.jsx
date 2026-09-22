import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../api/client';
import { getTasks, createTask, updateTask, deleteTask } from '../api/tasks';
import { getAllUsers, deleteUser } from '../api/users';
import NavBar from '../components/NavBar';
import TaskList from '../components/TaskList';
import UserList from '../components/UserList';

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState('');

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(isAdmin);
  const [usersError, setUsersError] = useState('');

  const loadTasks = useCallback(() => {
    setTasksLoading(true);
    setTasksError('');
    return getTasks()
      .then(setTasks)
      .catch((err) => setTasksError(extractErrorMessage(err, 'Could not load tasks.')))
      .finally(() => setTasksLoading(false));
  }, []);

  const loadUsers = useCallback(() => {
    if (!isAdmin) return undefined;
    setUsersLoading(true);
    setUsersError('');
    return getAllUsers()
      .then(setUsers)
      .catch((err) => setUsersError(extractErrorMessage(err, 'Could not load users.')))
      .finally(() => setUsersLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleCreateTask(values) {
    try {
      const created = await createTask(values);
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Could not create the task.'));
    }
  }

  async function handleUpdateTask(taskId, values) {
    try {
      const updated = await updateTask(taskId, values);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Could not update the task.'));
    }
  }

  async function handleDeleteTask(taskId) {
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Could not delete the task.'));
    }
  }

  async function handleDeleteUser(userId) {
    try {
      await deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      throw new Error(extractErrorMessage(err, 'Could not delete the user.'));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        {user && (
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h1 className="text-lg font-semibold text-slate-900">
              Welcome, {user.email.split('@')[0]}
            </h1>
            <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-400">Email</dt>
                <dd className="font-medium text-slate-800">{user.email}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Role</dt>
                <dd className="font-medium capitalize text-slate-800">{user.role}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Member since</dt>
                <dd className="font-medium text-slate-800">
                  {new Date(user.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {isAdmin && (
          <UserList
            users={users}
            loading={usersLoading}
            error={usersError}
            currentUserId={user?.id}
            onDelete={handleDeleteUser}
          />
        )}

        <TaskList
          title={isAdmin ? 'All tasks' : 'My tasks'}
          tasks={tasks}
          loading={tasksLoading}
          error={tasksError}
          showOwner={isAdmin}
          onCreate={handleCreateTask}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      </main>
    </div>
  );
}
