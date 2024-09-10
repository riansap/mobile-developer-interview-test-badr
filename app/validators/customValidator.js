import moment from 'moment'
import { check } from 'express-validator'
import models from '../models'
import {
  EXTERMINATION_ORDER_TYPE,
  ORDER_STATUS, ORDER_TYPE, STATUS, USER_ROLE,
} from '../helpers/constants'
import { Op } from 'sequelize'

const { User } = models

export function checkPassword(password, { req }) {
  const reg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  if (password.length < 8 || !reg.test(password)) {
    throw Error(req.__('validator.password', { field: req.__('field.user.password') }))
  }

  return true
}

export function checkPasswordConfirm(passwordConfirmation, { req }) {
  if (passwordConfirmation !== req.body.password) {
    throw Error(req.__('validator.same_value', { field: req.__('field.user.password_konfirm') }))
  }

  return true
}

export function duplicateArrayValidator(field = '') {
  return function (value, { req }) {
    if (value && Array.isArray(value)) {
      for (let item of value) {
        let selected = value.filter(it => it == item)
        if (selected.length > 1) {
          throw Error(req.__('validator.duplicated', { field: req.__(`field.id.${field}`) }))
        }
      }

    }
    return true
  }
}

export async function emailNotExist(email, { req }) {
  const user = await User.findOne({
    where: {
      email,
    },
  })

  if (user) {
    throw Error(req.__('validator.exist', { field: req.__('field.user.email') }))
  }

  return true
}

export function commonNotExistsId(model = '', field = '') {
  let Model = null
  if (typeof model === 'string') Model = models[model]
  else if (typeof model === 'function') Model = model
  return async function (id, { req }) {
    if (id === 0) throw Error(req.__('validator.not_exist', { field: req.__(`field.${field}`) }))

    if (id) {
      const data = await Model.findByPk(id)
      if (!data) throw Error(req.__('validator.not_exist', { field: req.__(`field.${field}`) }))
    }

    return true
  }
}

export function commonExistsTwoFieldUpdate(model = '', field1 = '', field2 = '') {
  let Model = null
  if (typeof model == 'string') Model = models[model]
  else if (typeof model == 'function') Model = model
  return async function (value, { req }) {
    if (value == 0) throw Error(req.__('validator.not_exist', { field: req.__(`field.id.${field1}`) }))

    if (value) {
      const data = await Model.findOne({
        where: { [field1]: value, [field2]: req.body[field2] }
      })
      if (data)
        if (data.id != req.params.id) throw Error(req.__(`field.id.${field1}`) + ' & ' + req.__('validator.exist', { field: req.__(`field.id.${field2}`) }))
    }

    return true
  }
}

export function commonExistsTwoField(model = '', field1 = '', field2 = '', options = {}) {
  const { isUpdate = false } = options
  let Model = null
  if (typeof model == 'string') Model = models[model]
  else if (typeof model == 'function') Model = model
  return async function (value, { req }) {
    let field1Arr = !!field1 === true ? field1.split('.') : []
    field1Arr = field1Arr[field1Arr.length - 1]
    let field2Arr = !!field2 === true ? field2.split('.') : []
    field2Arr = field2Arr[field2Arr.length - 1]

    if (value) {
      const condition = { [field1Arr]: value, [field2Arr]: req.body[field2Arr] }
      if (isUpdate) {
        condition['id'] = {
          [Op.ne]: req.params.id,
        }
      }
      const data = await Model.findOne({
        where: condition
      })
      

      if (data && data.id !== req?.params?.id) {
        throw Error(req.__(field1) + ' & ' + req.__('validator.exist', { field: req.__(field2) }))
      }
    }
  }
}

export function commonNotActiveId(model = '', field = '') {
  let Model = null
  if (typeof model === 'string') Model = models[model]
  else if (typeof model === 'function') Model = model
  return async function (id, { req }) {
    if (id !== null) {
      const data = await Model.findByPk(id)
      if (!data) throw Error(req.__('validator.not_exist', { field: req.__(`field.${field}`) }))
      if (data.status !== STATUS.ACTIVE) throw Error(req.__('validator.not_active', { field: req.__(`field.${field}`) }))
    }

    return true
  }
}

export function commonExistsId(model = '', field = '') {
  let Model = null
  if (typeof model === 'string') Model = models[model]
  else if (typeof model === 'function') Model = model
  return async function (id, { req }) {
    const data = await Model.findByPk(id)
    if (data) throw Error(req.__('validator.exist', { field: req.__(`field.${field}`) }))

    return true
  }
}

export function commonNotGreaterThan(key, field1, field2) {
  return async function (value, { req }) {
    let value2 = req.body[key]
    if (Number(value) < Number(value2)) {
      throw Error(req.__('validator.greater_than', { field1: req.__(`field.${field1}`), field2: req.__(`field.${field2}`) }))
    }
    return true
  }
}

export function commonNotExistsField(model, fieldCondition = '', field = '') {
  let Model = null
  if (typeof model === 'string') Model = models[model]
  else if (typeof model === 'function') Model = model
  return async function (value, { req }) {
    if (value) {
      const data = await Model.findOne({
        where: { [fieldCondition]: value },
      })
      if (!data) throw Error(req.__('validator.not_exist', { field: req.__(`field.${field}`) }))
    }
    return true
  }
}

export function commonExistsField(model, fieldCondition = '', field = '') {
  let Model = null
  if (typeof model === 'string') Model = models[model]
  else if (typeof model === 'function') Model = model
  return async function (value, { req }) {
    if (value) {
      const data = await Model.findOne({
        where: { [fieldCondition]: value },
      })
      if (data) throw Error(req.__('validator.exist', { field: req.__(`field.${field}`) }))
    }

    return true
  }
}

export function commonNotExistsFieldUpdate(model, fieldCondition = '', field = '') {
  let Model = null
  if (typeof model === 'string') Model = models[model]
  else if (typeof model === 'function') Model = model
  return async function (value, { req }) {
    const { id } = req.params
    if (id) {
      const prev = await Model.findByPk(id)
      if (prev && prev[fieldCondition] !== value) {
        const data = await Model.findOne({
          where: { [fieldCondition]: value },
        })
        if (!data) throw Error(req.__('validator.not_exist', { field: req.__(`field.${field}`) }))
      }
    }

    return true
  }
}

export function commonExistsFieldUpdate(model, fieldCondition = '', field = '') {
  let Model = null
  if (typeof model === 'string') Model = models[model]
  else if (typeof model === 'function') Model = model
  return async function (value, { req }) {
    const { id } = req.params
    if (id) {
      const prev = await Model.findByPk(id)
      if (prev && prev[fieldCondition] !== value) {
        const data = await Model.findOne({
          where: { [fieldCondition]: value },
        })
        if (data) throw Error(req.__('validator.exist', { field: req.__(`field.${field}`) }))
      }
    }

    return true
  }
}

export function commonDateMustGreaterThan(field1, field2 = '', option = {}) {
  const {
    isCurrentDate = false, isParams = false, isQuery = false, isBody = true,
  } = option
  return function (value, { req }) {
    if (check(value).isDate()) {
      const date1 = new Date(value)
      const field2Arr = !!field2 === true ? field2.split('.') : []
      let date2 = null
      if (isCurrentDate) {
        date2 = moment(new Date()).format('YYYY-MM-DD')
        field2 = 'current_date'
      } else if (isParams) {
        date2 = new Date(req.params[field2Arr[field2Arr.length - 1]])
      } else if (isQuery) {
        date2 = new Date(req.query[field2Arr[field2Arr.length - 1]])
      } else if (isBody) {
        date2 = new Date(req.body[field2Arr[field2Arr.length - 1]])
      }

      const differ = moment(date1).diff(date2, 'seconds')
      if (differ <= 0) {
        throw Error(req.__('validator.greater_than', {
          field1: req.__(field1),
          field2: req.__(field2),
        }))
      }
    }

    return true
  }
}

export function commonQueryFields(fields = [], field = '') {
  return function (value, { req }) {
    if (!fields.includes(value)) throw req.__('validator.not_exist', { field: req.__(field) })
    return true
  }
}

export function commonInvalidValue(fields = [], field = '') {
  return function (value, { req }) {
    if (!fields.includes(value)) {
      throw Error(req.__('validator.one_of', {
        field: req.__(`${field}`),
        condition: `[${fields}]`,
      }))
    }

    return true
  }
}

export function constantNotExist(constant = '', field = '') {
  return async function (value, { req }) {
    const objVal = Object.values(constant)
    if (objVal.indexOf(Number(value)) === -1) {
      throw Error(req.__('validator.not_exist', { field: req.__(`${field}`) }))
    }

    return true
  }
}

export function orderTypeNotExists(value, { req }) {
  const types = Object.keys(ORDER_TYPE).map((key) => ORDER_TYPE[key])
  if (value && !types.includes(Number(value))) {
    throw Error(req.__('validator.not_exist', { field: req.__('field.order.type') }))
  }

  return true
}

export function exterminationOrderTypeNotExists(value, { req }) {
  const types = Object.keys(EXTERMINATION_ORDER_TYPE).map((key) => EXTERMINATION_ORDER_TYPE[key])
  if (value && !types.includes(Number(value))) {
    throw Error(req.__('validator.not_exist', { field: req.__('field.order.type') }))
  }

  return true
}

export async function orderMaterialEntityNoExists(value, { req }) {
  const { vendor_id } = req.body
  if (value && vendor_id) {
    const materialEntity = await models.MaterialEntity.findOne({
      where: { material_id: value, entity_id: vendor_id },
    })
    if (!materialEntity) throw Error(req.__('custom.material_not_exist_vendor'))
  }

  return true
}

export async function orderCovidMaterialEntityNoExists(value, { req }) {
  if (value) {
    let vendor_id
    if (req.user.role === USER_ROLE.SUPERADMIN) {
      const vendor = await models.Entity.findOne({ where: { code: req.body.vendor_code } })
      vendor_id = vendor.id
    } else {
      vendor_id = req.user.entity_id
    }
    const material = await models.Material.findOne({ where: { code: value } })
    if (!material) throw Error(req.__('validator.not_exist', { field: req.__('field.order_covid.material_code') }))
    const materialEntity = await models.MaterialEntity.findOne({
      where: { material_id: material.id, entity_id: vendor_id },
    })
    if (!materialEntity) throw Error(req.__('validator.not_exist', { field: req.__('field.id.material_entity_id') }))
  }

  return true
}

export async function orderCovidManufactureNameNoExists(values, { req }) {
  if (values && Array.isArray(values)) {
    for (let q = 0; q < values.length; q++) {
      const { batches } = values[q]
      if (batches && Array.isArray(batches)) {
        for (let i = 0; i < batches.length; i++) {
          const { manufacture_name } = batches[i]
          if (manufacture_name) {
            const manufacture = await models.Manufacture.findOne({
              where: { name: manufacture_name },
            })
            if (!manufacture) throw Error(req.__('validator.not_exist', { field: req.__('field.order_covid.manufacture_name') }))
          }
        }
      }
    }
  }

  return true
}

export async function orderCovidVendorHasVendor(value, { req }) {
  req.hasVendor = false // for validate stock if vendor has vendor
  const { entity_id } = req.user
  if (entity_id) {
    const vendor = await models.Entity.findByPk(entity_id)
    if (vendor) {
      const vendors = await vendor.getVendors()
      if (vendors.length > 0) req.hasVendor = true
    }
  }

  return true
}

export async function orderCovidCheckStockNonBatches(value, { req }) {
  const { entity_id } = req.user
  let hasVendor = false
  if (entity_id) {
    const vendor = await models.Entity.findByPk(entity_id)
    if (vendor) {
      const vendors = await vendor.getVendors()
      if (vendors.length > 0) hasVendor = true
    }
  }
  if (value && hasVendor) {
    const material = await models.Material.findOne({
      where: { code: value },
    })
    const { order_items: orderItems } = req.body
    const orderItem = orderItems.find((item) => item.material_code === value)
    if (orderItem && orderItem.qty) {
      const { qty } = orderItem
      const vendorMaterialEntity = await models.MaterialEntity.findOne({
        where: { material_id: material.id, entity_id },
      })
      if (!vendorMaterialEntity) {
        throw Error(req.__('validator.not_empty', {
          field: req.__('field.id.material_entity_id'),
        }))
      }
      const vendorStock = await models.Stock.findOne({
        where: { batch_id: null, material_entity_id: vendorMaterialEntity.id },
      })
      if (!vendorStock) {
        throw Error(req.__('validator.not_empty', {
          field: req.__('field.id.stock_id'),
        }))
      }
      if (Number(vendorStock.qty) < qty) {
        throw Error(req.__('validator.greater_than', {
          field1: `Vendor ${req.__('field.id.stock_id')}`,
          field2: req.__('field.order.ordered_qty'),
        }))
      }

      if (Number(vendorStock.qty) <= 0) {
        throw Error(req.__('validator.greater_than', {
          field1: `Vendor ${req.__('field.id.stock_id')}`,
          field2: '0',
        }))
      }
    }
  }
  return true
}

export async function orderCovidCheckStockBatches(value, { req }) { // if vendor has vendor
  const { order_items: orderItems } = req.body
  const { entity_id } = req.user
  let hasVendor = false
  if (entity_id) {
    const vendor = await models.Entity.findByPk(entity_id)
    if (vendor) {
      const vendors = await vendor.getVendors()
      if (vendors.length > 0) hasVendor = true
    }
  }

  const checkItems = []
  if (Array.isArray(orderItems)) {
    orderItems.forEach((item, index) => {
      const { batches, material_code } = item
      if (Array.isArray(batches)) {
        batches.forEach((batch) => {
          if (!checkItems[index]) {
            checkItems[index] = {
              material_code, batches: [], quantities: [], manufactures: [],
            }
          }
          checkItems[index].batches.push(batch.code)
          checkItems[index].quantities.push(batch.qty)
          checkItems[index].manufactures.push(batch.manufacture_name)
        })
      }
    })
  }
  if (value && hasVendor) {
    let materialCode = ''
    let qty = 0
    let manufactureName = ''

    if (Array.isArray(checkItems)) {
      checkItems.forEach((item) => {
        const { batches, quantities, manufactures } = item
        const batchIndex = batches.indexOf(value)
        if (batchIndex !== -1) {
          materialCode = item.material_code
          qty = quantities[batchIndex]
          manufactureName = manufactures[batchIndex]
        }
      })
    }
    const manufacture = await models.Manufacture.findOne({
      where: { name: manufactureName },
    })
    if (!manufacture) {
      throw Error(req.__('validator.not_empty', {
        field: req.__('field.order_covid.manufacture_name'),
      }))
    }
    const batch = await models.Batch.findOne({
      where: { code: value, manufacture_id: manufacture.id },
    })
    if (!batch) {
      throw Error(req.__('validator.not_empty', {
        field: req.__('field.id.batch_id'),
      }))
    }

    const material = await models.Material.findOne({
      where: { code: materialCode },
    })
    if (!material) {
      throw Error(req.__('validator.not_empty', {
        field: req.__('field.id.material_id'),
      }))
    }
    const vendorMaterialEntity = await models.MaterialEntity.findOne({
      where: { material_id: material.id, entity_id },
    })
    if (!vendorMaterialEntity) {
      throw Error(req.__('validator.not_empty', {
        field: req.__('field.id.material_entity_id'),
      }))
    }
    const vendorStock = await models.Stock.findOne({
      where: { batch_id: batch.id, material_entity_id: vendorMaterialEntity.id },
    })
    if (!vendorStock) {
      throw Error(req.__('validator.not_empty', {
        field: req.__('field.id.stock_id'),
      }))
    }
    // ordered_qty
    if (Number(vendorStock.qty) < qty) {
      throw Error(req.__('validator.greater_than', {
        field1: `Vendor ${req.__('field.id.stock_id')}`,
        field2: req.__('field.order.ordered_qty'),
      }))
    }

    if (Number(vendorStock.qty) <= 0) {
      throw Error(req.__('validator.greater_than', {
        field1: `Vendor ${req.__('field.id.stock_id')}`,
        field2: '0',
      }))
    }
  }

  return true
}

export function commonNotExistsIdByCondition(model = '', field = '', condition = {}) {
  let Model = null
  if (typeof model === 'string') Model = models[model]
  else if (typeof model === 'function') Model = model
  return async function (id, { req }) {
    const data = await Model.findByPk(id, { where: condition })
    if (!data) throw Error(req.__('validator.not_exist', { field: req.__(`field.${field}`) }))

    return true
  }
}

export async function orderOrderedQtyWrongFormat(values, { req }) {
  if (values && Array.isArray(values)) {
    await Promise.all(values.forEach(async (value) => {
      const { ordered_qty } = value
      if (!check(String(ordered_qty)).isNumeric()) throw Error(req.__('validator.number', { field: req.__('field.order.ordered_qty') }))
    }))
  }

  return true
}

export async function orderOrderedQtyWrongPieces(value, { req }) {
  const { order_items: orderItems } = req.body
  const order = orderItems.find((item) => Number(item.material_id) === Number(value))
  if (value && order) {
    const material = await models.Material.findByPk(value)
    if (material) {
      const { pieces_per_unit } = material
      const mod = Number(order.ordered_qty) % Number(pieces_per_unit)
      if (mod !== 0) throw Error(req.__('custom.qty_not_pieces_unit'))
    }
  }

  return true
}

export async function orderOrderedQtyWrongPiecesUpdate(value, { req }) {
  const { order_items: orderItems } = req.body
  const order = orderItems.find((item) => Number(item.id) === Number(value))
  const sourceOrder = await models.OrderItem.findByPk(value)
  if (value && order && sourceOrder) {
    const { material_id } = sourceOrder
    const material = await models.Material.findByPk(material_id)
    if (material) {
      const { pieces_per_unit } = material
      const mod = Number(order.ordered_qty) % Number(pieces_per_unit)
      if (mod !== 0) throw Error(req.__('custom.qty_not_pieces_unit'))
    }
  }

  return true
}

export async function orderCovidOrderedQtyWrongPieces(value, { req }) {
  const { order_items: orderItems } = req.body
  const order = orderItems.find((item) => item.material_code === value)
  const { batches } = order

  const material = await models.Material.findOne({
    where: { code: value },
  })
  if (Array.isArray(batches) && material) {
    batches.forEach((batch) => {
      const { qty } = batch
      const { pieces_per_unit } = material
      const mod = Number(qty) % Number(pieces_per_unit)
      if (mod !== 0) throw Error(req.__('custom.qty_not_pieces_unit'))
    })
  }

  return true
}

export function commonOrderCovidWrongDateOnBatch(field = '') {
  return function (values, { req }) {
    const arrStrField = !!field === true ? field.split('.') : []
    const sourceField = arrStrField[arrStrField.length - 1]
    if (values && Array.isArray(values)) {
      values.forEach((value) => {
        const { batches } = value
        if (batches && Array.isArray(batches)) {
          batches.forEach((batch) => {
            if (batch[sourceField] && !check(batch[sourceField]).isDate()) throw Error(req.__('validator.date', { field: req.__(field) }))
          })
        }
      })
    }

    return true
  }
}

export function checkDateTime(field = '', format = 'YYYY-MM-DD HH:mm:ss') {
  return function (value, { req }) {
    if (moment(value, format).format(format) !== value) {
      throw Error(req.__('validator.date_format', {
        field: req.__(field),
        format,
      }))
    }
    return true
  }
}

export async function orderUpdateInvalidStatus(value, { req }) {
  if (value) {
    const order = await models.Order.findByPk(value)
    if (order) {
      const { status } = order
      if (status !== ORDER_STATUS.PENDING) throw Error(req.__('custom.order_status_not_pending'))
      // if (status === ORDER_STATUS.SHIPPED) throw Error(req.__('custom.order_status_shipped'))
      // else if (status === ORDER_STATUS.CONFIRMED) throw Error(req.__('custom.order_status_confirmed'))
      // else if (status === ORDER_STATUS.CANCELED) throw Error(req.__('custom.order_status_cancelled'))
      // else if (status === ORDER_STATUS.FULFILLED) throw Error(req.__('custom.order_status_fulfilled'))
    }
  }
  return true
}

export function vendorCustomerCannotBeSame(opt = {}) {
  const { isCovid = false } = opt
  return async function (value, { req }) {
    if (isCovid) {
      let entityId = null

      if (req.user) ({ entity_id: entityId } = req.user)

      const customer = await models.Entity.findOne({ where: { code: value } }) // customer code
      if (customer && entityId && (entityId === customer.id)) throw Error(req.__('custom.vendor_customer_cannot_same'))
    } else {
      const { customer_id } = req.body
      // value is vendor_id
      if (Number(value) === Number(customer_id)) throw Error(req.__('custom.vendor_customer_cannot_same'))
    }
    return true
  }
}

export function customerNotBelongsToVendor(opt = {}) {
  const { isCovid = false } = opt
  return async function (value, { req }) {
    if (isCovid) {
      let vendor_id
      if (req.user.role === USER_ROLE.SUPERADMIN) {
        var vendor_code = ''
        if (req.body.vendor_code)
          vendor_code = req.body.vendor_code
        else {
          const { entity } = req.user
          vendor_code = entity.code
        }
        const vendor = await models.Entity.findOne({ where: { code: vendor_code } })
        vendor_id = vendor.id
      } else {
        vendor_id = req.user.entity_id
      }
      const customer = await models.Entity.findOne({ where: { code: value } })
      const { type } = req.body
      if (customer && vendor_id) {
        const vendor = await models.Entity.findByPk(vendor_id)
        let has = await vendor.hasCustomer(customer)
        if (parseInt(type) === ORDER_TYPE.RETURN) {
          has = await vendor.hasVendor(customer)
        }
        if (!has) throw Error(req.__('custom.customer_not_belongs_to_vendor'))
      }
    } else {
      const { vendor_id } = req.body
      const customer = await models.Entity.findByPk(value)
      if (customer && vendor_id) {
        const vendor = await models.Entity.findByPk(vendor_id)
        const has = await vendor.hasCustomer(customer)
        if (!has) throw Error(req.__('custom.customer_not_belongs_to_vendor'))
      }
    }

    return true
  }
}

export function commonFieldGreaterThanByCondition(model, field1, field2, attribute, condition = {}) {
  let Model = null
  if (typeof model === 'string') Model = models[model]
  else if (typeof model === 'function') Model = model
  return async function (value, { req }) {
    console.log(condition)
    const data = await Model.findOne({ where: condition })
    if (value > data[attribute]) throw Error(req.__('validator.lesser_or_equal', { field1: req.__(`field.${field1}`), field2: req.__(`field.${field2}`) }))

    return true
  }
}

export async function materialAlreadyBelongsToOrder(value, { req }) {
  const { id } = req.params
  if (value && id) {
    const order = await models.Order.findByPk(id)
    if (order) {
      const orderItem = await models.OrderItem.count({
        where: { order_id: id, material_id: value },
      })
      if (orderItem > 0) throw Error(req.__('custom.material_already_to_order'))

      const materialEntity = await models.MaterialEntity.count({
        where: { material_id: value, entity_id: order.vendor_id },
      })
      if (!materialEntity) throw Error(req.__('custom.material_not_exist_vendor'))
    }
  }

  return true
}

export function checkLink(value, { req }) {
  const reg = new RegExp('^(https?:\\/\\/)?' // protocol
    + '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' // domain name
    + '((\\d{1,3}\\.){3}\\d{1,3}))' // OR ip (v4) address
    + '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' // port and path
    + '(\\?[;&a-z\\d%_.~+=-]*)?' // query string
    + '(\\#[-a-z\\d_]*)?$', 'i')
  if (value.length < 8 || !reg.test(value)) {
    throw Error(req.__('validator.string', { field: 'Link' }))
  }

  return true
}

export function checkIsOnlySpace(field) {
  return function (value, { req }) {
    const withoutSpace = value.match(/^ *$/)
    if (value.length >= 1 && withoutSpace !== null) {
      throw Error(req.__('validator.not_empty', { field: req.__(field) }))
    }

    return true
  }
}

export function isXLS(value, { req }) {
  console.log('-----mimetype----', req.file.mimetype)
  const validType = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  if (!req.file) {
    throw Error(req.__('validator.not_empty', { field: 'file' }))
  }
  if (!validType.includes(req.file.mimetype)) {
    throw Error(req.__('validator.string', { field: 'file' }))
  }
  return true
}
