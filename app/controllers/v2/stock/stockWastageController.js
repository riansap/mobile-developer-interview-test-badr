import models from '../../../models'
import { Sequelize, Op } from 'sequelize'
import { ENTITY_TYPE, USER_ROLE } from '../../../helpers/constants'
import { formatRelationsCount, onlyUnique, formatWIB } from '../../../helpers/common'
import listResponse from '../../../helpers/listResponse'
import moment from 'moment'
import Excel from 'exceljs'

export async function filter(req, res, next) {
  try {
    let {
      entity_id, province_id, regency_id, activity_id, material_id,
      keyword, expired_from, expired_to,
      no_batch, batch_ids, stock_activity_id, flow_id,
      sub_district_id, entity_tag_id, only_have_qty, is_vaccine,
    } = req.query

    let transactionReasonIds = []
    if (flow_id) {
      let flow = await models.ExterminationFlowReason.findAll({ where: { flow_id: flow_id } })
      transactionReasonIds = flow.map(el => {
        return el.transaction_reason_id
      })
    }

    let andCondition = [], materialCondition = [], entityCondition = [], entityTagCondition = [], batchConditon = []

    let materialId = []
    if (activity_id) {
      let activityMaterial = await models.MasterActivity.findByPk(activity_id, {
        include: {
          association: 'materials',
          attributes: ['id']
        }
      })
      if (!activityMaterial) {
        return res.status(204).json({})
      }
      activityMaterial.materials.forEach(material => {
        materialId.push(material.id)
      })
    }
    if (materialId.length > 0) materialCondition.push({ id: { [Op.in]: materialId } })

    if (req.user.role === USER_ROLE.OPERATOR || req.user.role === USER_ROLE.OPERATOR_COVID) {
      entity_id = req.user.entity_id
    }
    if (entity_id) andCondition.push({ entity_id })
    if (material_id) andCondition.push({ master_material_id: material_id })
    if (only_have_qty && only_have_qty == 1) andCondition.push({ [Op.or]: [{ extermination_discard_qty: { [Op.gt]: 0 } }, { extermination_received_qty: { [Op.gt]: 0 } }] })

    if (keyword) materialCondition.push({ name: { [Op.like]: `%${keyword}%` } })
    if (is_vaccine !== null && is_vaccine !== undefined && is_vaccine !== '') materialCondition.push({ is_vaccine })

    if (req.user.role === USER_ROLE.MANAGER || req.user.role === USER_ROLE.MANAGER_COVID) {
      if (req.user.entity.type === ENTITY_TYPE.PROVINSI) province_id = req.user.entity.province_id
      else if (req.user.entity.type === ENTITY_TYPE.KOTA) {
        province_id = req.user.entity.province_id
        regency_id = req.user.entity.regency_id
      }
    }
    if (province_id) entityCondition.push({ province_id })
    if (regency_id) entityCondition.push({ regency_id })
    if (sub_district_id) entityCondition.push({ sub_district_id })

    if (entity_tag_id) entityTagCondition.push({ id: entity_tag_id })

    if (expired_from && expired_to) {
      if (moment(expired_from) > moment(expired_to)) return res.status(400).json({ error: 'Invalid expired_from > expired_to' })
      batchConditon.push({
        expired_date: {
          [Op.between]: [
            `${expired_from} 00:00:00`,
            `${expired_to} 23:59:59`,
          ],
        },
      })
    }
    if (no_batch) batchConditon.push({ code: { [Op.like]: `%${no_batch}%` } })
    if (batch_ids) batchConditon.push({ id: { [Op.in]: batch_ids.split(',') } })

    let batchOptions = {}, entityTagOptions = {}, entityOptions = {}, materialOptions = {}, stockOptions = {}, exterminationOptions = {},
      isRequiredStock = false

    exterminationOptions = {
      where: {
        [Op.or]: {
          extermination_discard_qty: { [Op.gt]: 0 },
          extermination_received_qty: { [Op.gt]: 0 }
        }
      }
    }

    if (batchConditon.length > 0) {
      batchOptions = { where: batchConditon, required: true }
      isRequiredStock = true
    }
    if (entityTagCondition.length > 0) entityTagOptions = { where: entityTagCondition, required: true }
    if (entityCondition.length > 0) entityOptions = { where: entityCondition }
    if (materialCondition.length > 0) materialOptions = { where: materialCondition, required: true }
    if (stock_activity_id) {
      stockOptions = { where: { ...stockOptions.where, activity_id: stock_activity_id } }
      isRequiredStock = true
    }
    if (transactionReasonIds.length > 0) {
      exterminationOptions = { where: { ...exterminationOptions.where, transaction_reason_id: { [Op.in]: transactionReasonIds } } }
      isRequiredStock = true
    }

    req.include = [
      {
        association: 'material',
        attributes: models.MasterMaterial.getBasicAttribute(),
        ...materialOptions,
        required: true,
      },
      {
        association: 'entity',
        attributes: models.Entity.getBasicAttribute(),
        include: [
          { association: 'province', attributes: ['id', 'name'] },
          { association: 'regency', attributes: ['id', 'name'] },
          { association : 'sub_district', attributes: ['id', 'name']},
          { association: 'entity_tags', attributes: ['id'], ...entityTagOptions },
        ],
        ...entityOptions,
        required: true,
      },
      {
        association: 'stocks',
        attributes: [...models.Stock.getWastageAttributes()],
        ...stockOptions,
        include: [
          {
            association: 'batch',
            attributes: models.Batch.getBasicAttribute(),
            include: { association: 'manufacture', attributes: ['name', 'address'] },
            ...batchOptions,
          },
          {
            association: 'stock_exterminations',
            attributes: models.StockExtermination.getBasicAttributes(),
            include: {
              association: 'transaction_reason',
            },
            ...exterminationOptions
          },
          {
            association: 'activity',
            attributes: models.MasterActivity.getBasicAttribute(),
            paranoid : false
          },
        ],
        required: isRequiredStock,
        separate: isRequiredStock ? false : true,
      },
    ]

    req.condition = andCondition

    req.order = [[{ model: models.MasterMaterial, as: 'material' }, 'name', 'ASC']]

    req.customOptions = {
      distinct: 'EntityMasterMaterial.id',
      subQuery: false,
    }

    req.attributes = models.EntityMasterMaterial.getWastageAttributes()

    return next()
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

export async function customList(req, res, next) {
  try {
    const lang = req.headers['accept-language'] || 'id'
    const { page = 1, paginate = 10 } = req.query
    const {
      condition = {},
      attributes,
      order,
      include,
      customOptions,
    } = req

    const options = {
      order,
      attributes,
      limit: Number(paginate),
      offset: (page - 1) * Number(paginate),
      where: condition,
      duplicating: false,
      ...customOptions,
    }
    if (include && typeof include === 'object') options.include = include
    let docs = []
    let total = 10

    docs = await models.EntityMasterMaterial.findAll(options)
    const countOptions = {
      ...options,
      attributes: [],
      having: [],
      include: formatRelationsCount(options.include, condition),
    }
    total = await models.EntityMasterMaterial.count({ ...countOptions, subQuery: false })

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    let materialIds = docs.map(item => item.material_id).filter(onlyUnique)
    let materialCompanions = await models.MasterMaterialCompanion.findAll({
      where: { master_material_id: { [Op.in]: materialIds } },
      include: { association: 'material_companion', attributes: ['id', 'name', 'code', 'description'] },
    })

    docs = docs.map(data => {
      let materialCompanion = materialCompanions.filter(item => item.master_material_id === data.material_id)
      materialCompanion = materialCompanion.map(obj => {
        return obj.material_companion.dataValues
      })
      let materialDiscardQty = 0, materialReceivedQty = 0
      data.stocks = data.stocks?.map(stock => {
        let stockDiscardQty = 0, stockReceivedQty = 0
        stock.stock_exterminations?.map(extermination => {
          let title = extermination.transaction_reason.title?.trim()
          extermination.transaction_reason.title = lang == 'en' ? req.__(`field.transaction_reason.list.${title}`) : title

          stockDiscardQty += extermination.extermination_discard_qty
          stockReceivedQty += extermination.extermination_received_qty

          return extermination
        })
        stock.extermination_discard_qty = stockDiscardQty
        stock.extermination_received_qty = stockReceivedQty

        materialDiscardQty += stock.extermination_discard_qty
        materialReceivedQty += stock.extermination_received_qty

        return stock
      })
      data.dataValues.extermination_discard_qty = materialDiscardQty
      data.dataValues.extermination_received_qty = materialReceivedQty
      data.dataValues.material.dataValues.material_companion = materialCompanion ?? []

      return data
    })

    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (err) {
    return next(err)
  }
}


function setWorkbook(req){
  const workbook = new Excel.Workbook()
  const viewsOptions = [
    {
      x: 0, y: 0, width: 10000, height: 20000,
      firstSheet: 0, activeTab: 1, visibility: 'visible'
    }
  ]

  let lang = req.headers['accept-language'] || 'id'

  let xlsColumns = [
    { key: 'entity_name', title: lang == 'en' ? 'Entity Name' : 'Nama Entitas' },
    { key: 'province', title: lang == 'en' ? 'Province' :  'Provinsi' },
    { key: 'city', title: lang == 'en' ? 'City/District' : 'Kab/Kota' },
    { key: 'sub_district', title: lang == 'en' ? 'Sub District' : 'Kecamatan' },
    { key: 'entity_type', title: lang == 'en' ? 'Entity Type' : 'Tipe Entitas' },
    { key: 'material', title: lang == 'en' ? 'Material Name' : 'Nama Material' },
    { key: 'batch_code', title: lang == 'en' ? 'Batch Number' : 'Nomor Batch' },
    { key: 'expired_date', title: lang == 'en' ? 'Expired Date' : 'Tanggal Kadaluwarsa' },
    { key: 'activity', title: lang == 'en' ? 'Activity' : 'Kegiatan' },
    { key: 'reason', title: lang == 'en' ? 'Reason' : 'Alasan' },
    { key: 'discard_qty', title: lang == 'en' ? 'Discarded Stock' : 'Stok dari Pembuangan' },
    { key: 'received_qty', title: lang == 'en' ? 'Received Stock' : 'Stok dari Penerimaan' },
  ]

  workbook.creator = 'SMILE'
  workbook.views = viewsOptions

  const worksheet = workbook.addWorksheet('Stock', {
    properties: { tabColor: { argb: 'FFC0000' } },
    headerFooter: { firstHeader: 'Stock', firstFooter: 'Stock' }
  })

  const keyColumn = xlsColumns.map(item => { return { key: item.key } })
  worksheet.columns = keyColumn

  const titleColumns = xlsColumns.map(item => {
    if (item.title) return item.title
    return item.key
  })

  worksheet.addRow(titleColumns)

  let docs = req.docs ? req.docs : []

 

  for(let data of docs){
    let item = {
      entity_name : data?.entity?.name || '',
      province : data?.entity?.province?.name || '',
      city : data?.entity?.regency?.name || '',
      sub_district : data?.entity?.sub_district?.name || '',
      entity_type : data?.entity?.type_label || '',
      material : data?.material?.name || '',
      batch_code : '',
      expired_date : '',
      activity : '',
      reason : '',
      discard_qty : 0,
      received_qty : 0
    }

    if(data.stocks.length>0){
      for(let stock of data.stocks){
        item.batch_code = stock?.batch?.code || ''
        item.expired_date = stock?.batch?.expired_date ? formatWIB(stock?.batch?.expired_date, 'YYYY-MM-DD HH:mm') : ''
        item.activity = stock?.activity?.name || ''

        if(stock.stock_exterminations.length>0){
          for(let exter of stock.stock_exterminations){
            item.reason = exter?.transaction_reason?.title || ''
            item.discard_qty = exter?.extermination_discard_qty || 0
            item.received_qty = exter?.extermination_received_qty || 0
            worksheet.addRow({...item})
          }
        }else{
          worksheet.addRow({...item})
        }
      }
    }else{
      worksheet.addRow({...item})
    }
  }

  return workbook

}


export async function formatXLS(req, res, next) {

  try {

    let lang = req.headers['accept-language'] || 'id'

    const {
      condition = {},
      attributes,
      order,
      include,
      customOptions,
    } = req

    const options = {
      order,
      attributes,
      where: condition,
      duplicating: false,
      ...customOptions,
    }
    if (include && typeof include === 'object') options.include = include
    let docs = []
    let total = 10

    docs = await models.EntityMasterMaterial.findAll(options)
    const countOptions = {
      ...options,
      attributes: [],
      having: [],
      include: formatRelationsCount(options.include, condition),
    }
    total = await models.EntityMasterMaterial.count({ ...countOptions, subQuery: false })

    //if (Array.isArray(docs) && docs.length <= 0) {
    //  throw { status: 204, message: req.__('204') }
    //}

    let materialIds = docs.map(item => item.material_id).filter(onlyUnique)
    let materialCompanions = await models.MasterMaterialCompanion.findAll({
      where: { master_material_id: { [Op.in]: materialIds } },
      include: { association: 'material_companion', attributes: ['id', 'name', 'code', 'description'] },
    })

    docs = docs.map(data => {
      let materialCompanion = materialCompanions.filter(item => item.master_material_id === data.material_id)
      materialCompanion = materialCompanion.map(obj => {
        return obj.material_companion.dataValues
      })
      data.stocks = data.stocks?.map(stock => {
        let stockDiscardQty = 0, stockReceivedQty = 0
        stock.stock_exterminations?.map(extermination => {
          let title = extermination.transaction_reason.title?.trim()
          extermination.transaction_reason.title = lang == 'en' ? req.__(`field.transaction_reason.list.${title}`) : title

          stockDiscardQty += extermination.extermination_discard_qty
          stockReceivedQty += extermination.extermination_received_qty

          return extermination
        })
        stock.extermination_discard_qty = stockDiscardQty
        stock.extermination_received_qty = stockReceivedQty

        return stock
      })
      data.dataValues.material.dataValues.material_companion = materialCompanion ?? []

      return data
    })

    const currentDate = new Date()
    req.xlsFilename = lang == 'en' ? `Disposal Stock ${currentDate}` :  `Stock Pemusnahan ${currentDate}`
    req.docs = docs
    req.workbook = setWorkbook
    next()
  } catch (err) {
    return next(err)
  }
}