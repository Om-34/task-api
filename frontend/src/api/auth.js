import { client } from './client';

export function registerUser({ email, password }) {
  return client.post('/auth/register', { email, password }).then((res) => res.data);
}

export function loginUser({ email, password }) {
  return client.post('/auth/login', { email, password }).then((res) => res.data);
}
