import { Op } from 'sequelize'
import { getStockStatusLabel, RETURN_STATUS, USER_ROLE, consumedStatusASIK, returnStatusASIK, ENTITY_TAGS } from '../../helpers/constants'
import { asikWorkbook, transformDetail } from '../../helpers/xls/excelTemplate'

import models from '../../models'

const { sequelize } = models

import moment from 'moment'
import { stringify } from 'csv-stringify'

export async function list(req, res, next) {
  try {
    // list
    let {
      consumed_status, return_status,
      keyword,
      material_id, 
      start_date, end_date,
      activity_id,
      is_consumption, is_distribution,
      entity_tag_id, customer_tag_id,
      entity_id, province_id, regency_id, sub_district_id,
      batch_id, session_id,
      injection_date_from, injection_date_to,
      created_at_from, created_at_to,
      updated_at_from, updated_at_to,
      id_from, id_to,
      is_vaccine,
    } = req.query
    const customer_id = req.params.customer_id ? req.params.customer_id : req.query.customer_id

    const whereCustomerVendor = {}
    if (is_consumption) whereCustomerVendor.is_consumption = is_consumption
    else if (is_distribution) whereCustomerVendor.is_distribution = is_distribution

    let includeVendor
    if (req.needArea) {
      includeVendor = [
        { association: 'entity_tags', attributes: ['title'] },
        { association: 'province', attributes: ['name'] },
        { association: 'regency', attributes: ['name'] },
        { association: 'sub_district', attributes: ['name'] },
      ]
    } else {
      includeVendor = { association: 'entity_tags', attributes: ['title'] }
    }
    
    req.include = [
      {
        association: 'vendor',
        attributes: ['id', 'name', 'address'],
        include: includeVendor
      },
      {
        association: 'customer',
        attributes: ['id', 'name'],
        include: { association: 'entity_tags', attributes: ['title'] },
      },
      {
        association: 'activity',
        attributes: ['id', 'name']
      },
      {
        association: 'masterMaterial',
        attributes: ['id', 'name', 'pieces_per_unit', 'unit', 'is_vaccine']
      },
      {
        association: 'user_created',
        attributes: ['firstname', 'lastname'],
      },
      {
        association: 'batch',
        attributes: ['id', 'code', 'expired_date', 'production_date'],
        include: { association: 'manufacture', attributes: ['name'] },
      },
    ]

    const role = Number(req.user.role)
    const onlySelfRole = [
      USER_ROLE.OPERATOR,
      USER_ROLE.OPERATOR_COVID,
      USER_ROLE.PKC,
    ]
    if (role !== USER_ROLE.SUPERADMIN && role !== USER_ROLE.ADMIN && role !== USER_ROLE.ASIK) {
      const currentEntity = req.user.entity
      if (!province_id) province_id = currentEntity.province_id
      if (!regency_id) regency_id = currentEntity.regency_id
      if (!sub_district_id) sub_district_id = currentEntity.sub_district_id

      if (onlySelfRole.includes(role)) {
        entity_id = req.entityID
      }
    }

    const entityCondition = []
    if (province_id) entityCondition.push({ province_id })
    if (regency_id) entityCondition.push({ regency_id })
    if (sub_district_id) entityCondition.push({ sub_district_id })

    if (entityCondition.length > 0) {
      req.include[0].where = entityCondition
    }

    const condition = []
    if (start_date) condition.push({ created_at: { [Op.gte]: start_date } })
    if (end_date) condition.push({ created_at: { [Op.lte]: end_date } })
    if (customer_id) condition.push({ customer_id: customer_id })
    if (consumed_status === 'null') condition.push({ consumed_status: { [Op.is]: null } })
    else if(consumed_status) condition.push({ consumed_status: consumed_status })
    if (return_status === 'null') condition.push({ return_status: { [Op.is]: null } })
    else if(return_status) condition.push({ return_status: return_status })
    if (activity_id) condition.push({ activity_id: activity_id })
    if (material_id) condition.push({ material_id: material_id })
    if (entity_id) condition.push({ vendor_id: entity_id })
    if (batch_id) condition.push({ batch_id: batch_id })
    if (session_id) condition.push({ session_id: session_id })
    if (entity_tag_id) condition.push({ '$vendor.entity_tags.id$': entity_tag_id })
    if (customer_tag_id) condition.push({ '$customer.entity_tags.id$': customer_tag_id })
    if (keyword) condition.push({ '$masterMaterial.name$': { [Op.like]: `%${keyword}%` } })
    if (is_vaccine) condition.push({ '$masterMaterial.is_vaccine$': is_vaccine })
    if (injection_date_from) condition.push({ created_at_injection: { [Op.gte]: injection_date_from + ' 00:00:00' } })
    if (injection_date_to) condition.push({ created_at_injection: { [Op.lte]: injection_date_to + ' 23:59:59' } })
    
    if (created_at_from) condition.push({ created_at: { [Op.gte]: created_at_from + ' 00:00:00' } })
    if (created_at_to) condition.push({ created_at: { [Op.lte]: created_at_to + ' 23:59:59' } })

    if (updated_at_from) condition.push({ updated_at: { [Op.gte]: updated_at_from + ' 00:00:00' } })
    if (updated_at_to) condition.push({ updated_at: { [Op.lte]: updated_at_to + ' 23:59:59' } })

    if (id_from) condition.push({ id: { [Op.gte]: id_from } })
    if (id_to) condition.push({ id: { [Op.lte]: id_to } })
    
    if (JSON.stringify(condition) !== '{}') req.condition = condition
    req.order = [['id', 'DESC']]
    req.customOptions = { subQuery: false }
    req.mappingDocs = ({ docs }) => docs.map((ayoSehat) => {
      let {
        id, 
        vendor, customer, activity, masterMaterial, batch,
        status_vvm, consumed_qty_openvial, consumed_qty_closevial,
        created_at_consumed_smile, consumed_status,
        session_id,
        return_qty, return_qty_openvial, return_qty_closevial, injection_qty,
        created_at_injection, created_at_return_vaccination, updated_at_return_vaccination,
        return_status, return_validation,
        created_at, updated_at, user_created,
      } = ayoSehat

      consumed_qty_openvial = Math.abs(consumed_qty_openvial)
      consumed_qty_closevial = Math.abs(consumed_qty_closevial)
      return_qty = Math.abs(return_qty)
      return_qty_openvial = Math.abs(return_qty_openvial)
      return_qty_closevial = Math.abs(return_qty_closevial)
      injection_qty = Math.abs(injection_qty)

      const vendorList = { id: vendor?.id, name: vendor?.name, entity_tags: vendor?.entity_tags[0]?.title }
      const customerList = { id: customer?.id, name: customer?.name, entity_tags: customer?.entity_tags[0]?.title }
      const batchList = { id: batch?.id, code: batch?.code, expired_date: batch?.expired_date, production_date: batch?.production_date, manufacture: batch?.manufacture?.name }
      const statusVVM = getStockStatusLabel(status_vvm)

      let area
      if (req.needArea) {
        area = {province_name: vendor?.province?.name, regency_name: vendor?.regency?.name, sub_district_name: vendor?.sub_district?.name}
      }
      
      const statusConsumedStatusASIK = consumedStatusASIK(consumed_status) 
      const statusReturnStatusASIK = returnStatusASIK(return_status)

      return {
        id, 
        vendor: vendorList, customer: customerList, activity, material: masterMaterial, batch: batchList,
        status_vvm: statusVVM, consumed_qty_openvial, consumed_qty_closevial,  
        created_at_consumed_smile, consumed_status, consumed_status_name: statusConsumedStatusASIK,
        session_id,
        return_qty, return_qty_openvial, return_qty_closevial, injection_qty,
        created_at_injection, created_at_return_vaccination, updated_at_return_vaccination,
        return_status, return_status_name: statusReturnStatusASIK, return_validation,
        created_at, updated_at,
        user_created,
        ...area
      }
    })

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function acceptConsumption(req, res, next) {
  try {
    const { id } = req.params
    const sehat = await models.IntegrationAyoSehat.findByPk(id)
    if (sehat.consumed_status === 0) {
      return res.status(422).json({message: req.__('integration.already_rejected')})
    }
    
    await update(req, res, next)
    delete req.body.created_at_consumed_smile
    
    return res.status(200).json(req.body)
  } catch (err) {
    return next(err)
  }
}

export async function returnConsumption(req, res, next) {
  try {
    req.body.return_qty = req.body.return_qty_closevial
    req.body.created_at_return_vaccination = moment()
    req.body.updated_at_return_vaccination = moment()
    req.body.return_status = RETURN_STATUS.UNRECEIVED
    const { id } = req.params
    const sehat = await models.IntegrationAyoSehat.findByPk(id, { include: [{ association: 'masterMaterial' }, { association: 'customer', include: { association: 'entity_tags' }}] })
    const { pieces_per_unit, is_openvial } = sehat.masterMaterial

    req.body.created_at_injection = req.body.injection_date
    if (sehat.customer?.entity_tags[0]?.id !== ENTITY_TAGS.DALAM_GEDUNG && req.body.return_qty_openvial) {
      return res.status(422).json({message: req.__('integration.return_openvial_inside')})
    }
    if (!is_openvial && req.body.return_qty_openvial) {
      return res.status(422).json({message: req.__('integration.return_openvial_inside')})
    }

    const openVial = Number(req.body.return_qty_openvial)
    if (is_openvial && openVial && openVial >= Number(pieces_per_unit)) return res.status(422).json({message: req.__('custom.opname_not_pieces_unit', { field: 'open_vial' })})
    
    const mod = Number(req.body.return_qty_closevial) % Number(pieces_per_unit)
    if (mod !== 0) return res.status(422).json({message: req.__('custom.qty_not_pieces_unit')})
    
    if (parseFloat(req.body.return_qty_closevial) > Math.abs(sehat.consumed_qty_closevial)) {
      return res.status(422).json({message: req.__('validator.greater_than', { field1: 'return_qty_closevial', field2: 'consumed_qty_closevial' })})
    }

    await update(req, res, next)
    return res.status(200).json(req.body)
  } catch (err) {
    return next(err)
  }
}

export async function returnConsumptionAccept(req, res, next) {
  try {
    const { id } = req.params
    const sehat = await models.IntegrationAyoSehat.findByPk(id)
    if (sehat.injection_qty !== null) {
      req.body.transaction_id_injection = sehat.transaction_id_consumed
    }
    
    const data = await update(req, res, next)
    if (data.return_status === 2) {
      return res.status(200).json(req.body)
    }

    req.body.created_at_injection = req.body.injection_date
    if (data.return_qty_openvial < 1 && data.return_qty_closevial < 1) {
      return res.status(200).json(req.body)
    }
    
    delete req.body.transaction_id_injection
    return res.status(200).json(req.body)
  } catch (err) {
    return next(err)
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params
    const { model } = req

    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]

    let data = {}
    if (Model) {
      delete req.body.id
      data = await Model.findByPk(id)
      if (!data) throw { status: 404, message: req.__('404') }
      data = await data.update(req.body)
    }


    data = await Model.findByPk(data.id)

    return data
  } catch (err) {
    return next(err)
  }
}

export function setWorkbook() {
  return async function (req, res, next) {
    const lang = req.headers['accept-language'] || 'id'
    let title = 'Daftar Transaksi ASIK'
    if (lang !== 'id') title = 'Transaction List of ASIK'
    req.workbook = asikWorkbook
    req.workbookName = `${title} ${moment(new Date()).format('DD-MM-YYYY  HH.mm')}`
    req.lang = lang
    next()
  }
}

export async function exportCSVList(req, res, next) {
  try {
    console.time('time-export-asik')
    let data = await getDetail(req, res, next)
    let detail = transformDetail(data)

    const stringifier = stringify(detail, {
      delimiter: ',',
      header: true,
      columns: {
        'id': req.__('field.id.common_id'),
        'prov': req.__('field.id.province_id'),
        'kota': req.__('field.id.regency_id'),
        'kec': req.__('field.id.sub_district_id'),
        'entitas': req.__('field.id.vendor_id'),
        'pelanggan': req.__('field.id.customer_id'),
        'material': req.__('field.id.material_id'),
        'kegiatan': req.__('field.id.activity_id'),
        'batch': req.__('field.id.batch_id'),
        'produsen': req.__('field.id.manufacture_id'),
        'kadaluarsa': req.__('field.batch.expired_date'),
        'vvm': req.__('field.status.vvm'),
        'pengeluaranVialTerbuka': req.__('field.asik.consumption_open_vial'),
        'pengeluaranVialTertutup': req.__('field.asik.consumption_close_vial'),
        'statusPengeluaran': req.__('field.status.consumption_transaction'),
        'sessionID': req.__('field.id.session_id'),
        'pengembalianVialTerbuka': req.__('field.asik.return_open_vial'),
        'pengembalianVialTertutup': req.__('field.asik.return_close_vial'),
        'jumlahPenyuntikan': req.__('field.asik.injection_qty'),
        'statusPengembalian': req.__('field.status.return_transaction'),
        'dibuatPada': req.__('field.id.created_at'),
        'dibuatOleh': req.__('field.id.created_by')
      }
    })

    const fileName = `${req.workbookName.toUpperCase()}`

    res.writeHead(200, {
      'Content-Disposition': `attachment; filename="${fileName}.csv"`,
      'Access-Control-Expose-Headers': 'Filename',
      'Content-Type': 'csv',
      'Filename': `${fileName}.csv`
    })
    console.log(`Export ${detail.length} data.`)
    console.timeEnd('time-export-asik')

    return stringifier.pipe(res)
  } catch (error) {
    console.error(error)
  }
}

export async function getDetail(req, res, next) {
  try {
    let {
      consumed_status, return_status,
      keyword,
      material_id, 
      start_date, end_date,
      activity_id,
      is_consumption, is_distribution,
      entity_tag_id, customer_tag_id,
      entity_id, province_id, regency_id, sub_district_id,
      batch_id, session_id,
      injection_date_from, injection_date_to,
      created_at_from, created_at_to,
      updated_at_from, updated_at_to,
      id_from, id_to,
      is_vaccine,
    } = req.query
    const customer_id = req.params.customer_id ? req.params.customer_id : req.query.customer_id

    const whereCustomerVendor = {}
    if (is_consumption) whereCustomerVendor.is_consumption = is_consumption
    else if (is_distribution) whereCustomerVendor.is_distribution = is_distribution
    let options = {}

    options.include = [
      {
        association: 'vendor',
        attributes: ['id', 'name', 'address', 'province_id', 'regency_id', 'sub_district_id'],
        include: [
          { association: 'entity_tags', attributes: ['title'] },
          { association: 'province', attributes: ['name'] },
          { association: 'regency', attributes: ['name'] },
          { association: 'sub_district', attributes: ['name'] },
        ]
      },
      {
        association: 'customer',
        attributes: ['id', 'name'],
        include: { association: 'entity_tags', attributes: ['title'] },
      },
      {
        association: 'activity',
        attributes: ['id', 'name']
      },
      {
        association: 'masterMaterial',
        attributes: ['id', 'name', 'pieces_per_unit', 'unit', 'is_vaccine']
      },
      {
        association: 'user_created',
        attributes: ['firstname', 'lastname'],
      },
      {
        association: 'batch',
        attributes: ['id', 'code', 'expired_date', 'production_date'],
        include: { association: 'manufacture', attributes: ['name'] },
      },
    ]

    const role = Number(req.user.role)
    const onlySelfRole = [
      USER_ROLE.OPERATOR,
      USER_ROLE.OPERATOR_COVID,
      USER_ROLE.PKC,
    ]
    if (role !== USER_ROLE.SUPERADMIN && role !== USER_ROLE.ADMIN && role !== USER_ROLE.ASIK) {
      const currentEntity = req.user.entity
      if (!province_id) province_id = currentEntity.province_id
      if (!regency_id) regency_id = currentEntity.regency_id
      if (!sub_district_id) sub_district_id = currentEntity.sub_district_id

      if (onlySelfRole.includes(role)) {
        entity_id = req.entityID
      }
    }

    const entityCondition = []
    if (province_id) entityCondition.push({ province_id })
    if (regency_id) entityCondition.push({ regency_id })
    if (sub_district_id) entityCondition.push({ sub_district_id })

    if (entityCondition.length > 0) {
      options.include[0].where = entityCondition
    }

    const condition = []
    if (start_date) condition.push({ created_at: { [Op.gte]: start_date } })
    if (end_date) condition.push({ created_at: { [Op.lte]: end_date } })
    if (customer_id) condition.push({ customer_id: customer_id })
    if (consumed_status === 'null') condition.push({ consumed_status: { [Op.is]: null } })
    else if(consumed_status) condition.push({ consumed_status: consumed_status })
    if (return_status === 'null') condition.push({ return_status: { [Op.is]: null } })
    else if(return_status) condition.push({ return_status: return_status })
    if (activity_id) condition.push({ activity_id: activity_id })
    if (material_id) condition.push({ material_id: material_id })
    if (entity_id) condition.push({ vendor_id: entity_id })
    if (batch_id) condition.push({ batch_id: batch_id })
    if (session_id) condition.push({ session_id: session_id })
    if (entity_tag_id) condition.push({ '$vendor.entity_tags.id$': entity_tag_id })
    if (customer_tag_id) condition.push({ '$customer.entity_tags.id$': customer_tag_id })
    if (keyword) condition.push({ '$masterMaterial.name$': { [Op.like]: `%${keyword}%` } })
    if (is_vaccine) condition.push({ '$masterMaterial.is_vaccine$': is_vaccine })
    if (injection_date_from) condition.push({ created_at_injection: { [Op.gte]: injection_date_from + ' 00:00:00' } })
    if (injection_date_to) condition.push({ created_at_injection: { [Op.lte]: injection_date_to + ' 23:59:59' } })
    
    if (created_at_from) condition.push({ created_at: { [Op.gte]: created_at_from + ' 00:00:00' } })
    if (created_at_to) condition.push({ created_at: { [Op.lte]: created_at_to + ' 23:59:59' } })

    if (updated_at_from) condition.push({ updated_at: { [Op.gte]: updated_at_from + ' 00:00:00' } })
    if (updated_at_to) condition.push({ updated_at: { [Op.lte]: updated_at_to + ' 23:59:59' } })

    if (id_from) condition.push({ id: { [Op.gte]: id_from } })
    if (id_to) condition.push({ id: { [Op.lte]: id_to } })
    
    if (condition.length > 0) options.where = condition
    options.order = [['id', 'DESC']]
    options.subQuery = false

    const data = await models.IntegrationAyoSehat.findAll(options)
    const datas = await Promise.all(data.map( async (ayoSehat) => {
      let {
        id, 
        vendor, customer, activity, masterMaterial, batch,
        status_vvm, consumed_qty_openvial, consumed_qty_closevial,
        created_at_consumed_smile, consumed_status,
        session_id,
        return_qty, return_qty_openvial, return_qty_closevial, injection_qty,
        created_at_injection, created_at_return_vaccination, updated_at_return_vaccination,
        return_status, return_validation,
        created_at, updated_at, user_created,
      } = ayoSehat

      consumed_qty_openvial = Math.abs(consumed_qty_openvial)
      consumed_qty_closevial = Math.abs(consumed_qty_closevial)
      return_qty = Math.abs(return_qty)
      return_qty_openvial = Math.abs(return_qty_openvial)
      return_qty_closevial = Math.abs(return_qty_closevial)
      injection_qty = Math.abs(injection_qty)

      const vendorList = { id: vendor?.id, name: vendor?.name, entity_tags: vendor?.entity_tags[0]?.title }
      const customerList = { id: customer?.id, name: customer?.name, entity_tags: customer?.entity_tags[0]?.title }
      const batchList = { id: batch?.id, code: batch?.code, expired_date: batch?.expired_date, production_date: batch?.production_date, manufacture: batch?.manufacture?.name }
      const statusVVM = getStockStatusLabel(status_vvm)

      let area = {province_name: vendor?.province?.name, regency_name: vendor?.regency?.name, sub_district_name: vendor?.sub_district?.name}
      
      const statusConsumedStatusASIK = consumedStatusASIK(consumed_status) 
      const statusReturnStatusASIK = returnStatusASIK(return_status)

      return {
        id, 
        vendor: vendorList, customer: customerList, activity, material: masterMaterial, batch: batchList,
        status_vvm: statusVVM, consumed_qty_openvial, consumed_qty_closevial,  
        created_at_consumed_smile, consumed_status, consumed_status_name: statusConsumedStatusASIK,
        session_id,
        return_qty, return_qty_openvial, return_qty_closevial, injection_qty,
        created_at_injection, created_at_return_vaccination, updated_at_return_vaccination,
        return_status, return_status_name: statusReturnStatusASIK, return_validation,
        created_at, updated_at,
        user_created,
        ...area
      }
    }))

    return datas
  } catch (err) {
    console.error(err)
  }
}
