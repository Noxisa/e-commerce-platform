const request = require('supertest');
const app = require('./app');

(async () => {
  const res = await request(app).post('/api/auth/signup').send({ email: 'new@u.com', password: 'p' });
  console.log('status', res.status);
  console.log('body', res.body);
  console.log('headers', res.headers);
})();
