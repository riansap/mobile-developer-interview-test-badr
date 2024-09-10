'use strict'
const csv = require('csvtojson')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const { sequelize } = queryInterface
    const t = await sequelize.transaction()
    try {
      let path = './public/csv/regional-bps.csv'
      let data = await csv({ delimiter: ';' }).fromFile(path)

      if (Array.isArray(data)) {

        const options = { raw: true, transaction: t }

        let provinces = data.filter(item => item.type === 'Provinsi')
        let regencies = data.filter(item => item.type === 'Kabupaten')
        let subDistricts = data.filter(item => item.type === 'Kecamatan')
        let villages = data.filter(item => item.type === 'Desa')
        console.log(`Provinsi: ${provinces.length}`)
        console.log(`Kabupaten: ${regencies.length}`)
        console.log(`Kecamatan: ${subDistricts.length}`)
        console.log(`Desa: ${villages.length}`)

        console.log('=== RUN SEEDER ===')
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', null, options)
        await sequelize.query('TRUNCATE TABLE provinces', null, options)
        await sequelize.query('TRUNCATE TABLE regencies', null, options)
        await sequelize.query('TRUNCATE TABLE sub_districts', null, options)
        await sequelize.query('TRUNCATE TABLE villages', null, options)

        provinces = provinces.map(item => {
          return {
            id: item.province_id,
            name: item.province_name,
            created_at: new Date(),
            updated_at: new Date()
          }
        })
        regencies = regencies.map(item => {
          return {
            id: item.regency_id,
            name: item.regency_name,
            province_id: item.province_id,
            created_at: new Date(),
            updated_at: new Date()
          }
        })
        subDistricts = subDistricts.map(item => {
          return {
            id: item.sub_district_id,
            name: item.sub_district_name,
            regency_id: item.regency_id,
            created_at: new Date(),
            updated_at: new Date()
          }
        })
        villages = villages.map(item => {
          return {
            id: item.village_id,
            name: item.village_name,
            sub_district_id: item.sub_district_id,
            created_at: new Date(),
            updated_at: new Date()
          }
        })

        await queryInterface.bulkInsert('provinces', provinces, { transaction: t })
        await queryInterface.bulkInsert('regencies', regencies, { transaction: t })
        await queryInterface.bulkInsert('sub_districts', subDistricts, { transaction: t })
        await queryInterface.bulkInsert('villages', villages, { transaction: t })

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', null, options)
        console.log('=== SUCCESS ===')

        await t.commit()
      }
    } catch (err) {
      await t.rollback()
      console.error(err)
      throw err
    }
  },

  down: async (queryInterface, Sequelize) => {
    const { sequelize } = queryInterface
    const t = await sequelize.transaction()
    try {
      let path = './public/csv/regional-bps.csv'
      let data = await csv({ delimiter: ';' }).fromFile(path)

      if (Array.isArray(data)) {
        const options = { raw: true, transaction: t }

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', null, options)

        await sequelize.query('TRUNCATE TABLE provinces', null, options)
        await sequelize.query('TRUNCATE TABLE regencies', null, options)
        await sequelize.query('TRUNCATE TABLE sub_districts', null, options)
        await sequelize.query('TRUNCATE TABLE villages', null, options)

        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', null, options)
        console.log('=== SUCCESS ===')

        await t.commit()
      }
    } catch (err) {
      await t.rollback()
      console.error(err)
      throw err
    }
  }
}
