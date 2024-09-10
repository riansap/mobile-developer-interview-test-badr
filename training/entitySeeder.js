import { USER_ROLE, ENTITY_TYPE } from '../app/helpers/constants'
import models from '../app/models'
import csv from 'csvtojson'
const {
  sequelize
} = models

export async function entitySeeder(provinceID, userTypes = [], materialIDs = [], resetMode = false) {
  try {
    const options = { raw: true }
    console.log('=== RUN SEEDER ===')
    if(resetMode) {
      console.log('---You are using reset mode!!-')
      console.log('------Reset Data------')
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', null, options)
      await sequelize.query('TRUNCATE TABLE entities', null, options)
      await sequelize.query('TRUNCATE TABLE customer_vendors', null, options)
      await sequelize.query('TRUNCATE TABLE users', null, options)
    }
    
    console.log('Test '+provinceID)
    let province = await models.Province.findByPk(provinceID)
    let regencies = await models.Regency.findAll(
      {
        where: { province_id: provinceID }
      }
    )
    
    let nationalEntity = await models.Entity.findOne({
      where: { code: '00' }
    }).then(function (nat) {
      if(nat) return nat
      return models.Entity.create({
        name: 'NASIONAL',
        address: 'ID',
        code: '00'
      })
    })

    let provEntity = await models.Entity.create(formatEntityData(province, ENTITY_TYPE.PROVINSI, province))
    console.log('1----- berhasil Input data Prov '+provinceID)
    let provinceMaterial = getMaterialEntity(provEntity, materialIDs)
    await models.MaterialEntity.bulkCreate(provinceMaterial)

    await provEntity.setVendors(nationalEntity)
    let provUsers = await Promise.all(createUser(USER_ROLE.MANAGER_COVID, [provEntity], userTypes))
    await models.User.bulkCreate(provUsers)
    console.log('2----- berhasil Input data User Prov '+provinceID)

    let path = './public/csv/puskesmas.csv'
    let data = await csv({ delimiter: ';' }).fromFile(path)

    // await regencies.map(async regency => {
    for(let regency of regencies) {
      let dataFormatted = formatEntityData(regency, ENTITY_TYPE.KOTA, province, regency)
      let regEntity = await models.Entity.create(
        dataFormatted
      )
      console.log('3----- berhasil Input data Kota/Kab '+regency.name)
      let regUsers = await createUser(USER_ROLE.MANAGER_COVID, [regEntity], userTypes)
      await models.User.bulkCreate(regUsers)

      let regencyMaterial = getMaterialEntity(regEntity, materialIDs)
      await models.MaterialEntity.bulkCreate(regencyMaterial)

      console.log('4----- berhasil Input data User Kota/Kab '+regency.name)
      await regEntity.setVendors(provEntity.id)
      
      let puskesmas = data.filter(item => item.regency_id === regency.id)
      puskesmas = await Promise.all(puskesmas.map(item => {
        return {
          code: item.id,
          name: item.name,
          type: ENTITY_TYPE.FASKES,
          address: regency.name+', '+province.name+', ID',
          province_id: province.id,
          regency_id: regency.id,
          created_at: new Date(),
          updated_at: new Date()
        }
      }))
      // console.log(puskesmas)
      let pkmIds = await models.Entity.bulkCreate(puskesmas, { returning: true })
      console.log('5----- berhasil Input data PKM '+regency.name)
      // assign entity to regency
      await regEntity.setCustomers(pkmIds)

      // set insite building PKM
      // await pkmIds.map(async item => {
      for(let item of pkmIds) {
        let pkmInsiteBuilding = await models.Entity.create({
          code: item.code+'_01',
          name: item.name+' dalam Gedung',
          type: ENTITY_TYPE.FASKES,
          address: item.address,
          province_id: province.id,
          regency_id: regency.id,
          created_at: new Date(),
          updated_at: new Date(),
        })
        console.log('-------- berhasil Input data PKM Dalam Gedung '+item.name)
        await item.setCustomers(pkmInsiteBuilding)

        let pkmMaterial = getMaterialEntity(item, materialIDs)
        await models.MaterialEntity.bulkCreate(pkmMaterial)

        let pkmBuildingMaterial = getMaterialEntity(pkmInsiteBuilding, materialIDs)
        await models.MaterialEntity.bulkCreate(pkmBuildingMaterial)
      }
      let pkms = await createUser(USER_ROLE.OPERATOR_COVID, pkmIds, userTypes)
      await models.User.bulkCreate(pkms)
      console.log('7----- berhasil Input data user Puskesmas '+regency.name)
    }

    if(resetMode) {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', null, options)
    }

    return '8------ berhasil Input data entity '+provinceID
  } catch(error) {
    console.log(error)
    return error
  }
}

function getMaterialEntity(entity, materialIDs) {
  return materialIDs.map(materialID => {
    return {
      entity_id: entity.id,
      material_id: materialID,
      created_by: 1,
      updated_by: 1,
      consumption_rate: 0,
      retailer_price: 0,
      tax: 0,
      min: 0,
      max: 0
    }
  })
}

function formatEntityData(data, type, province, regency = '') {
  let formatAddress = []
  if(regency) formatAddress.push(regency.name)
  if(province) formatAddress.push(province.name)
  formatAddress.push('ID')

  const res = {
    name: data.name.replace(/ /g,"_"),
    code: data.id,
    type: type,
    address: formatAddress.join(', '),
    province_id: province.id,
    regency_id: regency.id
  }
  return res
}

function createUser(role, entities, types = []) {
  // 
  try {
    console.log('---------------mapping users-------------')
    let users = []
    entities.map(entity => {
      types.map( type => {
        users.push({
          username: type+'_'+entity.code,
          firstname: entity.name,
          lastname: type,
          role: role,
          password: 'Smile12*',
          email: type+'_'+entity.code+'@smile-training.id',
          entity_id: entity.id
        })
      })
    })
    console.log('---------------finish users-------------')
    return users
  } catch(error) {
    console.log(error)
    return error
  }
}