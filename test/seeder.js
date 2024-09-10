import models from '../app/models'
import { ORDER_STATUS, ORDER_TYPE, USER_ROLE, TRANSACTION_TYPE, TRANSACTION_CHANGE_TYPE } from '../app/helpers/constants'
import { generateToken, vendorID } from './config'
import { Op } from 'sequelize'

export const seederUser = {
  seed: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let entity1 = await models.Entity.findOne({
          where: { code: 'DNKSJBR' }
        })
        if (!entity1) entity1 = await models.Entity.create({
          name: 'Dinkes Jawa Barat Farmasi',
          address: 'Bandung kota, Jawa Barat, ID',
          code: 'DNKSJBR'
        })
        let entity2 = await models.Entity.findOne({
          where: { code: 'BIOFARMA' }
        })
        if (!entity2) entity2 = await models.Entity.create({
          code: 'BIOFARMA',
          name: 'Bio Farma',
          address: 'Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10220'
        })
        let entity3 = await models.Entity.findOne({
          where: { code: 'PKSBGRS' }
        })
        if (!entity3) entity3 = await models.Entity.create({
          code: 'PKSBGRS',
          name: 'Bogor Selatan Puskesmas',
          address: 'Batutulis, Bogor kota, Jawa Barat, ID'
        })
        let entity4 = await models.Entity.findOne({
          where: { code: 'BGRKOTA' }
        })
        if (!entity4) entity4 = await models.Entity.create({
          code: 'BGRKOTA',
          name: 'Dinkes Bogor Kota Farmasi',
          address: 'Bogor kota, Bogor kota, Jawa Barat, ID'
        })

        let entityOperator = await models.Entity.findOne({
          where: { name: 'Entitas Operator', code: 'ENTITASOPERATOR' }
        })
        if (!entityOperator) entityOperator = await models.Entity.create({
          name: 'Entitas Operator',
          address: 'Unknown',
          code: 'ENTITASOPERATOR'
        })

        const operator = await models.User.findOne({
          where: { role: USER_ROLE.OPERATOR }
        })
        if (!operator) await models.User.create({
          role: USER_ROLE.OPERATOR,
          entity_id: entityOperator.id,
          username: 'operatorr.ajaa',
          email: 'opreator@opratorr.com',
          password: '$2a$10$SOQYc61fuhcjBqp.wXETVekYX4.nnQ8wVJ.TvcHftikPDPg6nCwsS',
          firstname: 'this is operator',
          lastname: 'the lastname',
          gender: 1,
          date_of_birth: '1995-03-31',
          mobile_phone: '0123456789',
          address: 'jalan nanas 123'
        })
        let distrobutorCovid = await models.User.findOne({
          where: { role: USER_ROLE.DISTRIBUTOR_COVID, entity_id: entity2.id }
        })
        if (!distrobutorCovid) distrobutorCovid = await models.User.create({
          role: USER_ROLE.DISTRIBUTOR_COVID,
          entity_id: entity2.id,
          username: 'distributor.covid',
          email: 'biofarma@biofarm.com',
          password: '$2a$10$SOQYc61fuhcjBqp.wXETVekYX4.nnQ8wVJ.TvcHftikPDPg6nCwsS',
          firstname: 'Dahlea',
          lastname: 'the lastname',
          gender: 1,
          date_of_birth: '1995-03-31',
          mobile_phone: '0123456789',
          address: 'jalan nanas 123'
        })
        let puskesmas21 = await models.User.findOne({
          where: { username: 'puskesmas21' }
        })
        if (!puskesmas21) await models.User.create({
          role: USER_ROLE.OPERATOR,
          entity_id: entity3.id,
          username: 'puskesmas21',
          email: 'puskesmastwenty@one.com',
          password: '$2a$10$SOQYc61fuhcjBqp.wXETVekYX4.nnQ8wVJ.TvcHftikPDPg6nCwsS',
          firstname: 'Dahlah',
          lastname: 'the lastname',
          gender: 1,
          date_of_birth: '1995-03-31',
          mobile_phone: '0123456789',
          address: 'jalan nanas 123'
        })
        let disfarma1 = models.User.findOne({
          where: { username: 'disfarma1' }
        })
        if (!disfarma1) await models.User.create({
          role: USER_ROLE.MANAGER,
          entity_id: entity4.id,
          username: 'disfarma1',
          email: 'disisfarma@numberone.com',
          password: '$2a$10$SOQYc61fuhcjBqp.wXETVekYX4.nnQ8wVJ.TvcHftikPDPg6nCwsS',
          firstname: 'Dahlah',
          lastname: 'the lastname',
          gender: 1,
          date_of_birth: '1995-03-31',
          mobile_phone: '0123456789',
          address: 'jalan nanas 123'
        })
        resolve(true)
      } catch (err) {
        reject(err)
      }
    })
  }
}

export const seederOrderCovidTest = {
  seed: () => {
    return new Promise(async (resolve, reject) => {
      try {
        await seederUser.seed()
        let token
        let customer = await models.Entity.findOne({
          where: { code: 'DNKSJBR' }
        })
        let vendor = await models.Entity.findOne({
          where: { code: 'BIOFARMA' }
        })
        let user = await models.User.findOne({
          where: { role: USER_ROLE.DISTRIBUTOR_COVID, entity_id: vendor.id }
        })
        let material = await models.Material.findOne({ where: { code: 'SINOVAC' } })
        if (!material) material = await models.Material.create({
          description: 'SINOVAC',
          pieces_per_unit: 1,
          unit: 'dosis',
          temperature_sensitive: 0,
          name: 'Sinovac',
          managed_in_batch: 1,
          code: 'SINOVAC'
        })
        let materialEntity = await models.MaterialEntity.findOne({
          where: { material_id: material.id, entity_id: vendor.id }
        })
        if (!materialEntity) materialEntity = await models.MaterialEntity.create({
          material_id: material.id,
          entity_id: vendor.id,
          consumption_rate: 0,
          retailer_price: 0,
          tax: 0,
          min: 100,
          max: 1500
        })
        let manufacture = await models.Manufacture.findOne({
          where: {
            name: 'Biofarma'
          }
        })
        if (!manufacture) manufacture = await models.Manufacture.create({
          name: 'Biofarma',
          reference_id: 1,
        })
        let materialManufacture = await models.MaterialManufacture.findOne({
          where: { material_id: material.id, manufacture_id: manufacture.id }
        })
        if (!materialManufacture) materialManufacture = await models.MaterialManufacture.create({
          material_id: material.id, manufacture_id: manufacture.id
        })

        if(user.last_login !== new Date()) {
          token = generateToken({ userData: user })
          await user.update({token_login: token})
          await user.update({last_login: new Date()})
        }

        resolve({ token })
      } catch (err) {
        reject(err)
      }
    })
  },
  dataCreated: {
    'customer_code': 'DNKSJBR',
    'estimated_date': '2020-12-31',
    'sales_ref': '#SREF',
    'delivery_number': '#123-REGJKT',
    'order_items': [
      {
        'material_code': 'SINOVAC',
        'batches': [
          {
            'code': 'BATCHCODE123',
            'expired_date': '2020-12-31',
            'production_date': '2020-12-31',
            'manufacture_name': 'Biofarma',
            'qty': 100
          }
        ]
      }
    ]
  },
  dataNonBatchCreated: {
    'customer_code': 'DNKSJBR',
    'estimated_date': '2020-12-31',
    'sales_ref': '#SREF',
    'delivery_number': '#123-REGJKT',
    'order_items': [
      {
        'material_code': 'BCG',
        'qty': 100
      }
    ]
  }
}

export const seederOrderTest = {
  seed: () => {
    return new Promise(async (resolve, reject) => {
      await seederUser.seed()
      const user = await models.User.findOne({
        where: { role: USER_ROLE.OPERATOR }
      })
      let token = null
      if(user.last_login !== new Date()) {
        token = generateToken({ userData: user })
        await user.update({token_login: token})
        await user.update({last_login: new Date()})
      }
      const order = await models.Order.findOne({
        where: {
          status: ORDER_STATUS.PENDING,
          type: ORDER_TYPE.NORMAL
        }
      })
      const material = await models.Material.findOne({
        where: {name: 'SB'}
      })

      const disfarma1 = await models.User.findOne({
        where: {
          username: 'disfarma1'
        }
      })
      const puskesmas21 = await models.User.findOne({
        where: {
          username: 'puskesmas21'
        }
      })

      resolve({ token, material, order, disfarma1, puskesmas21 })
    })
  }
}

export const getUser = {
  findByRoleEntity: (roleID, entityID) => {
    return new Promise(async (resolve) => {
      let entity = null
      if(entityID) {
        entity = await models.Entity.findOne({
          where: { id: entityID }
        })
      }
      if (entityID && !entity) entity = await models.Entity.create({
        name: 'Master Entiti Test_'+Date.now(),
        address: '',
        code: 'ENTTEST'+Date.now()
      })

      let user = await models.User.findOne({
        where: { role: roleID , entity_id: entityID}
      })
      if(!user) {
        user = await models.User.create({
          role: roleID,
          entity_id: entityID,
          username: 'usertest_'+Date.now(),
          email: 'usertest'+Date.now()+'@test.com',
          password: '$2a$10$SOQYc61fuhcjBqp.wXETVekYX4.nnQ8wVJ.TvcHftikPDPg6nCwsS',
          firstname: 'this is test',
          lastname: 'the test',
          gender: 1,
          date_of_birth: '1995-03-31',
          mobile_phone: '0123456789',
          address: 'jalan nanas 123'
        })
      }
      let token = user.token
      if(user.last_login !== new Date()) {
        token = generateToken({ userData: user })
        await user.update({token_login: token})
        await user.update({last_login: new Date()})
      }
      resolve({ token, user })
    })
  }
}

export const seederStock = {
  findByMaterialID: (materialID, entityID, maxQty = 0) => {
    return new Promise(async (resolve) => {
      let material = await models.Material.findByPk(materialID)
      let materialEntity = await models.MaterialEntity.findOne({
        where: [
          { material_id: materialID }, 
          { entity_id: entityID }
        ]
      })
      let batchCondition = material.managed_in_batch ? {batch_id: {[Op.not]: null}} : {batch_id: {[Op.is]: null}}
      let stock = await models.Stock.findOne({
        where: [
          { material_entity_id: materialEntity.id },
          { qty: {[Op.gte]: maxQty} },
          batchCondition
        ]
      })
      if(!stock) {
        stock = await models.Stock.findOne({
          where: [
            { material_entity_id: materialEntity.id },
            batchCondition
          ]
        })
        stock.qty = maxQty
        await stock.save()
      } 
      // console.log(stock)
      resolve({ stock })
    })
  }
}

export const seederMaterial = {
  findByName: (name) => {
    return new Promise(async (resolve) => {
      let data = await models.Material.findOne({where: {name: name}})
      if(!data) {
        data = await models.Material.create({
          name: name,
          description: 'Description',
          pieces_per_unit: 10,
          unit: 'pieces',
          managed_in_batch: 0,
          code: name
        })
      }
      let materialTag = await models.MaterialTag.findOne({where: {title: 'RI Vaccine'}})
      if(!materialTag) materialTag = await models.MaterialTag.create({
        title: 'RI Vaccine'
      })
      let relation = await models.MaterialMaterialTag.findOne({where: [{material_id: data.id, material_tag_id: materialTag.id}]})
      if(!relation) relation = await models.MaterialMaterialTag.create({
        material_id: data.id,
        material_tag_id: materialTag.id
      })

      resolve({data, materialTag})
    })
  }
}

export const seederAssetType = {
  findByID: (id) => {
    return new Promise(async (resolve) => {
      let data = await models.AssetType.findByPk(id)
      if(!data) {
        data = await models.AssetType.create({
          name: 'Asset Type Test',
          type: 1,
        })
      }
      resolve({data})
    })
  }
}

export const getManufacture = {
  findByName: (name) => {
    return new Promise(async (resolve) => {
      let data = await models.Manufacture.findOne({ where: {name: name} })
      if(!data) {
        data = await models.Manufacture.create({
          name: name,
          reference_id: 'reference',
          description: 'Description',
          contact_name: 'Contact Name'
        })
      }
      resolve({data})
    })
  }
}

export const getMaterialTag = {
  findByTitle: (title) => {
    return new Promise(async (resolve) => {
      let data = await models.MaterialTag.findOne({ where: {title: title} })
      if(!data) {
        data = await models.MaterialTag.create({
          title: title,
        })
      }
      resolve({data})
    })
  }
}

export const transactionSeeder = {
  seed: (entityID) => {
    return new Promise(async (resolve) => {
      const materialName1 = 'BCG'
      const materialName2 = 'SB'
      // prepare material
      let material = await models.Material.findOne({ where: { name: materialName1} })
      if (!material) material = await models.Material.create({
        description: materialName1,
        pieces_per_unit: 10,
        unit: 'piece',
        temperature_sensitive: 0,
        name: materialName1,
        managed_in_batch: 1,
        code: materialName1
      })
      // prepare material entity
      let materialEntity = await models.MaterialEntity.findOne({
        where: { material_id: material.id, entity_id: entityID }
      })
      if (!materialEntity) materialEntity = await models.MaterialEntity.create({
        material_id: material.id,
        entity_id: entityID,
        consumption_rate: 0,
        retailer_price: 0,
        tax: 0,
        min: 100,
        max: 1500
      })

      let material2 = await models.Material.findOne({ where: { name: materialName2} })
      if (!material2) material2 = await models.Material.create({
        description: materialName2,
        pieces_per_unit: 10,
        unit: 'piece',
        temperature_sensitive: 0,
        name: materialName2,
        managed_in_batch: 1,
        code: materialName2
      })
      let materialEntity2 = await models.MaterialEntity.findOne({
        where: { material_id: material2.id, entity_id: entityID }
      })
      if (!materialEntity2) materialEntity2 = await models.MaterialEntity.create({
        material_id: material2.id,
        entity_id: entityID,
        consumption_rate: 0,
        retailer_price: 0,
        tax: 0,
        min: 100,
        max: 1500
      })
      let materialTag = await models.MaterialMaterialTag.findOne({
        where: { material_id: material.id }
      })
      resolve({material, material2, materialTag})
    })
  }
}