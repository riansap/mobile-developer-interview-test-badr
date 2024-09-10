import { Op } from 'sequelize'
import moment from 'moment'
import models from '../models'

import listResponse from '../helpers/listResponse'
import { USER_ROLE, TRANSACTION_TYPE, ENTITY_TYPE } from '../helpers/constants'
import { formatRelationsCount } from '../helpers/common'

const { Material, Stock, Batch, MaterialEntity, sequelize } = models

export async function list(req, res, next) {
  try {
    const {
      keyword,
      expired_start_date,
      expired_end_date,
      material_tag_id,
      material_id,
      no_batch,
      batch_ids,
      sub_district_id,
      entity_tag_id,
      only_have_qty,
      is_vaccine,
    } = req.query

    let { entity_id, province_id, regency_id } = req.query

    const andCondition = []
    if (
      req.user.role === USER_ROLE.OPERATOR ||
      req.user.role === USER_ROLE.OPERATOR_COVID
    ) {
      entity_id = req.user.entity_id
    }
    if (entity_id) andCondition.push({ entity_id })
    if (material_id) andCondition.push({ material_id })

    const materialOptions = {}
    const materialCondition = []
    if (keyword) materialCondition.push({ name: { [Op.like]: `%${keyword}%` } })
    if (is_vaccine !== null && is_vaccine !== undefined) {
      materialCondition.push({ is_vaccine })
    }
    if (materialCondition.length > 0) materialOptions.where = materialCondition

    if (material_tag_id) {
      const materialTagIdArray = material_tag_id.split(',')
      materialOptions.include = {
        association: 'material_tags',
        attributes: [],
        where: { id: { [Op.in]: materialTagIdArray } },
        through: { attributes: [] },
      }
    }

    const materialIds = []
    if (JSON.stringify(materialOptions) !== '{}') {
      await Material.findAll({
        attributes: ['id'],
        ...materialOptions,
      }).then((material) => {
        material.forEach((element) => {
          materialIds.push(element.id)
        })
      })
    }

    req.include = [
      {
        association: 'material',
        attributes: Material.getBasicAttribute(),
        include: [
          {
            association: 'material_tags',
            attributes: ['id', 'title'],
            through: { attributes: [] },
          },
        ],
      },
      {
        association: 'entity',
        attributes: models.Entity.getBasicAttribute(),
        include: [
          { association: 'province', attributes: ['id', 'name'] },
          { association: 'regency', attributes: ['id', 'name'] },
          { association: 'entity_tags', attributes: ['id'] },
        ],
        required: true,
      },
      {
        association: 'stocks',
        attributes: Stock.getBasicAttribute(),
        include: [
          {
            association: 'batch',
            attributes: Batch.getBasicAttribute(),
            include: {
              association: 'manufacture',
              attributes: ['name', 'address'],
            },
          },
        ],
        required: false,
        separate: true,
      },
    ]

    const entityIncludeIndex = req.include.findIndex(
      (include) => include.association === 'entity'
    )

    const entityCondition = []
    if (
      req.user.role === USER_ROLE.MANAGER ||
      req.user.role === USER_ROLE.MANAGER_COVID
    ) {
      if (req.user.entity.type === ENTITY_TYPE.PROVINSI)
        province_id = req.user.entity.province_id
      else if (req.user.entity.type === ENTITY_TYPE.KOTA) {
        province_id = req.user.entity.province_id
        regency_id = req.user.entity.regency_id
      }
    }
    if (province_id) entityCondition.push({ province_id })
    if (regency_id) entityCondition.push({ regency_id })
    if (sub_district_id) entityCondition.push({ sub_district_id })

    if (entityCondition.length > 0) {
      req.include[entityIncludeIndex].where = entityCondition
    }

    if (entity_tag_id) {
      const entityInclude = req.include[entityIncludeIndex]
      const entityTagsIncludeIndex = entityInclude.include.findIndex(
        (include) => include.association === 'entity_tags'
      )

      entityInclude.include[entityTagsIncludeIndex].where = {
        id: entity_tag_id,
      }
    }

    const batchConditon = []

    if (expired_start_date && expired_end_date) {
      batchConditon.push({
        expired_date: {
          [Op.between]: [
            moment(expired_start_date)
              .add(1, 'days')
              .format('YYYY-MM-DD HH:mm:ss'),
            moment(expired_end_date)
              .add(1, 'days')
              .format('YYYY-MM-DD HH:mm:ss'),
          ],
        },
      })
    }

    if (no_batch) {
      batchConditon.push({ code: { [Op.like]: `%${no_batch}%` } })
    }

    if (batch_ids) {
      const batchIdArray = batch_ids.split(',')
      batchConditon.push({ id: { [Op.in]: batchIdArray } })
    }

    let batchIds = []
    if (batchConditon.length > 0) {
      req.include[2].include[0].where = batchConditon
      req.include[2].include[0].required = true
      req.include[2].required = true
      batchIds = await models.Batch.findAll({
        where: batchConditon,
        raw: true,
        attributes: ['id'],
      })
      batchIds = batchIds.map((item) => item.id)
    }

    if (materialIds.length > 0)
      andCondition.push({ material_id: { [Op.in]: materialIds } })

    if (only_have_qty) {
      andCondition.push({ on_hand_qty: { [Op.gt]: 0 } })
    }

    req.condition = andCondition

    req.order = [[{ model: Material, as: 'material' }, 'name', 'ASC']]

    req.customOptions = {
      distinct: 'MaterialEntity.id',
      subQuery: false,
    }

    let addQueries = ''
    if (batchIds.length > 0)
      addQueries = `AND batch_id in (${batchIds.join(',')})`

    req.attributes = [
      ...models.MaterialEntity.getBasicAttribute(),
      ['on_hand_qty', 'on_hand_stock'],
      ['allocated_qty', 'allocated_stock'],
      [
        sequelize.literal(
          `(SELECT MAX(updatedAt) FROM stocks WHERE material_entity_id = \`MaterialEntity\`.\`id\`${addQueries})`
        ),
        'stock_update',
      ],
      [sequelize.literal('(on_hand_qty - allocated_qty)'), 'available_stock'],
    ]

    return next()
  } catch (err) {
    console.error(err)
    return next(err)
  }
}

export async function customList(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query
    const { condition = {}, attributes, order, include, customOptions } = req

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

    docs = await MaterialEntity.findAll(options)
    const countOptions = {
      ...options,
      attributes: [],
      having: [],
      include: formatRelationsCount(options.include, condition),
    }

    total = await MaterialEntity.count({ ...countOptions, subQuery: false })

    if (Array.isArray(docs) && docs.length <= 0) {
      throw { status: 204, message: req.__('204') }
    }

    docs = await Promise.all(
      docs.map(async (data) => {
        let materialCompanions = await models.MaterialCompanion.findAll({
          where: { material_id: data.material.id },
          include: { association: 'material_companion' },
        })
        materialCompanions = materialCompanions.map((obj) => {
          return obj.material_companion.dataValues
        })

        data.dataValues.material.dataValues.material_companion =
          materialCompanions ?? []
        return data
      })
    )
    return res.status(200).json(listResponse(total, page, paginate, docs))
  } catch (err) {
    return next(err)
  }
}

export async function exportStockExcel(req, res, next) {
  try {
    const {
      expired_start_date,
      expired_end_date,
      province_id,
      regency_id,
      sub_district_id,
      entity_tag_id,
      batch_ids,
    } = req.query
    let materialEntityCondition = {}

    if (req.condition) {
      materialEntityCondition = req.condition
      req.condition = {}
    }

    req.customOptions = {
      distinct: 'MaterialEntity.id',
    }

    req.attributes = null

    req.order = []

    const batchCondition = []
    if (expired_start_date && expired_end_date) {
      batchCondition.push({
        expired_date: {
          [Op.between]: [
            moment(expired_start_date).add(1, 'days'),
            moment(expired_end_date).add(1, 'days'),
          ],
        },
      })
    }
    if (batch_ids) {
      const batchIdArray = batch_ids.split(',')
      batchCondition.push({ id: { [Op.in]: batchIdArray } })
    }

    req.include = [
      {
        association: 'material_entity',
        where: materialEntityCondition,
        include: [
          {
            association: 'entity',
            attributes: models.Entity.getBasicAttribute(),
            required: true,
            include: [
              {
                association: 'province',
                attributes: ['name'],
              },
              {
                association: 'regency',
                attributes: ['name'],
              },
              {
                association: 'sub_district',
                attributes: ['name'],
              },
              {
                association: 'entity_tags',
                attributes: ['id'],
              },
            ],
          },
          {
            association: 'material',
            attributes: Material.getBasicAttribute(),
          },
        ],
      },
      {
        association: 'batch',
        attributes: models.Batch.getBasicAttribute(),
      },
    ]
    if (batchCondition.length > 0) {
      req.include[1].where = batchCondition
      req.include[1].required = true
    }

    const materialEntityIndex = req.include.findIndex(
      (include) => include.association === 'material_entity'
    )
    const entityIndex = req.include[materialEntityIndex].include.findIndex(
      (include) => include.association === 'entity'
    )

    const entityCondition = []
    if (province_id) entityCondition.push({ province_id })
    if (regency_id) entityCondition.push({ regency_id })
    if (sub_district_id) entityCondition.push({ sub_district_id })

    if (entityCondition.length > 0) {
      req.include[materialEntityIndex].include[entityIndex].where =
        entityCondition
    }

    if (entity_tag_id) {
      const entityTagsIndex = req.include[materialEntityIndex].include[
        entityIndex
      ].include.findIndex((include) => include.association === 'entity_tags')
      req.include[materialEntityIndex].include[entityIndex].include[
        entityTagsIndex
      ].where = { id: entity_tag_id }
    }

    req.xlsColumns = [
      { key: 'entity_name', title: 'Nama Entitas' },
      { key: 'province_name', title: 'Provinsi' },
      { key: 'regency_name', title: 'Kab/Kota' },
      { key: 'district_name', title: 'Kecamatan' },
      { key: 'entity_type', title: 'Tipe Entitas' },
      { key: 'material_name', title: 'Nama Material' },
      { key: 'batch_code', title: 'Nomor Batch' },
      { key: 'expired_date', title: 'Tanggal Kadaluwarsa' },
      { key: 'on_hand_stock', title: 'Sisa Stock' },
    ]

    req.mappingContents = ({ data }) => {
      let item = {}
      const { batch, material_entity } = data
      const { entity, material } = material_entity
      let province
      let regency
      let district = null

      if (entity) {
        province = entity.province
        regency = entity.regency
        district = entity.district
      }

      item = {
        entity_name: entity?.name || '',
        province_name: province?.name || '',
        regency_name: regency?.name || '',
        district_name: district?.name || '',
        entity_type: entity?.type_label || '',
        material_name: material?.name || '',
        batch_code: batch?.code || '',
        expired_date: batch
          ? moment(batch.expired_date).format('YYYY-MM-DD')
          : '',
        on_hand_stock: data.qty,
      }

      return item
    }

    next()
  } catch (err) {
    return next(err)
  }
}

export async function listPerMaterial(req, res, next) {
  try {
    const { material_id } = req.query
    let { entity_id } = req.query

    const role = Number(req.user.role)
    if (role !== USER_ROLE.SUPERADMIN && role !== USER_ROLE.ADMIN)
      entity_id = req.entityID

    if (!material_id || !entity_id)
      throw { status: 404, message: req.__('404') }

    const materialEntity = await MaterialEntity.findOne({
      where: [{ entity_id }, { material_id }],
    })

    const material = await Material.findByPk(material_id)

    if (!materialEntity) throw { status: 404, message: req.__('404') }

    req.include = [
      {
        association: 'batch',
        attributes: Batch.getBasicAttribute(),
        include: {
          association: 'manufacture',
          attributes: ['name', 'address'],
        },
      },
    ]
    req.customOptions = {
      with_order_stocks: true,
    }

    let batchCondition = { batch_id: { [Op.is]: null } }
    if (material.managed_in_batch)
      batchCondition = { batch_id: { [Op.not]: null } }

    req.condition = [
      {
        material_entity_id: materialEntity.id,
      },
      batchCondition,
    ]

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function issueStock(req, res, next) {
  try {
    const { material_tag_id, material_id, customer_id } = req.query
    let { entity_id } = req.query

    const role = Number(req.user.role)
    if (role !== USER_ROLE.SUPERADMIN && role !== USER_ROLE.ADMIN) {
      if (!entity_id) {
        entity_id = req.entityID
      }
    }

    const andCondition = []
    if (entity_id) andCondition.push({ entity_id })
    if (material_id) andCondition.push({ material_id })

    const materialOptions = {}
    if (material_tag_id) {
      materialOptions.include = {
        association: 'material_tags',
        attributes: [],
        where: { id: material_tag_id },
        through: { attributes: [] },
      }
    }
    const materialIds = []
    if (materialOptions.include) {
      await Material.findAll({
        attributes: ['id'],
        ...materialOptions,
      }).then((material) => {
        material.forEach((element) => {
          materialIds.push(element.id)
        })
      })
    }

    req.include = [
      {
        association: 'material',
        attributes: Material.getBasicAttribute(),
      },
      {
        association: 'stocks',
        attributes: Stock.getBasicAttribute(),
        include: {
          association: 'batch',
          attributes: Batch.getBasicAttribute(),
          required: false,
        },
        required: true,
      },
    ]

    if (materialIds.length > 0)
      andCondition.push({ material_id: { [Op.in]: materialIds } })

    req.condition = {
      [Op.and]: andCondition,
    }

    req.order = [[{ model: Material, as: 'material' }, 'name', 'ASC']]

    req.mappingDocs = async ({ docs }) => {
      const materialId = []
      docs.map((data) => {
        materialId.push(data.material.id)
      })
      const transactions = await models.Transaction.findAll({
        where: [
          {
            transaction_type_id: {
              [Op.in]: [TRANSACTION_TYPE.ISSUES, TRANSACTION_TYPE.RETURN],
            },
          },
          { order_id: null },
          { entity_id },
          { customer_id },
          { material_id: { [Op.in]: materialId } },
        ],
        attributes: [
          'stock_id',
          'transaction_type_id',
          [sequelize.fn('SUM', sequelize.col('change_qty')), 'total_qty'],
        ],
        group: ['stock_id', 'transaction_type_id'],
        raw: true,
      })
      return docs.map((data) => {
        let stock = []
        let qty = 0

        if (data.material.managed_in_batch) {
          stock = data.stocks.filter((el) => el.batch_id !== null)
        } else {
          stock = data.stocks.filter((el) => el.batch_id === null)
        }

        stock = stock.map((item) => {
          let stockIssue = 0
          transactions.map((element) => {
            if (element.stock_id === item.stock_id) {
              if (element.transaction_type_id === TRANSACTION_TYPE.ISSUES) {
                stockIssue += Math.abs(element.total_qty)
              } else if (
                element.transaction_type_id === TRANSACTION_TYPE.RETURN
              ) {
                stockIssue -= element.total_qty
              }
            }
          })
          if (item.qty) qty += parseInt(item.qty)
          if (stockIssue) {
            return {
              total_issue: stockIssue,
              stock_id: item.stock_id,
              batch_id: item.batch_id,
              batch: item.batch?.dataValues || null,
              updated_at: item.updatedAt,
            }
          }
        })
        stock = stock.filter((item) => item != null)

        return {
          ...data.material.dataValues,
          min: data.min,
          max: data.max,
          qty,
          updated_at: stock[0]?.updated_at || '-',
          stocks: stock,
        }
      })
    }
    return next()
  } catch (err) {
    return next(err)
  }
}
