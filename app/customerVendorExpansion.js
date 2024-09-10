import dotenv from 'dotenv'
import models from './models'
import { Op, Sequelize } from 'sequelize'

dotenv.config()

const {
  CustomerVendor,
  Entity
} = models
const { sequelize } = models

const getProvKabKotRelationData = async () => {
  const provinceEntities = await Entity.findAll({
    attributes: ['id', 'province_id_old', 'province_id_new'],
    where: {
      type: 1,
      status: 1,
      deleted_at: null,
      province_id_old: {
        [Op.ne]: Sequelize.literal('province_id_new')
      }
    },
  })

  const regencyEntities = await Entity.findAll({
    attributes: ['id', 'province_id_old', 'province_id_new', 'regency_id_old', 'regency_id_new'],
    where: {
      type: 2,
      status: 1,
      deleted_at: null,
      regency_id_old: {
        [Op.ne]: Sequelize.literal('regency_id_new')
      },
      province_id_new: {
        [Op.in]: provinceEntities.filter(entity => entity.province_id_new !== null).map(entity => entity.province_id_new)
      }
    },
  })

  let dataCustomerVendor = []
  provinceEntities.forEach((provinceEntity) => {
    const filteredRegencyEntities = regencyEntities.filter((regencyEntity) => regencyEntity.province_id_new === provinceEntity.province_id_new)

    filteredRegencyEntities.forEach((filteredRegencyEntity) => {
      dataCustomerVendor.push({
        customer_id: filteredRegencyEntity.id,
        vendor_id: provinceEntity.id,
        is_distribution: 1,
        is_consumption: 0,
        is_extermination: 1,
        created_at: '2024-01-30 00:00:00',
        updated_at: '2024-01-30 00:00:00',
      })
    })
  })

  return dataCustomerVendor
}

const getKabKotPuskesmasRelationData = async () => {
  const regencyEntities = await Entity.findAll({
    attributes: ['id', 'province_id_old', 'province_id_new', 'regency_id_old', 'regency_id_new'],
    where: {
      type: 2,
      status: 1,
      deleted_at: null,
      regency_id_old: {
        [Op.ne]: Sequelize.literal('regency_id_new')
      }
    },
  })

  const puskesmasEntities = await Entity.findAll({
    attributes: ['id', 'province_id_old', 'province_id_new', 'regency_id_old', 'regency_id_new', 'sub_district_id_old', 'sub_district_id_new'],
    where: {
      type: 3,
      is_vendor: 1,
      status: 1,
      deleted_at: null,
      sub_district_id_old: {
        [Op.ne]: Sequelize.literal('sub_district_id_new')
      },
      regency_id_new: {
        [Op.in]: regencyEntities.filter((entity) => entity.regency_id_new !== null).map(entity => entity.regency_id_new)
      }
    },
  })

  let dataCustomerVendor = []
  regencyEntities.forEach((regencyEntity) => {
    const filteredPuskesmasEntities = puskesmasEntities.filter((puskesmasEntity) => puskesmasEntity.regency_id_new === regencyEntity.regency_id_new)

    filteredPuskesmasEntities.forEach((filteredPuskesmasEntity) => {
      dataCustomerVendor.push({
        customer_id: filteredPuskesmasEntity.id,
        vendor_id: regencyEntity.id,
        is_distribution: 1,
        is_consumption: 0,
        is_extermination: 1,
        created_at: '2024-01-30 00:00:00',
        updated_at: '2024-01-30 00:00:00',
      })
    })
  })

  return dataCustomerVendor
}

const getPuskesmasKonsumenRelationData = async () => {
  const puskesmasEntities = await Entity.findAll({
    attributes: ['id', 'province_id_old', 'province_id_new', 'regency_id_old', 'regency_id_new', 'sub_district_id_old', 'sub_district_id_new', 'village_id_old', 'village_id_new'],
    where: {
      type: 3,
      is_vendor: 1,
      status: 1,
      deleted_at: null,
      sub_district_id_old: {
        [Op.ne]: Sequelize.literal('sub_district_id_new')
      }
    },
  })

  const konsumenEntities = await Entity.findAll({
    attributes: ['id', 'province_id_old', 'province_id_new', 'regency_id_old', 'regency_id_new', 'sub_district_id_old', 'sub_district_id_new', 'village_id_old', 'village_id_new'],
    where: {
      type: 3,
      is_vendor: 0,
      status: 1,
      deleted_at: null,
      sub_district_id_old: {
        [Op.ne]: Sequelize.literal('sub_district_id_new')
      },
      [Op.or]: [
        {
          sub_district_id_new: {
            [Op.in]: puskesmasEntities.filter(entity => entity.sub_district_id_new !== null).map(entity => entity.sub_district_id_new)
          }
        },
        {
          village_id_new: {
            [Op.in]: puskesmasEntities.filter(entity => entity.village_id_new !== null).map(entity => entity.village_id_new)
          }
        }
      ]
    },
  })

  let dataCustomerVendor = []
  puskesmasEntities.forEach((puskesmasEntity) => {
    const filteredKonsumenEntities = konsumenEntities.filter((konsumenEntity) => konsumenEntity.sub_district_id_new === puskesmasEntity.sub_district_id_new || (konsumenEntity.village_id_new === puskesmasEntity.village_id_new && konsumenEntity.village_id_new !== null))

    filteredKonsumenEntities.forEach((filteredKonsumenEntity) => {
      dataCustomerVendor.push({
        customer_id: filteredKonsumenEntity.id,
        vendor_id: puskesmasEntity.id,
        is_distribution: 0,
        is_consumption: 1,
        is_extermination: 0,
        created_at: '2024-01-30 00:00:00',
        updated_at: '2024-01-30 00:00:00',
      })
    })
  })

  return dataCustomerVendor
}

const start = async () => {
  const trx = await sequelize.transaction()
  try {
    let data = []

    /* Dinkes Prov -> Dinkes Kab/Kot */
    const provKabKot = await getProvKabKotRelationData()
    data = [...data, ...provKabKot]

    /* Dinkes Kab/Kot -> Puskesmas */
    const kabKotPuskesmas = await getKabKotPuskesmasRelationData()
    data = [...data, ...kabKotPuskesmas]

    /* Dinkes Kab/Kot -> Puskesmas */
    const puskesmasKonsumen = await getPuskesmasKonsumenRelationData()
    data = [...data, ...puskesmasKonsumen]

    console.log('total data:', data.length)

    await CustomerVendor.bulkCreate(data, {
      //ignoreDuplicates: true,
      updateOnDuplicate: ['created_at', 'updated_at'],
      transaction: trx,
    })

    await trx.commit()
    console.log('# Berhasil insert customer vendor!')
  } catch (error) {
    await trx.rollback()
    console.error('# Error', error)
  } finally {
    await sequelize.close()
    process.exit()
  }
}

start()
