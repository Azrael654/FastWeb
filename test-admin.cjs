const http = require('http');

http.get('http://localhost:4321/admin', (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data.slice(0, 500)));
}).on('error', err => console.error(err));
