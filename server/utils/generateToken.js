const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkey12345!@#', {
    expiresIn: '30d',
  });
};

module.exports = generateToken;
