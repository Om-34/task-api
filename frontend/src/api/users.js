import { client } from './client';

export function getMyProfile() {
  return client.get('/users/me').then((res) => res.data);
}

export function getAllUsers() {
  return client.get('/users').then((res) => res.data);
}

export function deleteUser(userId) {
  return client.delete(`/users/${userId}`).then((res) => res.data);
}
