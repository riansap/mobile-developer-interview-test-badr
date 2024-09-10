import { Op } from 'sequelize'
import joi from 'joi'

const userAttribute = ['id', 'username', 'firstname', 'lastname']

const mappingContents = ({ data }) => {
  let item = {
    ...data.dataValues,
    material: data.dataValues['master_material'],
    material_name: data.dataValues['master_material']?.name,
    activity_name:  data.dataValues['activity']?.name,
    master_target_name: data.dataValues['master_target']?.name
  }
  delete item.master_material
  return item
}

export async function masterIPVList(req, res, next) {
  const { keyword } = req.query
  const lang = req.headers['accept-language']

  req.include = [{
    association: 'master_material',
    attributes: ['id', 'name', 'is_vaccine'],
  }, {
    association: 'activity',
    attributes: ['id', 'name'],
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

  req.mappingDocs = ({ docs }) => docs.map((doc) => 
    mappingContents({data: doc})
  )
  req.mappingContents = mappingContents

  req.xlsColumns = [
    { key: 'material_id', title: lang == 'en' ? 'material id' : 'id material' },
    { key: 'material_name', title: lang == 'en' ? 'material name' : 'nama material' },
    { key: 'activity_id', title: lang == 'en' ? 'activity id' : 'id activity' },
    { key: 'activity_name', title: lang == 'en' ? 'activity name' : 'nama activity' },
    { key: 'ipv', title: lang == 'en' ? 'National IP' : 'IP nasional' },
  ]

  req.xlsFilename = lang == 'en' ? `National IP Data Master ${Date()}` : `Master Data IP Nasional ${Date()}`

  return next()
}

export async function masterTargetDistributionList(req, res, next) {
  try {
    const { keyword } = req.query
    const condition = []

    const lang = req.headers['accept-language'] || 'id'

    req.include = [{
      association: 'master_material',
      attributes: ['id', 'name', 'is_vaccine'],
    }, {
      association: 'activity',
      attributes: ['id', 'name']
    },{
      association: 'master_target',
      attributes: ['id', 'name']
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
          { '$master_material.name$': { [Op.like]: `%${keyword}%` } },
          { '$master_target.name$': { [Op.like]: `%${keyword}%` } }
        ]
      })
    }
    if(condition.length > 0) {
      req.condition = condition
    }

    let translateEn = function(lang, id, en){
      return lang == 'en' ? en : id
    }

    req.xlsColumns = [
      { key: 'master_material_id', title: translateEn(lang, 'id material', 'material id') },
      { key: 'material_name', title: translateEn(lang, 'nama material', 'material name') },
      { key: 'activity_id', title: translateEn(lang, 'id activity', 'activity id') },
      { key: 'activity_name', title: translateEn(lang, 'nama activity', 'activity name') },
      { key: 'master_target_id', title: translateEn(lang, 'id kelompok sasaran', 'target group id') },
      { key: 'master_target_name', title: translateEn(lang, 'kelompok sasaran', 'target group') },
      { key: 'qty', title: translateEn(lang, 'jumlah pemberian', 'amount of giving') },
    ]

    req.mappingDocs = ({ docs }) => docs.map((doc) => 
      mappingContents({data: doc})
    )
    req.mappingContents = mappingContents

    req.xlsFilename = translateEn(lang, `Master Data Jumlah Pemberian ${Date()}`, `Amount of Giving Data Master ${Date()}`)
    req.isFormatRelationCount = false
    return next()
  } catch(error) {
    return next(error)
  }
}

export function masterDataDistributionXlsSchema(req, res, next) {
  try {
    req.schema = joi.object({
      master_material_id: joi.number().required(),
      activity_id: joi.number().required(),
      master_target_id: joi.number().required(),
      qty: joi.number().required(),
    })
    req.dbValidation = [
      {field: 'master_material_id', model: 'MasterMaterial', attribute: 'id', is_exist: true},
      {field: 'master_target_id', model: 'MasterTarget', attribute: 'id', is_exist: true},
      {field: 'activity_id', model: 'MasterActivity', attribute: 'id', is_exist: true},
    ]
    req.insertOptions = {
      updateOnDuplicate: ['qty', 'updated_by', 'updated_at']
    }
    req.masterMaterialMapping = true
    next()
  } catch(err) {
    next(err)
  }
}

export function masterDataIPVXlsSchema(req, res, next) {
  try {
    req.schema = joi.object({
      master_material_id: joi.number().required(),
      activity_id: joi.number().required(),
      ipv: joi.number().required(),
      has_ipv: joi.number().allow(null, '').custom((value, helpers) => {
        if(value !== 1 && value !== 0) {
          return helpers.error('any.invalid')
        }
        return value
      }),
    })
    req.dbValidation = [
      {field: 'master_material_id', model: 'MasterMaterial', attribute: 'id', is_exist: true},
      {field: 'activity_id', model: 'MasterActivity', attribute: 'id', is_exist: true},
    ]
    req.insertOptions = {
      updateOnDuplicate: ['ipv', 'has_ipv', 'updated_by', 'updated_at']
    }
    req.masterMaterialMapping = true
    next()
  } catch(err) {
    next(err)
  }
}