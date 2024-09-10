import { Op } from 'sequelize'
import models from '../models'
import listResponse from '../helpers/listResponse'
import { ENTITY_TYPE, STATUS } from '../helpers/constants'

const userAttribute = ['id', 'username', 'firstname', 'lastname']

export async function masterIPVList(req, res, next) {
  const { keyword } = req.query
  const lang = req.headers['accept-language']

  req.include = [{
    association: 'material',
    attributes: ['id', 'name', 'is_vaccine'],
  }, {
    association: 'user_created_by',
    attributes: userAttribute
  }, {
    association: 'user_updated_by',
    attributes: userAttribute
  }]
  if(keyword) {
    req.include[0].where = {
      name: { [Op.like]: `%${keyword}%` }
    }
  }

  req.xlsColumns = [
    { key: 'material_id', title: lang == 'en' ? 'material id' : 'id material' },
    { key: 'material_name', title: lang == 'en' ? 'material name' : 'nama material' },
    { key: 'ipv', title: lang == 'en' ? 'National IP' : 'IP nasional' },
  ]

  req.xlsFilename = lang == 'en' ? `National IP Data Master ${Date()}` : `Master Data IP Nasional ${Date()}`

  return next()
}

export async function masterTargetList(req, res, next) {
  const { keyword } = req.query
  const condition = []
  if(keyword) {
    condition.push({
      name: { [Op.like]: `%${keyword}%` }
    })
  }
  req.condition = condition
  req.xlsColumns = [
    { key: 'id' },
    { key: 'name', title: 'nama kelompok sasaran' },
  ]

  req.xlsFilename = `Master Data Kelompok Sasaran ${Date()}`

  return next()
}

const attribute = ['id', 'name', ]
export async function masterTargetDistributionList(req, res, next) {
  const { keyword } = req.query
  const condition = []

  req.include = [{
    association: 'material',
    attributes: attribute
  }, {
    association: 'master_target',
    attributes: attribute
  }, {
    association: 'user_created_by',
    attributes: userAttribute
  }, {
    association: 'user_updated_by',
    attributes: userAttribute
  }]

  if(keyword) {
    condition.push({
      [Op.or]: [
        { '$material.name$': { [Op.like]: `%${keyword}%` } },
        { '$master_target.name$': { [Op.like]: `%${keyword}%` } }
      ]
    })
  }
  if(condition.length > 0) {
    req.condition = condition
  }

  req.xlsColumns = [
    { key: 'material_id', title: 'id material' },
    { key: 'material_name', title: 'nama material' },
    { key: 'master_target_id', title: 'id kelompok sasaran' },
    { key: 'master_target_name', title: 'kelompok sasaran' },
    { key: 'qty', title: 'jumlah pemberian' },
  ]

  req.xlsFilename = `Master Data Jumlah Pemberian ${Date()}`
  req.isFormatRelationCount = false
  return next()
}

export async function masterTargetRegencyList(req, res, next) {
  const currentDate = new Date().getFullYear()
  const { year = currentDate, province_id, regency_id } = req.query
  const entityCondition = []

  req.include = [{
    association: 'entity',
    attributes: [
      ...attribute,
      'province_id',
      'regency_id'
    ],
    required: true,
    include: [{
      association: 'province',
      attributes: attribute
    }]
  }, {
    association: 'master_target',
    attributes: attribute,
    required: true,
  }, {
    association: 'user_created_by',
    attributes: userAttribute
  }, {
    association: 'user_updated_by',
    attributes: userAttribute
  }]

  if(province_id) {
    entityCondition.push({province_id})
  }
  if(regency_id) {
    entityCondition.push({regency_id})
  }
  if(year) {
    req.condition = {year}
  }
  
  if(entityCondition.length > 0) {
    req.include[0].where = entityCondition
  }

  req.order = [['entity_id', 'ASC'], ['master_target_id', 'ASC']]
  return next()
}

export async function masterTargetRegencyData(req, res, next) {
  const { province_id, regency_id, year } = req.query
  if(!province_id) return res.status(204).json({ message: 'Pilih provinsi dahulu' })

  const {
    condition = {},
    include,
    order
  } = req

  const options = {
    order,
    where: condition,
    include,
  }
  const conditionEntity = [{province_id}]
  if(regency_id) conditionEntity.push({regency_id: regency_id})

  const dataTargetRegencies = await models.MasterTargetRegency.findAll(options)
  const dataRegencies = await models.Entity.findAll({
    where: [
      { type: ENTITY_TYPE.KOTA },
      { is_vendor: 1 },
      { status: STATUS.ACTIVE },
      ...conditionEntity
    ],
    include: [{
      association: 'province',
      attributes: attribute
    }, {
      association: 'regency',
      attributes: attribute
    }]
  })
  if(!dataRegencies) return res.status(204).json({ message: 'Pilih provinsi dahulu' })

  const datas = []
  const dataTargetProvinces = []
  datas.push({
    year,
    entity_name: null,
    province_id: province_id,
    province: dataRegencies[0].province,
    regency: null,
    address: null,
    updated_by: null,
    updated_at: null,
    targets: []
  })
  dataRegencies.forEach(regency => {
    const { name, province_id, id } = regency
    console.log(name)
    const targetRegencies = []
    dataTargetRegencies.filter(findEl => {
      return findEl.entity_id === id && findEl.year === year
    }).forEach(el => {
      const { master_target_id, qty, master_target, updated_at, user_updated_by } = el
      targetRegencies.push({
        master_target_id,
        qty,
        master_target,
        updated_at,
        user_updated_by
      })

      const targetProvIdx = dataTargetProvinces.findIndex(prov => prov.master_target_id === master_target_id)
      if(targetProvIdx >= 0) {
        dataTargetProvinces[targetProvIdx].qty += qty
      } else {
        dataTargetProvinces.push({
          master_target_id,
          qty,
          master_target
        })
      }
    })
    datas.push({
      year,
      entity_name: name,
      province_id: province_id,
      province: regency.province,
      regency: regency.regency,
      address: regency.address,
      user_updated_by: targetRegencies[0]?.user_updated_by || null,
      updated_at: targetRegencies[0]?.updated_at || null,
      targets: targetRegencies
    })
  })
  // push dataTargetProvinces to datas
  datas[0].targets = dataTargetProvinces

  return res.json(listResponse(datas.length, 1, 1, datas))
}