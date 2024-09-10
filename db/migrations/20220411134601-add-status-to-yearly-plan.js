'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        /**
         * Add altering commands here.
         *
         * Example:
         * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
         */
        await queryInterface.addColumn('yearly_plans', 'status', {
            allowNull: true,
            type: Sequelize.STRING,
        })

        await queryInterface.addColumn('yearly_parent_has_target', 'status', {
            allowNull: true,
            type: Sequelize.STRING,
        })

        await queryInterface.addColumn('yearly_plan_has_ipvs', 'status', {
            allowNull: true,
            type: Sequelize.STRING,
        })

        await queryInterface.addColumn('yearly_child_has_target', 'status', {
            allowNull: true,
            type: Sequelize.STRING,
        })

        await queryInterface.addColumn('yearly_child_has_ipvs', 'status', {
            allowNull: true,
            type: Sequelize.STRING,
        })
    },

    down: async (queryInterface, Sequelize) => {
        /**
         * Add reverting commands here.
         *
         * Example:
         * await queryInterface.dropTable('users');
         */
        await queryInterface.removeColumn('yearly_plans', 'status')
        await queryInterface.removeColumn('yearly_parent_has_target', 'status')
        await queryInterface.removeColumn('yearly_plan_has_ipvs', 'status')
        await queryInterface.removeColumn('yearly_child_has_target', 'status')
        await queryInterface.removeColumn('yearly_child_has_ipvs', 'status')
    }
};
