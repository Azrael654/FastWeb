const jwt = require('jsonwebtoken');
const http = require('http');

const JWT_SECRET = 'fastprint_secret_key'; // default
const token = jwt.sign({ id: 'admin123', email: 'admin@fastprint.id', name: 'Admin', role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });

const options = {
  hostname: 'localhost',
  port: 4321,
  path: '/admin',
  method: 'GET',
  headers: {
    'Cookie': `fp_session=${token}`
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.slice(0, 1000)));
});

req.on('error', err => console.error(err));
req.end();
