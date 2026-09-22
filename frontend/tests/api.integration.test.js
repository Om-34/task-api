import MockAdapter from 'axios-mock-adapter';
import { client, extractErrorMessage } from '../src/api/client';
import { loginUser, registerUser } from '../src/api/auth';
import { getTasks, createTask } from '../src/api/tasks';
import { TOKEN_STORAGE_KEY } from '../src/config';

// This test exercises the real axios instance (client.js) and its
// request/response interceptors end-to-end against a mocked HTTP layer,
// rather than mocking the api/*.js functions themselves. It verifies:
//  - requests are sent to the correct endpoints with the correct payloads
//  - the JWT is automatically attached once stored
//  - backend error shapes are normalized into readable messages
describe('API integration (auth + tasks over HTTP)', () => {
  let mock;

  beforeEach(() => {
    mock = new MockAdapter(client);
    localStorage.clear();
  });

  afterEach(() => {
    mock.restore();
  });

  it('registerUser posts to /auth/register with the given payload', async () => {
    mock.onPost('/auth/register').reply(201, {
      id: 1,
      email: 'new@example.com',
      role: 'user',
      created_at: new Date().toISOString(),
    });

    const result = await registerUser({ email: 'new@example.com', password: 'password123' });

    expect(mock.history.post[0].url).toBe('/auth/register');
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      email: 'new@example.com',
      password: 'password123',
    });
    expect(result.email).toBe('new@example.com');
  });

  it('loginUser posts credentials to /auth/login and returns a token', async () => {
    mock.onPost('/auth/login').reply(200, { access_token: 'abc.def.ghi', token_type: 'bearer' });

    const result = await loginUser({ email: 'user@example.com', password: 'password123' });

    expect(result.access_token).toBe('abc.def.ghi');
  });

  it('attaches the stored JWT as a Bearer token on subsequent requests', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'my-jwt-token');
    mock.onGet('/tasks').reply((config) => {
      expect(config.headers.Authorization).toBe('Bearer my-jwt-token');
      return [200, []];
    });

    const tasks = await getTasks();
    expect(tasks).toEqual([]);
  });

  it('sends the correct payload when creating a task', async () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, 'my-jwt-token');
    mock.onPost('/tasks').reply(201, {
      id: 5,
      title: 'Write report',
      description: 'Q3 summary',
      status: 'pending',
      created_at: new Date().toISOString(),
      owner_id: 1,
    });

    const task = await createTask({ title: 'Write report', description: 'Q3 summary', status: 'pending' });

    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      title: 'Write report',
      description: 'Q3 summary',
      status: 'pending',
    });
    expect(task.id).toBe(5);
  });

  it('normalizes a FastAPI validation error into a readable string', async () => {
    mock.onPost('/tasks').reply(422, {
      detail: 'Validation error',
      errors: [{ loc: ['body', 'title'], msg: 'Field required' }],
    });

    try {
      await createTask({ title: '', status: 'pending' });
      throw new Error('expected createTask to reject');
    } catch (err) {
      expect(extractErrorMessage(err)).toMatch(/title: Field required/i);
    }
  });

  it('normalizes a network failure (no response) into a friendly message', async () => {
    mock.onGet('/tasks').networkError();

    try {
      await getTasks();
      throw new Error('expected getTasks to reject');
    } catch (err) {
      expect(extractErrorMessage(err)).toMatch(/network error/i);
    }
  });
});
