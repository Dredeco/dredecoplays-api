'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const hash = await bcrypt.hash('Admin@123', 12);
    await queryInterface.bulkInsert('users', [{
      name: 'Administrador',
      email: 'admin@gamerzone.com.br',
      password: hash,
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date(),
    }]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@gamerzone.com.br' });
  },
};
