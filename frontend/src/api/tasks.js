import { client } from './client';

export function getTasks() {
  return client.get('/tasks').then((res) => res.data);
}

export function createTask({ title, description, status }) {
  return client.post('/tasks', { title, description, status }).then((res) => res.data);
}

export function updateTask(taskId, updates) {
  return client.put(`/tasks/${taskId}`, updates).then((res) => res.data);
}

export function deleteTask(taskId) {
  return client.delete(`/tasks/${taskId}`).then((res) => res.data);
}
