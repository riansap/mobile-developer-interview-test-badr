import models from '../../../models'
import { ENTITY_TYPE } from '../../../helpers/constants'
import _ from 'lodash'

export async function generate(req, res, next) {
  const { year, entity_province_id, entity_regency_id } = req.body
  const currentUserId = req.user.id
  let promises = []
  if (entity_province_id) {
    promises.push(handleProvinceLevel(currentUserId, entity_province_id, year, res))
  }
  if (entity_regency_id) {
    for (let regencyId of entity_regency_id) {
      promises.push(handleCityLevel(currentUserId, regencyId, year, res))
    }
  }
  await Promise.all(promises)

  return res.status(200).json({
    'message': 'success',
  })
}

export async function generateYearlyPlanMinMax(req, res, next) {
  const currentYear = new Date().getFullYear()
  const entityRegencies = await models.YearlyPlan.findAll({
    include: {
      model: models.Entity,
      as: 'regency',
      attributes: ['province_id'],
    },
    where: {
      year: currentYear,
    },
  })
  const entityProvinces = await models.Entity.findAll({
    where: {
      province_id: entityRegencies.map(entityRegency => entityRegency.regency.province_id),
      type: ENTITY_TYPE.PROVINSI,
    },
  })
  const regencyIds = entityRegencies.map(entityRegency => entityRegency.entity_regency_id)
  const provinceIds = entityProvinces.map(entityProvince => entityProvince.id)

  const promises = []
  for (let regencyId of regencyIds) {
    promises.push(handleCityLevel(0, regencyId, currentYear, res))
  }
  for (let provinceId of provinceIds) {
    promises.push(handleProvinceLevel(0, provinceId, currentYear, res))
  }

  await Promise.all(promises)
  return 'success'
}

async function handleCityLevel(userId, regencyId, year, res) {
  try {
    let yearlyPlan = await models.YearlyPlan.findOne({
      where: {
        entity_regency_id: regencyId,
        year: year,
      },
    })
    if (!yearlyPlan) {
      throw { status: 404, message: 'Yearly plan not found' }
    }

    await handlePuskesmasLevel(userId, regencyId, year)

    let sqlQueryGetMinMax = `
    SELECT DISTINCT
          emma.id                                          as emma_id,
          yp.id                                            as yearly_plan_id,
          SUM(COALESCE(ychr.monthly_need, 0))              as min,
          SUM(COALESCE(ychr.monthly_need, 0)*2)  		       as max,
          :userId                                          as created_by,
          :userId                                          as updated_by,
          yp.year                                          as year
      FROM yearly_plans yp
      JOIN yearly_child yc ON yp.id = yc.yearly_plan_id
      JOIN yearly_child_has_results ychr ON yc.id = ychr.yearly_child_id
      JOIN entity_has_master_materials ehmm ON yp.entity_regency_id = ehmm.entity_id  AND ychr.master_material_id = ehmm.master_material_id
      JOIN entity_master_material_activities emma ON ehmm.id = emma.entity_master_material_id AND emma.activity_id = ychr.activity_id
      WHERE yp.entity_regency_id = :regencyId AND yp.year = :year
      GROUP BY emma.id`

    let records = await models.sequelize.query(sqlQueryGetMinMax, {
      type: models.sequelize.QueryTypes.SELECT,
      replacements: {
        userId,
        regencyId,
        year,
      },
    })

    await insertMinMax(records)

    if (year >= new Date().getFullYear()) {
      let ids = _.keys(_.groupBy(records, 'emma_id'))
      await updateMinMaxCityAndProvince(ids)
    }
  } catch (error) {
    console.log('error handleCityLevel', error)
  }
}

async function handleProvinceLevel(currentUserId, provinceId, year, res) {
  try {
    let provinceEntity = await models.Entity.findOne({
      where: {
        province_id: provinceId,
        type: ENTITY_TYPE.PROVINSI,
      },
    })
    if (!provinceEntity) {
      throw { status: 404, message: 'Entity Province not found' }
    }
    let regencies = await models.Entity.findAll({
      attributes: ['id'],
      where: {
        province_id: provinceEntity.province_id,
        type: ENTITY_TYPE.KOTA,
        is_vendor: 1
      },
    })

    let yearlyPlans = await models.YearlyPlan.findAll({
      where: {
        entity_regency_id: regencies.map((item) => item.id),
        year: year,
      },
    })
    let regencyIds = yearlyPlans.map((item) => item.entity_regency_id)

    let sqlQueryGetMinMax = `
    SELECT 
        emm_minmax.yearly_plan_id,
        sum(emm_minmax.min) as min, sum(emm_minmax.max) as max,
        emma2.activity_id, ehmm2.master_material_id,
        ehmm2.entity_id, emm_minmax.year
      FROM entity_master_material_minmax emm_minmax
      JOIN entity_master_material_activities emma2 ON emm_minmax.emma_id = emma2.id
      JOIN entity_has_master_materials ehmm2 ON emma2.entity_master_material_id = ehmm2.id
      WHERE ehmm2.entity_id in (:regencyIds) AND emm_minmax.year = :year GROUP BY ehmm2.master_material_id, emma2.activity_id
    `

    let sqlQueryGetIds = `
    SELECT
        DISTINCT emma.id as emma_id,
          :userId as created_at,
          :userId as updated_at,
          emma.activity_id,
          ehmm.master_material_id
      FROM entity_master_material_activities emma
      JOIN entity_has_master_materials ehmm ON emma.entity_master_material_id = ehmm.id
      WHERE ehmm.entity_id = :entityProvinceId AND emma.activity_id is not NULL and emma.deleted_at is NULL 
      and ehmm.deleted_at is NULL GROUP by emma.id
    `

    let resultMinMax = await models.sequelize.query(sqlQueryGetMinMax, {
      type: models.sequelize.QueryTypes.SELECT,
      replacements: {
        year,
        regencyIds: regencyIds
      }
    })

    let result = await models.sequelize.query(sqlQueryGetIds, {
      type: models.sequelize.QueryTypes.SELECT,
      replacements: {
        year,
        entityProvinceId: provinceEntity.id,
        userId: currentUserId
      },
    })

    /*let min = resultMinMax ? resultMinMax.reduce((acc, cur) => acc + cur.min, 0) : 0
    let max = resultMinMax ? resultMinMax.reduce((acc, cur) => acc + cur.max, 0) : 0 */
    let records = result.map(res => {
      const {min, max, year, yearly_plan_id} = getSummaryMinMax(resultMinMax, res.activity_id, res.master_material_id)
      return {
        emma_id: res.emma_id,
        min,
        max,
        yearly_plan_id,
        created_by: currentUserId,
        updated_by: currentUserId,
        year
      }
    })

    
    records = records.filter(it=> it.year != null && it.yearly_plan_id != null)

    await insertMinMax(records)

    if (year >= new Date().getFullYear()) {
      let ids = _.keys(_.groupBy(records, 'emma_id'))
      await updateMinMaxCityAndProvince(ids)
    }

  } catch (error) {
    console.log('error handleProvinceLevel', error)
  }
}

function getSummaryMinMax(data, activity_id, master_material_id){
  let min =0, max = 0, year = null, yearly_plan_id = null
  for(let item of data.filter(it=> it.activity_id == activity_id && it.master_material_id == master_material_id)){
    min += Number(item.min)
    max += Number(item.min) * 3
    year = item.year
    yearly_plan_id = item.yearly_plan_id
  }

  return {
    min, max, year, yearly_plan_id
  }
}

async function handlePuskesmasLevel(userId, regencyId, year) {
  let currentYear = new Date().getFullYear()
  if (year >= currentYear) {
    await models.sequelize.query(`
    UPDATE entity_master_material_activities emma
    INNER JOIN (
        SELECT DISTINCT emma.id,
               COALESCE(ychr.weekly_need, 0)                     as min,
               COALESCE(ychr.monthly_need + ychr.weekly_need, 0) as max,
               yp.entity_regency_id                              as entity_regency_id,
               yp.year                                           as year
        FROM yearly_child_has_results ychr
           JOIN yearly_child yc ON ychr.yearly_child_id = yc.id
           JOIN yearly_plans yp ON yc.yearly_plan_id = yp.id
           JOIN entity_has_master_materials ehmm
                ON ychr.master_material_id = ehmm.master_material_id AND yc.entity_id = ehmm.entity_id
           JOIN entity_master_material_activities emma
                on ehmm.id = emma.entity_master_material_id AND emma.activity_id = ychr.activity_id) da
        ON da.id = emma.id
    SET emma.min   = da.min,
        emma.max   = da.max,
        updated_at = NOW()
    WHERE da.entity_regency_id = :regencyId
      AND da.year = :year`, {
      replacements: {
        regencyId,
        year,
      },
    })
  }
  const sqlQueryGetMinMax = `
    SELECT DISTINCT emma.id                                            as emma_id,
           yp.id                                              as yearly_plan_id,
           COALESCE(ychr.weekly_need, 0)                      as min,
           COALESCE(ychr.monthly_need + ychr.weekly_need, 0)  as max,
           :userId                                            as created_by,
           :userId                                            as updated_by,
           yp.year                                            as year
    FROM yearly_child_has_results ychr
       JOIN yearly_child yc ON ychr.yearly_child_id = yc.id
       JOIN yearly_plans yp ON yc.yearly_plan_id = yp.id
       JOIN entity_has_master_materials ehmm
            ON ychr.master_material_id = ehmm.master_material_id AND yc.entity_id = ehmm.entity_id
       JOIN entity_master_material_activities emma
            on ehmm.id = emma.entity_master_material_id AND emma.activity_id = ychr.activity_id
    WHERE yp.entity_regency_id = :regencyId
      AND yp.year = :year`
  let records = await models.sequelize.query(sqlQueryGetMinMax, {
    type: models.sequelize.QueryTypes.SELECT,
    replacements: {
      regencyId,
      year,
      userId,
    },
  })

  await insertMinMax(records)
}

async function insertMinMax(records) {
  if (records.length === 0) return
  let exists = await models.sequelize.query(`
    SELECT emma_id, yearly_plan_id
    FROM entity_master_material_minmax
    WHERE (emma_id, yearly_plan_id) IN (${records.map(() => '(?, ?)').join(', ')})`, {
    replacements: records.flatMap(record => [
      record.emma_id,
      record.yearly_plan_id,
    ]),
    type: models.sequelize.QueryTypes.SELECT,
  })

  let notExistRecords = records.filter(record => {
    return !exists.find(item => item.emma_id === record.emma_id && item.yearly_plan_id === record.yearly_plan_id)
  })
  let existRecords = records.filter(record => {
    return exists.find(item => item.emma_id === record.emma_id && item.yearly_plan_id === record.yearly_plan_id)
  })
  if (notExistRecords.length !== 0) {
    await models.sequelize.query(`INSERT INTO entity_master_material_minmax(emma_id, yearly_plan_id, min, max, created_by, updated_by, year)
    VALUES ${notExistRecords.map(() => '(?, ?, ?, ?, ?, ?,?)').join(', ')};`, {
      replacements: notExistRecords.flatMap(record => [
        record.emma_id,
        record.yearly_plan_id,
        record.min,
        record.max,
        record.created_by,
        record.updated_by,
        record.year
      ]),
      type: models.sequelize.QueryTypes.INSERT,
    })
  }
  await Promise.all(existRecords.map(async (record) => {
    await models.sequelize.query(`UPDATE entity_master_material_minmax
    SET min = ?, max = ?, updated_by = ?, updated_at = NOW()
    WHERE (emma_id, yearly_plan_id) IN ((?, ?))`, {
      replacements: [
        record.min,
        record.max,
        record.updated_by,
        record.emma_id,
        record.yearly_plan_id,
      ],
      type: models.sequelize.QueryTypes.UPDATE,
    })
  }))
}

async function updateMinMaxCityAndProvince(ids) {
  if (ids.length === 0) return
  let sqlUpdate = `
    UPDATE entity_master_material_activities emma
    INNER JOIN (
      SELECT * FROM entity_master_material_minmax emm_minmax ORDER BY emm_minmax.year DESC
    ) da ON da.emma_id = emma.id
    SET emma.min = da.min, emma.max = da.max, emma.updated_at = NOW()
    WHERE emma.id IN (${ids.join(',')})`
  await models.sequelize.query(sqlUpdate, {
    type: models.sequelize.QueryTypes.UPDATE,
    replacements: {
    },
  })
}
