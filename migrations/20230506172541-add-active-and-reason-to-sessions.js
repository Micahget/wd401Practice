/* eslint-disable */
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Sessions', 'active', {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });

    await queryInterface.addColumn('Sessions', 'Reason', {
      type: Sequelize.STRING,
      allowNull: true
    });
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Sessions', 'active');
    await queryInterface.removeColumn('Sessions', 'Reason');
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
