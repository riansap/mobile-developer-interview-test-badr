'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    const transaction = await queryInterface.sequelize.transaction()

    try{
      await queryInterface.addIndex('coldstorages', ['entity_id'], {transaction})
      await queryInterface.addIndex('coldstorage_materials', ['coldstorage_id'], {transaction})
      await queryInterface.addIndex('coldstorage_materials', ['entity_id'], {transaction})
      await queryInterface.addIndex('coldstorage_materials', ['master_material_id'], {transaction})

      await transaction.commit()
    }catch(err){
      console.log(err)
      await transaction.rollback()
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction()

    try{
      await queryInterface.removeIndex('coldstorages', ['entity_id'], {transaction})
      await queryInterface.removeIndex('coldstorage_materials', ['coldstorage_id'], {transaction})
      await queryInterface.removeIndex('coldstorage_materials', ['entity_id'], {transaction})
      await queryInterface.removeIndex('coldstorage_materials', ['master_material_id'], {transaction})

      await transaction.commit()
    }catch(err){
      await transaction.rollback()
    }
  }
};
