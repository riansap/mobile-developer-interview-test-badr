import models from '../../../models'

import {
  DEVICE_TYPE,
  USER_ROLE,
} from '../../../helpers/constants'
import listResponse from '../../../helpers/listResponse'
import { exportExcel as transactionXLS } from './transactionXLSOptimizeController'
import { getTransactionsData } from './transactionController'
import moment from 'moment'

export async function filter(req, res, next) {
  try {
    let {
      keyword,
      material_id,
      material_ids,
      transaction_type_id,
      start_date,
      end_date,
      vendor_id,
      activity_id,
      transaction_reason_id,
      customer_id,
      is_consumption,
      is_distribution,
      is_order,
      order_type,
      entity_tag_id,
      customer_tag_id,
      is_vaccine,
      start_deleted_date,
      end_deleted_date,
      page,
      paginate
    } = req.query

    start_date = start_date ?? '2000-01-01'
    end_date = end_date ?? moment(new Date()).format('YYYY-MM-DD HH:mm:ss')

    let {
      entity_id,
      province_id,
      regency_id,
      sub_district_id,
    } = req.query

    const {
      is_deleted
    } = req

    const role = Number(req.user.role)
    const onlySelfRole = [
      USER_ROLE.OPERATOR,
      USER_ROLE.OPERATOR_COVID,
      USER_ROLE.PKC,
    ]
    const deviceType = req.headers['device-type'] ? DEVICE_TYPE[req.headers['device-type']] : DEVICE_TYPE.web
    if (role !== USER_ROLE.SUPERADMIN && role !== USER_ROLE.ADMIN) {
      const currentEntity = req.user.entity
      if (!province_id) province_id = currentEntity.province_id
      if (!regency_id) regency_id = currentEntity.regency_id
      if (!sub_district_id) sub_district_id = currentEntity.sub_district_id

      if (onlySelfRole.includes(role) || deviceType === DEVICE_TYPE.mobile) {
        entity_id = req.entityID
      }
      if (role === USER_ROLE.PKC) {
        entity_id = req.query.entity_id
      }
    }

    const condition = {
      keyword,
      material_id,
      material_ids,
      transaction_type_id,
      start_date,
      end_date,
      vendor_id,
      activity_id,
      transaction_reason_id,
      customer_id,
      is_consumption,
      is_distribution,
      is_order,
      order_type,
      entity_tag_id,
      customer_tag_id,
      is_vaccine,
      start_deleted_date,
      end_deleted_date,
      page,
      paginate,
      is_deleted,
      entity_id
    }

    console.log(condition)

    req.queryParam = condition

    req.order = [['id', 'desc']]
    req.customOptions = { subQuery: false }

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function customList(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query
    let checkParam = 0
    for (var key in req.query) {
      if (key !== 'page' && key !== 'paginate' && key !== 'size' && key !== 'lang') {
        if (req.query[key] !== '') {
          checkParam++
        }
      }
    }
    if (checkParam === 0) {
      throw { status: 204, message: req.__('204') }
    }
    const {
      queryParam = {}
    } = req

    let docs = []
    let total = 10

    docs = await getTransactionsData(queryParam)
    const count = await getTransactionsData(queryParam, true)
    total = count[0].total

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    const virtual = models.Transaction.getVirtualAttribute()
    docs = docs.map(data => {
      let newData = {
        ...data.dataValues,
      }
      virtual.forEach(v => newData[v] = data[v])
      data.material = data.master_material
      delete data.master_material
      return data
    })

    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (err) {
    return next(err)
  }
}

export const exportExcel = transactionXLS