/* eslint-disable */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // change the name of the moduel user to user_account
    await queryInterface.renameTable('Users', 'UserAccounts');

    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

  },

  async down (queryInterface, Sequelize) {
    await queryInterface.renameTable('UserAccounts', 'Users');
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
