import models from '../models'
import { ENTITY_TYPE, USER_ROLE } from '../helpers/constants'
import { QueryTypes } from 'sequelize'

const sequelize = models.sequelize

export async function list(req, res, next) {
  try {
    const { role, entity } = req.user
    let { year, province, page, limit } = req.query
    let entityId = entity.id

    if ((role === USER_ROLE.MANAGER || role === USER_ROLE.MANAGER_COVID) && entity.type === ENTITY_TYPE.PROVINSI) {
      province = entity.province_id
      entityId = null
    } else if (role === USER_ROLE.SUPERADMIN || role === USER_ROLE.ADMIN) {
      entityId = null
    }

    let query = getPlansQuery(entityId)
    let plans = await sequelize.query(query, {
      type: QueryTypes.SELECT,
      plain: false,
      logging: false,
      replacements: {
        year: year,
        provinceId: province,
        entity: entityId,
      },
    })
    let provinceSummary = await getProvinceSummary(plans, year)
    let pagedPlans = pageList(provinceSummary, plans, page, limit)
    return res.json({
      meta: {
        page: pagedPlans.page,
        limit: pagedPlans.limit,
        total: plans.length,
      },
      data: pagedPlans,
    })
  } catch (err) {
    console.log(err)
    return next(err)
  }
}

function getPlansQuery(entities = null) {
  let query = `select yearly_plans.year as year,
                       entities.name as entity,
                       entities.id as entity_id,
                       regencies.name as regency,
                       regencies.id as regency_id,
                       provinces.name as province,
                       provinces.id as province_id,
                       yearly_plans.status as status,
                       (SELECT emmm.updated_at FROM entity_master_material_minmax emmm WHERE yearly_plan_id = yearly_plans.id AND year = :year LIMIT 1) as min_max_generated_time
                 from yearly_plans
                left join entities on entities.id = yearly_plans.entity_regency_id
                left join provinces on entities.province_id = provinces.id
                left join regencies on entities.regency_id = regencies.id
                where year = :year and entities.province_id = :provinceId and yearly_plans.status is not null`

  if (entities) {
    query += ` and entities.id = :entity`
  }

  return query
}

async function getProvinceSummary(plans, year) {
  if (plans.length === 0) return {}
  let approvedTotal = 0, approvedStatus = 'not approved', totalStatus = 0, statusProvince = false

  plans.map(plan => {
    if (plan.status === 'disetujui') {
      approvedTotal++
    }

    if (plan.min_max_generated_time){
      totalStatus++
    }
  })

  if (approvedTotal === plans.length) {
    approvedStatus = 'approved'
  }

  if (totalStatus == plans.length){
    statusProvince = true
  }

  let QueryProvince = `SELECT
        DISTINCT et.id, et.name, emm_minmax.updated_at
      FROM entities et
      LEFT JOIN entity_has_master_materials ehmm ON et.id = ehmm.entity_id
      LEFT JOIN entity_master_material_activities emma ON ehmm.id = emma.entity_master_material_id
      LEFT JOIN entity_master_material_minmax emm_minmax ON emma.id = emm_minmax.emma_id
      WHERE et.province_id = :provinceId AND et.type = 1 AND et.is_vendor = 1 AND emm_minmax.year = :year ORDER BY emm_minmax.updated_at DESC LIMIT 1
  `
  const entityProvince = await sequelize.query(QueryProvince, {
    type: QueryTypes.SELECT,
    plain: false,
    logging: false,
    replacements: {
      year: year,
      provinceId: plans[0].province_id
    },
    logging: true
  })


  const { id, updated_at } = entityProvince.length > 0 ? entityProvince[0] : {}

  return {
    entity_id: id || null,
    province: plans[0].province,
    province_id: plans[0].province_id,
    approval_status: approvedStatus,
    min_max_generated_time: updated_at || null,
    status_province: statusProvince
  }
}
function pageList(provinceSummary, plans, page, limit) {
  if (plans.length === 0) return list
  if (!page) page = 1
  if (!limit) limit = 10

  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  return {
    list: plans.slice(startIndex, endIndex),
    province: provinceSummary,
    page: page,
    limit: limit,
  }

}
