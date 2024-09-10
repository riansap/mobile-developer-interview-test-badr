import listResponse from '../helpers/listResponse'
import { Op } from 'sequelize'

import models from '../models'
import { VERSION_MOBILE } from '../helpers/constants'
import { formatRelationsCount } from '../helpers/common'

const {
  sequelize,
} = models

export async function list(req, res, next) {
  try {
    let { page, paginate } = req.query
    if (!page || page === '') page = 1
    if (!paginate || paginate === '') paginate = 10

    
    const {
      model,
      condition = {},
      attributes,
      order,
      include,
      customOptions,
      isFormatRelationCount = true
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
    
    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]
    
    let docs = []
    let total = 10
    const { mappingDocs } = req
    
    if (Model) {
      docs = await Model.findAll(options)
      const countOptions = {
        ...options,
        include: isFormatRelationCount ? formatRelationsCount(options.include, condition) : options.include,
      }

      total = await Model.count({ ...countOptions, subQuery: false })

      if (typeof req.mappingDocs === 'function' && Array.isArray(docs)) {
        docs = await mappingDocs({ docs, req })
      }
    }

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (err) {
    console.error(err, '===')
    return next(err)
  }
}


export async function listDeleted(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query

    const {
      model,
      condition = {},
      attributes,
      order,
      include,
      customOptions,
      isFormatRelationCount = true,
    } = req

    const options = {
      order,
      attributes,
      limit: Number(paginate),
      offset: (page - 1) * Number(paginate),
      where: condition,
      duplicating: false,
      paranoid: false,
      ...customOptions,
    }

    if (include && typeof include === 'object') options.include = include

    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]

    let docs = []
    let total = 10
    const { mappingDocs } = req

    if (Model) {
      docs = await Model.findAll(options)
      const countOptions = {
        ...options,
        include: isFormatRelationCount ? formatRelationsCount(options.include, condition) : options.include,
      }
      total = await Model.count({ ...countOptions, subQuery: false })

      if (typeof req.mappingDocs === 'function' && Array.isArray(docs)) {
        docs = await mappingDocs({ docs, req })
      }
    }

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (err) {
    console.error(err, '===')
    return next(err)
  }
}

export async function unlimitedList(req, res, next) {
  try {
    const {
      model,
      condition = {},
      attributes,
      order,
      include,
      mappingDocs
    } = req
    const customOptions = req.customOptions
    const options = {
      order,
      attributes,
      where: condition,
      ...customOptions
    }

    if (include && typeof include === 'object') options.include = include

    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]

    let docs = []

    if (Model) {
      docs = await Model.findAll(options)
    }
    if (typeof req.mappingDocs === 'function' && Array.isArray(docs)) {
      docs = await mappingDocs({ docs, req })
    }

    if (Array.isArray(docs) && docs.length <= 0) throw { status: 204 }

    return res.status(200).json(docs)
  } catch (err) {
    return next(err)
  }
}

export async function create(req, res, next) {
  const t = await sequelize.transaction()
  try {
    const { model, user } = req

    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]

    let data = {}
    if (Model) {
      if (user) {
        req.body.created_by = user.id
        req.body.updated_by = user.id
      }
      delete req.body.id
      const options = { locale: req.getLocale(), subject: req.__('custom.user_created') }
      data = await Model.create(req.body, options, { transaction: t })
    }

    await t.commit()

    data = await Model.findByPk(data.id)

    return res.status(201).json(data)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function update(req, res, next) {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const { model, user } = req

    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]

    let data = {}
    if (Model) {
      if (user) {
        req.body.updated_by = user.id
      }
      delete req.body.id
      data = await Model.findByPk(id)
      if (!data) throw { status: 404, message: req.__('404') }
      data = await data.update(req.body, { transaction: t })
    }

    await t.commit()

    data = await Model.findByPk(data.id)

    return res.status(200).json(data)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function destroy(req, res, next) {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const { model, user } = req
    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]

    let data = {}
    if (Model) {
      if (user) {
        req.body.deleted_by = user.id
      }
      data = await Model.findByPk(id)
      if (!data) throw { status: 404, message: req.__('404') }
      await data.update(req.body, { transaction: t })
      await data.destroy({ transaction: t })
    }

    await t.commit()

    return res.status(200).json({ message: 'success' })
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function detail(req, res, next) {
  try {
    const { id } = req.params
    const { model, include, customOptions } = req
    let Model = null
    if (typeof model === 'function') Model = model
    else if (typeof model === 'string') Model = models[model]

    let data = {}
    let options = { ...customOptions }
    if (Model) {
      if (include && typeof include === 'object') options.include = include
      data = await Model.findByPk(id, options)
      if (!data) throw { status: 404, message: req.__('404') }
      if (typeof req.mappingData === 'function') {
        data = req.mappingData({ data, req })
      }
    }

    return res.status(200).json(data)
  } catch (err) {
    console.log(err)
    return next(err)
  }
}

export function filterKeywordBy(fieldName = []) {
  return async (req, res, next) => {
    try {
      let condition = req.condition || {}
      let arrayOr = []
      const { keyword } = req.query

      if (keyword) {
        for (let index = 0; index <= fieldName.length; index++) {
          if (fieldName[index]) {
            arrayOr.push({
              [fieldName[index]]: {
                [Op.like]: `%${keyword}%`
              }
            })
          }
        }
        condition = {
          [Op.or]: arrayOr
        }
      }

      req.condition = condition
      return next()
    } catch (err) {
      return next(err)
    }
  }
}

export function filterKeywordQuery(attr = 'eq', fields = []) {
  return (req, res, next) => {
    let condition = req.condition || {}
    fields.forEach(item => {
      console.log(item, '====')
      if (req.query[item]) {
        if (attr === 'like') {
          condition[item] = {
            [Op[attr]]: `%${req.query[item]}%`
          }
        } else {
          condition[item] = {
            [Op[attr]]: req.query[item]
          }
        }
      }
    })

    req.condition = condition
    return next()
  }
}

export function filterQuery(fieldName = []) {
  return async (req, res, next) => {
    try {
      let condition = []
      const query = req.query
      for (let attribute of fieldName) {
        let search = query[attribute]
        if (search) {
          condition.push({ [attribute]: search })
        }
      }
      if (typeof req.condition == 'object') {
        condition.push(req.condition)
      } else if (Array.isArray(req.condition) && req.condition.length > 0) {
        condition = [
          req.condition,
          ...condition
        ]
      }

      req.condition = condition

      return next()
    } catch (err) {
      return next(err)
    }
  }
}

export function versionMobile(req, res, next) {
  try {
    const { version } = req.body
    const currentVersion = VERSION_MOBILE.version
    const versionName = VERSION_MOBILE.version_name

    let force = false

    if (version < currentVersion) {
      force = true
    }

    return res.status(200).json({
      force,
      version: currentVersion,
      version_name: versionName
    })
  } catch (err) {
    return next(err)
  }
}
