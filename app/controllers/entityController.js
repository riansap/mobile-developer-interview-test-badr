import { Op } from 'sequelize'
import models from '../models'
import moment from 'moment'
import errorResponse from '../helpers/errorResponse'
import listResponse from '../helpers/listResponse'
import { ENTITY_TYPE } from '../helpers/constants'
import { parsingArrIds } from '../helpers/common'

const {
  Entity,
  sequelize,
  CustomerVendor,
  Transaction,
  Order,
  User,
  TrackingLog,
  MasterActivity,
  EntityActivityDate,
} = models

const mappingEntityAssociation = {
  association: 'mapping_entity',
  attributes: models.MappingEntity.getBasicAttribute(),
}

export const listEntityChild = async (req, res, next) => {
  try {
    const getUrlBelowParam = req.url.split('?')[0]
    let associationName =
      getUrlBelowParam.split('/')[getUrlBelowParam.split('/').length - 1]

    if (!['vendors', 'customers'].includes(associationName))
      associationName = 'customers'

    const localMappingEntityAssociation = {
      association: 'mapping_entity',
      attributes: models.MappingEntity.getBasicAttribute(),
    }

    const { id } = req.params
    const {
      keyword,
      is_consumption,
      entity_tag_id,
      page,
      is_extermination,
      code_satu_sehat,
    } = req.query

    let options = [{ status: 1 }]
    let throughOptions = {}
    let entityTagOptions = []
    if (keyword) {
      options.push({
        name: {
          [Op.like]: `%${keyword}%`,
        },
      })
    }
    if (entity_tag_id) {
      entityTagOptions.push({ id: entity_tag_id })
    }
    if (parseInt(page) > 1) {
      throw { status: 204, message: req.__('204') }
    }

    if (code_satu_sehat) {
      localMappingEntityAssociation.where = {
        id_satu_sehat: {
          [Op.in]: code_satu_sehat.split(','),
        },
      }
    }

    if (is_extermination && typeof is_extermination !== 'undefined') {
      throughOptions = {
        is_extermination: parseInt(is_extermination),
      }
    } else if (typeof is_consumption !== 'undefined') {
      if (parseInt(is_consumption) === 1) {
        throughOptions = {
          is_consumption: 1,
        }
      } else {
        throughOptions = {
          is_distribution: 1,
        }
      }
    }

    var data = null
    const childAssociation = {
      association: associationName,
      attributes: ['id', 'code', 'name', 'address'],
      through: {
        attributes: ['is_consumption', 'is_distribution', 'is_extermination'],
        where: throughOptions,
      },
      where: options,
      include: [
        {
          association: 'users',
          attributes: [
            'id',
            'username',
            'firstname',
            'lastname',
            'mobile_phone',
          ],
        },
        {
          association: 'entity_tags',
          attributes: ['id', 'title'],
          where: entityTagOptions,
        },
        localMappingEntityAssociation,
      ],
    }

    data = await Entity.findByPk(id, {
      include: [childAssociation],
      order: [[{ model: Entity, as: associationName }, 'code', 'ASC']],
    })

    if (!data)
      return res.status(204).json(errorResponse('Data tidak ditemukan'))
    let total = data[associationName].length
    return res
      .status(200)
      .json(listResponse(total, 1, total, data[associationName]))
  } catch (err) {
    return next(err)
  }
}

export async function addCustomer(req, res, next) {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    let { customer_id, is_consumption } = req.body

    var data = null
    data = await Entity.findByPk(id)
    if (!data)
      return res.status(400).json(errorResponse('Data tidak ditemukan'))
    if (data.is_vendor !== 1)
      return res
        .status(400)
        .json(
          errorResponse(
            'Data entitas bukan penyedia, tidak bisa menambah pelanggan'
          )
        )

    let checkCustomer = await checkEntityCustomer(
      customer_id,
      data,
      is_consumption
    )
    if (checkCustomer !== true) {
      return res.status(400).json(errorResponse(checkCustomer))
    }

    let customerOptions = {
      is_distribution: 1,
    }

    if (parseInt(is_consumption)) {
      customer_id = customer_id.map((item) => {
        return {
          vendor_id: id,
          customer_id: item,
          is_consumption: 1,
          is_distribution: 0,
        }
      })
      customerOptions = {
        is_consumption: 1,
      }
    } else {
      customer_id = customer_id.map((item) => {
        return { vendor_id: id, customer_id: item, is_distribution: 1 }
      })
    }

    await CustomerVendor.destroy(
      {
        where: {
          vendor_id: id,
          ...customerOptions,
        },
      },
      { transaction: t }
    )

    await CustomerVendor.bulkCreate(customer_id, { transaction: t })

    await t.commit()

    data = await Entity.findByPk(id, {
      include: [
        {
          association: 'customers',
          attributes: ['id', 'name', 'address'],
        },
        mappingEntityAssociation,
      ],
    })

    return res.status(200).json(data)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function checkEntityCustomer(
  customer_id,
  entity,
  is_consumption = 0
) {
  const customerData = await models.Entity.findAll({
    where: { id: { [Op.in]: customer_id } },
    attributes: ['id', 'type', 'province_id'],
  })

  if (customer_id.includes(String(entity.id))) {
    return 'Customer dan vendor tidak boleh sama'
  }

  if (
    !customerData
      ?.map((item) => Number(item?.province_id))
      ?.includes(Number(entity?.province_id)) &&
    [ENTITY_TYPE.PROVINSI, ENTITY_TYPE.KOTA, ENTITY_TYPE.FASKES].includes(
      entity.type
    )
  ) {
    return 'Data provinsi vendor & pelanggan tidak sama'
  }

  if (
    entity.type === ENTITY_TYPE.PROVINSI &&
    customerData
      ?.map((item) => Number(item?.type))
      ?.includes(ENTITY_TYPE.PROVINSI)
  ) {
    return 'Pelanggan tidak boleh entitas Dinkes provinsi'
  }

  if (
    entity.type === ENTITY_TYPE.KOTA &&
    customerData
      ?.map((item) => Number(item?.type))
      ?.includes(ENTITY_TYPE.PROVINSI, ENTITY_TYPE.KOTA)
  ) {
    return 'Pelanggan tidak boleh entitas Dinkes Provinsi atau Kab/Kota'
  }

  // if is_consumption exists customer must be non vendor
  // else customer must be vendor
  const mustVendor = is_consumption ? 0 : 1
  const customerConsumption = await Entity.count({
    where: [{ id: { [Op.in]: customer_id } }, { is_vendor: mustVendor }],
  })

  if (customerConsumption !== customer_id.length) {
    return is_consumption
      ? 'Data pelanggan konsumsi tidak boleh entitas vendor'
      : 'Data pelanggan distribusi tidak boleh entitas non vendor'
  }

  let existCustomer = await CustomerVendor.findAll({
    where: [{ vendor_id: entity.id }, { is_consumption }],
    attributes: ['customer_id'],
    raw: true,
  })

  existCustomer = existCustomer.map((el) => {
    return el.customer_id
  })
  let deletedCustomer = existCustomer.filter((x) => !customer_id.includes(x))
  if (deletedCustomer) {
    let hasOrder = 0
    if (!is_consumption) {
      hasOrder = await Order.count({
        where: {
          [Op.or]: [
            {
              [Op.and]: [
                {
                  customer_id: {
                    [Op.in]: deletedCustomer,
                  },
                  vendor_id: entity.id,
                },
              ],
              [Op.and]: [
                {
                  vendor_id: {
                    [Op.in]: deletedCustomer,
                  },
                  customer_id: entity.id,
                },
              ],
            },
          ],
        },
      })
    }
    const hasTransaction = await Transaction.count({
      where: [
        {
          customer_id: {
            [Op.in]: deletedCustomer,
          },
        },
        {
          entity_id: entity.id,
        },
        {
          order_id: is_consumption ? null : { [Op.not]: null },
        },
      ],
    })
    if (hasOrder || hasTransaction) {
      return 'Data customer tidak bisa dihapus, telah memiliki pesanan'
    }
  }
  return true
}

export async function detail(req, res, next) {
  try {
    req.include = [
      {
        association: 'users',
        attributes: ['id', 'username', 'firstname', 'lastname', 'mobile_phone'],
      },
      {
        association: 'entity_tags',
        attributes: ['id', 'title'],
        through: { attributes: [] },
      },
      {
        model: MasterActivity,
        as: 'activities_date',
        attributes: [
          ['id', 'activity_id'],
          ['name', 'activity_name'],
        ],
        through: {
          model: EntityActivityDate,
          attributes: ['id', 'join_date', 'end_date'],
        },
      },
      mappingEntityAssociation,
    ]

    req.mappingData = ({ data }) => {
      const activitiesDate = data.activities_date.map((activityDate) => {
        return {
          activity_id: activityDate.dataValues.activity_id,
          activity_name: activityDate.dataValues.activity_name,
          join_date: activityDate.dataValues.entity_activity_date.join_date,
          end_date: activityDate.dataValues.entity_activity_date.end_date,
        }
      })

      return {
        ...data.dataValues,
        activities_date: activitiesDate,
      }
    }

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function create(req, res, next) {
  try {
    const { user } = req
    const { entity_tags, activities_date } = req.body

    let data = {}
    if (user) {
      req.body.created_by = user.id
      req.body.updated_by = user.id
    }
    const t = await sequelize.transaction()
    try {
      data = await Entity.create(req.body, { transaction: t })
      if (entity_tags)
        await data.setEntity_tags(entity_tags, { transaction: t })

      if (activities_date && activities_date.length > 0) {
        const activitiesDate = activities_date.map((activityDate) => {
          return {
            ...activityDate,
            entity_id: data.id,
          }
        })

        await EntityActivityDate.bulkCreate(activitiesDate, {
          ignoreDuplicates: true,
          transaction: t,
        })
      }

      await t.commit()
    } catch (err) {
      await t.rollback()
      return next(err)
    }

    data = await Entity.findByPk(data.id)

    return res.status(201).json(data)
  } catch (err) {
    return next(err)
  }
}

export async function update(req, res, next) {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const { user } = req
    const { entity_tags, activities_date } = req.body

    let data = {}
    if (user) {
      req.body.updated_by = user.id
    }
    data = await Entity.findByPk(id)
    if (!data) throw { status: 404, message: req.__('404') }

    data = await data.update(req.body, { transaction: t })

    await data.setEntity_tags([], { transaction: t })
    if (entity_tags) await data.setEntity_tags(entity_tags, { transaction: t })

    if (activities_date && activities_date.length > 0) {
      await Promise.all(
        activities_date.map(async (activityDate) => {
          const { activity_id, join_date, end_date } = activityDate

          let entityActivityDate = await EntityActivityDate.findOne({
            where: {
              entity_id: id,
              activity_id: activity_id,
            },
          })

          if (entityActivityDate) {
            // If the relationship exists, update it
            entityActivityDate.join_date = join_date
            entityActivityDate.end_date = end_date
            await entityActivityDate.save()
          } else {
            // If the relationship doesn't exist, create it
            await EntityActivityDate.create(
              {
                entity_id: id,
                activity_id: activity_id,
                join_date: join_date,
                end_date: end_date,
              },
              { transaction: t }
            )
          }
        })
      )
    }

    await t.commit()

    return res.status(200).json(data)
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function list(req, res, next) {
  try {
    let condition = []

    const {
      entity_tag,
      type,
      keyword,
      is_vendor,
      nonbasic_type,
      updated_at_from,
      updated_at_to,
      deleted_at_from,
      deleted_at_to,
      exists_ayo_sehat,
      code_satu_sehat,
    } = req.query

    let paths = req.path.split('/')

    if (paths[paths.length - 1] == 'deleted') {
      condition.push({ deleted_at: { [Op.not]: null } })
    }

    const relationsEntityTags = {
      association: 'entity_tags',
      attributes: ['id', 'title'],
      through: { attributes: [] },
    }
    if (entity_tag) {
      relationsEntityTags.where = { id: entity_tag }
    }
    if (type) {
      condition.push({ type: parseInt(type) })
    }
    if (keyword) {
      condition.push({
        [Op.or]: [
          { name: { [Op.like]: `%${keyword}%` } },
          { code: { [Op.like]: `%${keyword}%` } },
        ],
      })
    }
    if (nonbasic_type && nonbasic_type !== '0') {
      condition.push({
        type: {
          [Op.notIn]: [
            ENTITY_TYPE.PROVINSI,
            ENTITY_TYPE.KOTA,
            ENTITY_TYPE.FASKES,
            ENTITY_TYPE.PKC,
          ],
        },
      })
    }

    let { province_id, regency_id, sub_district_id, village_id } = req.query

    if (province_id) {
      condition.push({ province_id: parsingArrIds(province_id) })
    }
    if (regency_id) {
      condition.push({ regency_id: parsingArrIds(regency_id) })
    }
    if (sub_district_id) {
      condition.push({ sub_district_id: parsingArrIds(sub_district_id) })
    }
    if (village_id) {
      condition.push({ village_id: parsingArrIds(village_id) })
    }
    if (is_vendor) {
      condition.push({ is_vendor: parsingArrIds(is_vendor) })
    }

    if (updated_at_from)
      condition.push({
        updated_at: { [Op.gte]: updated_at_from + ' 00:00:00' },
      })
    if (updated_at_to)
      condition.push({ updated_at: { [Op.lte]: updated_at_to + ' 23:59:59' } })

    if (deleted_at_from)
      condition.push({
        deleted_at: { [Op.gte]: deleted_at_from + ' 00:00:00' },
      })
    if (deleted_at_to)
      condition.push({ deleted_at: { [Op.lte]: deleted_at_to + ' 23:59:59' } })

    if (exists_ayo_sehat)
      condition.push({
        id: sequelize.literal(
          'exists(select customer_id from integration_ayo_sehat where customer_id = Entity.id)'
        ),
      })
    if (code_satu_sehat)
      condition.push({
        id_satu_sehat: sequelize.literal(
          `exists(select id_entitas_smile, id_satu_sehat from mapping_entities where id_entitas_smile = Entity.id and id_satu_sehat in (${code_satu_sehat}))`
        ),
      })

    req.include = [
      mappingEntityAssociation,
      relationsEntityTags,
      {
        association: 'province',
        attributes: ['id', 'name'],
      },
      {
        association: 'regency',
        attributes: ['id', 'name'],
      },
      {
        association: 'sub_district',
        attributes: ['id', 'name'],
      },
      {
        association: 'village',
        attributes: ['id', 'name'],
      },
    ]
    req.order = [['code', 'ASC']]

    if (condition.length > 0) req.condition = condition

    req.xlsColumns = [
      { key: 'id' },
      { key: 'name' },
      { key: 'address' },
      { key: 'village_id' },
      { key: 'region_id' },
      { key: 'code' },
      { key: 'province_id' },
      { key: 'regency_id' },
      { key: 'type_label', title: 'type' },
      { key: 'is_vendor' },
    ]

    return next()
  } catch (err) {
    return next(err)
  }
}

export function listTrackDevices() {
  return async function (req, res, next) {
    try {
      const { id } = req.params
      var data = null
      data = await Entity.findByPk(id, {
        include: [
          {
            association: 'track_devices',
            attributes: ['id', 'nopol', 'mobile_phone', 'device_number'],
          },
          mappingEntityAssociation,
        ],
      })
      if (!data)
        return res.status(204).json(errorResponse('Data tidak ditemukan'))
      return res
        .status(200)
        .json(
          listResponse(
            data['track_devices'].length,
            1,
            20,
            data['track_devices']
          )
        )
    } catch (err) {
      return next(err)
    }
  }
}

export function historyTrackDevice() {
  return async function (req, res, next) {
    try {
      const { nopol } = req.params
      const { start_date, end_date, page = 1, paginate = 10 } = req.query
      const options = {
        paginate: Number(paginate),
        page: Number(page),
        where: {
          [Op.and]: {
            nopol: nopol,
            updated_at: {
              [Op.and]: {
                [Op.gte]: moment(start_date).format('YYYY-MM-DD'),
                [Op.lte]: moment(end_date).add(1, 'days').format('YYYY-MM-DD'),
              },
            },
          },
        },
        order: [['updated_at', 'DESC']],
        group: ['updated_time'],
      }
      if (nopol) {
        const { docs, total } = await TrackingLog.paginate(options)
        if (docs.length < 1)
          return res.status(204).json(errorResponse('Data tidak ditemukan'))
        const historyList = []
        for (const history of docs) {
          var item = {}
          item.nopol = history.nopol
          item.status_do = history.status_do
          item.temperature1 = null
          if (history.curr_temp) item.temperature1 = history.curr_temp
          item.lat = history.lat
          item.lon = history.lon
          item.is_alarm = history.is_alarm
          item.gps_time = history.updated_time
          item.received_time = history.updated_time
          historyList.push(item)
        }
        return res
          .status(200)
          .json(listResponse(total, page, paginate, historyList))
      } else {
        return res.status(204).json(errorResponse('Data tidak ditemukan'))
      }
    } catch (err) {
      return next(err)
    }
  }
}

export async function faskesToRegencyGenerate(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query

    const options = {
      paginate: Number(paginate),
      page: Number(page),
      where: {
        type: ENTITY_TYPE.FASKES,
      },
    }

    const entitiesPaginate = await Entity.paginate(options)
    const entities = entitiesPaginate.docs

    let data = []
    for (let indexEntity = 0; indexEntity < entities.length; indexEntity++) {
      const entity = entities[indexEntity]

      if (entity.code) {
        const entityCodeLength = entity.code.length
        const isFaskesInBuilding =
          entity.code.substring(entityCodeLength - 3, entityCodeLength) ===
          '_01'
            ? true
            : false

        const faskesToRegency = await models.Entity.findAll({
          where: {
            code: entity.regency_id,
          },
        })

        if (faskesToRegency.length > 0) {
          for (
            let indexFaskes = 0;
            indexFaskes < faskesToRegency.length;
            indexFaskes++
          ) {
            const faskes = faskesToRegency[indexFaskes]

            const customerVendor = await models.CustomerVendor.findOne({
              where: {
                customer_id: entity.id,
                vendor_id: faskes.id,
              },
            })

            const isFaskesRegencyValidate =
              isFaskesInBuilding && faskes.code.length <= 4 ? true : false

            if (
              !customerVendor &&
              entity.id !== faskes.id &&
              !isFaskesRegencyValidate
            ) {
              data.push({
                customer_id: entity.id,
                vendor_id: faskes.id,
              })
            }
          }
        }
      }
    }

    await models.CustomerVendor.bulkCreate(data)

    return res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

export async function faskesToFaskesGenerate(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query

    const options = {
      paginate: Number(paginate),
      page: Number(page),
      where: {
        type: ENTITY_TYPE.FASKES,
      },
    }

    const entitiesPaginate = await models.Entity.paginate(options)
    const entities = entitiesPaginate.docs

    let data = []
    for (let indexEntity = 0; indexEntity < entities.length; indexEntity++) {
      const entity = entities[indexEntity]

      if (entity.code) {
        const entityCodeLength = entity.code.length
        const isFaskesInBuilding = entity.code.substring(
          entityCodeLength - 3,
          entityCodeLength
        )

        if (isFaskesInBuilding === '_01') {
          const faskesInBuildingCode = entity.code.substring(
            0,
            entityCodeLength - 3
          )
          const faskesToFaskes = await models.Entity.findAll({
            where: {
              type: ENTITY_TYPE.FASKES,
              code: faskesInBuildingCode,
            },
          })

          if (faskesToFaskes.length > 0) {
            for (
              let indexFaskes = 0;
              indexFaskes < faskesToFaskes.length;
              indexFaskes++
            ) {
              const faskes = faskesToFaskes[indexFaskes]

              const customerVendor = await models.CustomerVendor.findOne({
                where: {
                  customer_id: entity.id,
                  vendor_id: faskes.id,
                },
              })

              if (!customerVendor && entity.id !== faskes.id) {
                data.push({
                  customer_id: entity.id,
                  vendor_id: faskes.id,
                })
              }
            }
          }
        }
      }
    }

    await models.CustomerVendor.bulkCreate(data)

    return res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

// Base on id kemendagri
const KOTA_BOGOR = '3271'
const KOTA_TANGERANG_SELATAN = '3674'
const KOTA_JAKARTA_SELATAN = '3174'
const KOTA_JAKARTA_TIMUR = '3175'
const KOTA_JAKARTA_PUSAT = '3171'
const KOTA_JAKARTA_BARAT = '3173'
const KOTA_JAKARTA_UTARA = '3172'
const KAB_KEPULAUAN_SERIBU = '3101'

export async function outBuildingGenerate(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query

    const options = {
      paginate: Number(paginate),
      page: Number(page),
      where: {
        type: ENTITY_TYPE.FASKES,
        is_vendor: 0,
      },
    }

    const entitiesPaginate = await models.Entity.paginate(options)
    const entities = entitiesPaginate.docs

    let data = []
    for (let indexEntity = 0; indexEntity < entities.length; indexEntity++) {
      const entity = entities[indexEntity]

      if (!entity.code) {
        continue
      }

      const entityCodeLength = entity.code.length
      const isFaskesInBuilding = entity.code.substring(
        entityCodeLength - 3,
        entityCodeLength
      )

      if (isFaskesInBuilding === '_01') {
        continue
      }

      const regencyId = entity.regency_id

      if (!regencyId) {
        continue
      }

      const faskesEntities = await models.Entity.findAll({
        where: {
          [Op.or]: [{ type: ENTITY_TYPE.KOTA }, { type: ENTITY_TYPE.FASKES }],
          is_vendor: 1,
          regency_id: regencyId,
        },
      })

      if (faskesEntities.length < 1) {
        continue
      }

      for (
        let indexFaskes = 0;
        indexFaskes < faskesEntities.length;
        indexFaskes++
      ) {
        const faskes = faskesEntities[indexFaskes]
        const customerVendor = await models.CustomerVendor.findOne({
          where: {
            customer_id: entity.id,
            vendor_id: faskes.id,
            is_distribution: 0,
            is_consumption: 1,
          },
        })

        if (!customerVendor && entity.id !== faskes.id) {
          data.push({
            customer_id: entity.id,
            vendor_id: faskes.id,
            is_distribution: 0,
            is_consumption: 1,
          })
        }
      }
    }

    await models.CustomerVendor.bulkCreate(data)

    return res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

export async function inBuildingPuskesmasGenerate(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query

    const options = {
      paginate: Number(paginate),
      page: Number(page),
      where: {
        type: ENTITY_TYPE.FASKES,
        is_vendor: 0,
      },
    }

    const entitiesPaginate = await models.Entity.paginate(options)
    const entities = entitiesPaginate.docs

    let data = []
    for (let indexEntity = 0; indexEntity < entities.length; indexEntity++) {
      const entity = entities[indexEntity]

      if (!entity.code) {
        continue
      }

      const entityCodeLength = entity.code.length
      const isFaskesInBuilding = entity.code.substring(
        entityCodeLength - 3,
        entityCodeLength
      )

      if (entity.code.length <= 7) {
        continue
      }

      if (isFaskesInBuilding !== '_01') {
        continue
      }

      const regencyId = entity.regency_id

      if (!regencyId) {
        continue
      }

      const conditionSpesificRegencies = [
        regencyId === KOTA_BOGOR,
        regencyId === KOTA_TANGERANG_SELATAN,
        regencyId === KOTA_JAKARTA_SELATAN,
        regencyId === KOTA_JAKARTA_TIMUR,
        regencyId === KOTA_JAKARTA_PUSAT,
        regencyId === KOTA_JAKARTA_BARAT,
        regencyId === KOTA_JAKARTA_UTARA,
        regencyId === KAB_KEPULAUAN_SERIBU,
      ]

      if (conditionSpesificRegencies.indexOf(true) >= 0) {
        continue
      }

      const faskesInBuildingCode = entity.code.substring(
        0,
        entityCodeLength - 3
      )

      const faskesEntities = await models.Entity.findAll({
        where: {
          code: faskesInBuildingCode,
        },
      })

      if (faskesEntities.length < 1) {
        continue
      }

      for (
        let indexFaskes = 0;
        indexFaskes < faskesEntities.length;
        indexFaskes++
      ) {
        const faskes = faskesEntities[indexFaskes]

        const customerVendor = await models.CustomerVendor.findOne({
          where: {
            customer_id: entity.id,
            vendor_id: faskes.id,
            is_distribution: 0,
            is_consumption: 1,
          },
        })

        if (!customerVendor && entity.id !== faskes.id) {
          data.push({
            customer_id: entity.id,
            vendor_id: faskes.id,
            is_distribution: 0,
            is_consumption: 1,
          })
        }
      }
    }

    await models.CustomerVendor.bulkCreate(data)

    return res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

export async function inBuildingCitiesGenerate(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query

    const options = {
      paginate: Number(paginate),
      page: Number(page),
      where: {
        type: ENTITY_TYPE.FASKES,
        is_vendor: 0,
      },
    }

    const entitiesPaginate = await models.Entity.paginate(options)
    const entities = entitiesPaginate.docs

    let data = []
    for (let indexEntity = 0; indexEntity < entities.length; indexEntity++) {
      const entity = entities[indexEntity]

      if (!entity.code) {
        continue
      }

      const entityCodeLength = entity.code.length
      const isFaskesInBuilding = entity.code.substring(
        entityCodeLength - 3,
        entityCodeLength
      )

      if (entity.code.length !== 7) {
        continue
      }

      if (isFaskesInBuilding !== '_01') {
        continue
      }

      const regencyId = entity.regency_id

      if (!regencyId) {
        continue
      }

      const conditionSpesificRegencies = [
        regencyId === KOTA_BOGOR,
        regencyId === KOTA_TANGERANG_SELATAN,
        regencyId === KOTA_JAKARTA_SELATAN,
        regencyId === KOTA_JAKARTA_TIMUR,
        regencyId === KOTA_JAKARTA_PUSAT,
        regencyId === KOTA_JAKARTA_BARAT,
        regencyId === KOTA_JAKARTA_UTARA,
        regencyId === KAB_KEPULAUAN_SERIBU,
      ]

      if (conditionSpesificRegencies.indexOf(true) >= 0) {
        continue
      }

      const faskesInBuildingCode = entity.code.substring(
        0,
        entityCodeLength - 3
      )

      const faskesEntities = await models.Entity.findAll({
        where: {
          code: faskesInBuildingCode,
        },
      })

      if (faskesEntities.length < 1) {
        continue
      }

      for (
        let indexFaskes = 0;
        indexFaskes < faskesEntities.length;
        indexFaskes++
      ) {
        const faskes = faskesEntities[indexFaskes]

        const customerVendor = await models.CustomerVendor.findOne({
          where: {
            customer_id: entity.id,
            vendor_id: faskes.id,
            is_distribution: 0,
            is_consumption: 1,
          },
        })

        if (!customerVendor && entity.id !== faskes.id) {
          data.push({
            customer_id: entity.id,
            vendor_id: faskes.id,
            is_distribution: 0,
            is_consumption: 1,
          })
        }
      }
    }

    await models.CustomerVendor.bulkCreate(data)

    return res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

export async function inBuildingProvincesGenerate(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query

    const options = {
      paginate: Number(paginate),
      page: Number(page),
      where: {
        type: ENTITY_TYPE.FASKES,
        is_vendor: 0,
      },
    }

    const entitiesPaginate = await models.Entity.paginate(options)
    const entities = entitiesPaginate.docs

    let data = []
    for (let indexEntity = 0; indexEntity < entities.length; indexEntity++) {
      const entity = entities[indexEntity]

      if (!entity.code) {
        continue
      }

      const entityCodeLength = entity.code.length
      const isFaskesInBuilding = entity.code.substring(
        entityCodeLength - 3,
        entityCodeLength
      )

      if (entity.code.length !== 5) {
        continue
      }

      if (isFaskesInBuilding !== '_01') {
        continue
      }

      const regencyId = entity.regency_id

      if (!regencyId) {
        continue
      }

      const conditionSpesificRegencies = [
        regencyId === KOTA_BOGOR,
        regencyId === KOTA_TANGERANG_SELATAN,
        regencyId === KOTA_JAKARTA_SELATAN,
        regencyId === KOTA_JAKARTA_TIMUR,
        regencyId === KOTA_JAKARTA_PUSAT,
        regencyId === KOTA_JAKARTA_BARAT,
        regencyId === KOTA_JAKARTA_UTARA,
        regencyId === KAB_KEPULAUAN_SERIBU,
      ]

      if (conditionSpesificRegencies.indexOf(true) >= 0) {
        continue
      }

      const faskesInBuildingCode = entity.code.substring(
        0,
        entityCodeLength - 3
      )

      const faskesEntities = await models.Entity.findAll({
        where: {
          code: faskesInBuildingCode,
        },
      })

      if (faskesEntities.length < 1) {
        continue
      }

      for (
        let indexFaskes = 0;
        indexFaskes < faskesEntities.length;
        indexFaskes++
      ) {
        const faskes = faskesEntities[indexFaskes]

        const customerVendor = await models.CustomerVendor.findOne({
          where: {
            customer_id: entity.id,
            vendor_id: faskes.id,
            is_distribution: 0,
            is_consumption: 1,
          },
        })

        if (!customerVendor && entity.id !== faskes.id) {
          data.push({
            customer_id: entity.id,
            vendor_id: faskes.id,
            is_distribution: 0,
            is_consumption: 1,
          })
        }
      }
    }

    await models.CustomerVendor.bulkCreate(data)

    return res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

export async function listCustomerXLS(req, res, next) {
  try {
    const condition = []
    const { id } = req.params
    const { is_consumption, entity_tag_id } = req.query

    req.include = [
      {
        association: 'customer',
        attributes: ['id', 'name'],
        required: true,
      },
      {
        association: 'vendor',
        attributes: ['id', 'name'],
        required: true,
      },
    ]

    if (id) {
      condition.push({
        vendor_id: parseInt(id),
      })
    }
    if (entity_tag_id) {
      req.include[0].include = {
        association: 'entity_tags',
        attributes: ['id', 'title'],
        required: true,
        where: { id: entity_tag_id },
      }
    }
    if (typeof is_consumption !== 'undefined') {
      if (parseInt(is_consumption) === 1) {
        condition.push({
          is_consumption: 1,
        })
      } else {
        condition.push({
          is_distribution: 1,
        })
      }
    }

    if (condition.length > 0) req.condition = condition

    req.xlsColumns = [
      { key: 'vendor_id' },
      { key: 'vendor_name', title: 'vendor_name' },
      { key: 'customer_id' },
      { key: 'customer_name', title: 'customer_name' },
    ]

    return next()
  } catch (err) {
    return next(err)
  }
}

export async function destroyPKM(req, res, next) {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const { user } = req

    if (user) {
      req.body.deleted_by = user.id
    }
    let data = await Entity.findByPk(id)
    if (!data) throw { status: 404, message: req.__('404') }
    if (data.type !== ENTITY_TYPE.FASKES)
      throw { status: 404, message: 'Entitas bukan puskesmas' }
    // check order
    let orderCustomer = await Order.count({
      where: {
        customer_id: id,
      },
    })
    let orderVendor = await Order.count({
      where: {
        vendor_id: id,
      },
    })
    if (orderCustomer > 0)
      throw {
        status: 422,
        message: 'Entity telah memiliki order sbg pelanggan',
      }
    if (orderVendor > 0)
      throw { status: 422, message: 'Entity telah memiliki order sbg penyedia' }
    // check transaction
    let transactionEntity = await Transaction.count({
      where: { entity_id: id },
    })
    if (transactionEntity > 0)
      throw { status: 422, message: 'Entity telah memiliki transaksi' }

    await data.update(req.body, { transaction: t })

    await data.setVendors([])
    await data.setCustomers([])
    let userEntity = await User.findAll({ where: { entity_id: id } })
    if (userEntity) {
      userEntity = userEntity.map((el) => {
        return el.id
      })
      await User.destroy({ where: { id: userEntity } }, { transaction: t })
    }

    await data.destroy({ transaction: t })

    await t.commit()

    return res.status(200).json({
      message:
        'berhasil menghapus entitas dan ' + userEntity.length + ' user terkait',
    })
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function updateMappingPKM(req, res, next) {
  const t = await sequelize.transaction()

  try {
    const { id } = req.params
    const { user } = req
    let { regency_id } = req.query
    let entityBody = {}
    if (user) {
      entityBody.updated_by = user.id
    }
    let data = await Entity.findByPk(id)

    if (!data) throw { status: 404, message: req.__('404') }
    if (data.type !== ENTITY_TYPE.FASKES)
      throw { status: 404, message: 'Entitas bukan puskesmas' }

    if (!regency_id) regency_id = null
    let regency = await models.Regency.findOne({ where: { id: regency_id } })
    if (!regency) throw { status: 422, message: 'Kab/Kota tidak terdaftar' }

    let entityRegency = await models.Entity.findOne({
      where: [{ code: regency.id }, { type: ENTITY_TYPE.KOTA }],
    })
    if (!entityRegency)
      throw { status: 422, message: 'Entitas Kab/Kota tidak terdaftar' }

    // check order
    let orderCustomer = await Order.count({
      where: {
        customer_id: id,
      },
    })
    let orderVendor = await Order.count({
      where: {
        vendor_id: id,
      },
    })
    if (orderCustomer > 0)
      throw {
        status: 422,
        message: 'Entity telah memiliki order sbg pelanggan',
      }
    if (orderVendor > 0)
      throw { status: 422, message: 'Entity telah memiliki order sbg penyedia' }
    // check transaction
    let transactionEntity = await Transaction.count({
      where: { entity_id: id },
    })
    if (transactionEntity > 0)
      throw { status: 422, message: 'Entity telah memiliki transaksi' }

    entityBody.province_id = regency.province_id
    entityBody.regency_id = regency_id
    entityBody.sub_district_id = null
    entityBody.village_id = null

    await data.update(entityBody, { transaction: t })

    await data.setVendors([entityRegency.id], { transaction: t })

    await t.commit()

    return res
      .status(200)
      .json({ message: 'berhasil melakukan update entitas' })
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}

export async function updateBPOMKey(req, res, next) {
  try {
    const { page = 1, paginate = 10 } = req.query
    const options = {
      paginate: Number(paginate),
      page: Number(page),
      where: {
        type: ENTITY_TYPE.FASKES,
        is_vendor: 0,
      },
    }
    const entitiesPaginate = await models.Entity.paginate(options)
    const entities = entitiesPaginate.docs
    return res.status(200).json({
      message: 'berhasil melakukan update entitas sbyk ' + entities.length,
    })
  } catch (err) {
    return next(err)
  }
}

export async function submitBPOM(req, res, next) {
  const t = await models.sequelize.transaction()
  try {
    const { id } = req.params
    const { bpom_key } = req.body
    let entity = await models.Entity.findByPk(id)
    if (!entity) throw { status: 404, message: req.__('404') }
    if (entity.bpom_key)
      throw { status: 422, message: 'Entity already submitted at BPOM' }
    await entity.update({ bpom_key: bpom_key })

    await t.commit()
    return res.status(200).json({ message: 'success' })
  } catch (err) {
    await t.rollback()
    return next(err)
  }
}
