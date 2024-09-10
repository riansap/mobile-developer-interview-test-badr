import models from '../../models'
import { QueryTypes } from 'sequelize'
import moment from 'moment'
import { SUMMARY_BOX_ENTITY_TYPES } from '../constants'

const { Entity, Province, Regency } = models

const sequelizeWH = models.sequelizeWH
const sequelize = models.sequelize

const getRegions = async (queryParam, lastRow = 0) => {
  let {
    entityIds,
    provinceIds,
    regencyIds
  } = queryParam

  let regions = []

  let where = {}
  let attribute = ['id', 'name']
  if (Array.isArray(entityIds) && entityIds.length > 0) {
    where.is_vendor = 1
    if (!provinceIds) {
      if (!queryParam.entityTags && !queryParam.entityIds) {
        throw Error('Province is empty!')
      }
    } else {
      where.province_id = provinceIds
    }
    if (!regencyIds) {
      if (!queryParam.entityTags && !queryParam.entityIds) {
        throw Error('Regency is empty!')
      }
    } else {
      where.regency_id = regencyIds
    }

    where.id = entityIds

    let option = {
      where: where,
      attribute: attribute
    }

    await Entity.findAll(option)
      .then(entities => {
        if (Array.isArray(entities) && entities.length > 0) {
          entities.forEach((entity, row) => {
            regions.push({
              id: entity.id,
              rowNumber: row + 1 + lastRow,
              label: entity.name,
              provinceId: entity.province_id,
              regencyId: entity.regency_id,
              subDistrictId: entity.sub_district_id,
              entityType: 3
            })
          })
        }
      })
  } else if (Array.isArray(regencyIds) && regencyIds.length > 0) {
    where.is_vendor = 1
    if (!provinceIds) {
      if (!queryParam.entityTags && !queryParam.entityIds) {
        throw Error('Province is empty!')
      }
    } else {
      where.province_id = provinceIds
    }
    if (!regencyIds) {
      if (!queryParam.entityTags && !queryParam.entityIds) {
        throw Error('Regency is empty!')
      }
    } else {
      where.regency_id = regencyIds
    }
    where.type = 3

    let option = {
      where: where,
      attribute: attribute
    }

    await Entity.findAll(option)
      .then(entities => {
        if (Array.isArray(entities) && entities.length > 0) {
          entities.forEach((entity, row) => {
            regions.push({
              id: entity.id,
              rowNumber: row + 1 + lastRow,
              label: entity.name,
              provinceId: entity.province_id,
              regencyId: entity.regency_id,
              subDistrictId: entity.sub_district_id,
              entityType: 3
            })
          })
        }
      })
  } else if (Array.isArray(provinceIds) && provinceIds.length > 0) {
    if (!provinceIds)
      if (!queryParam.entityIds)
        throw Error('Province is empty!')

    where.province_id = provinceIds
    let option = {
      where: where,
      attribute: attribute
    }

    await Regency.findAll(option)
      .then(regencies => {
        if (Array.isArray(regencies) && regencies.length > 0) {
          regencies.forEach((regency, row) => {
            regions.push({
              id: regency.id,
              rowNumber: row + 1 + lastRow,
              label: regency.name,
              provinceId: regency.province_id,
              regencyId: regency.id,
              subDistrictId: null,
              entityType: 2
            })
          })
        }
      })
  } else {
    let option = {
      attribute: attribute
    }

    await Province.findAll(option)
      .then(provinces => {
        if (Array.isArray(provinces) && provinces.length > 0) {
          provinces.forEach((province, row) => {
            regions.push({
              id: province.id,
              rowNumber: row + 1 + lastRow,
              label: province.name,
              provinceId: province.id,
              regencyId: null,
              subDistrictId: null,
              entityType: 1
            })
          })
        }
      })
  }

  return regions
}

const expirationDateValidation = (startExpirationDate, endExpirationDate) => {
  if (startExpirationDate && !endExpirationDate) endExpirationDate = startExpirationDate
  if (!startExpirationDate && endExpirationDate) startExpirationDate = endExpirationDate
  if (startExpirationDate && endExpirationDate) {
    if (!moment(startExpirationDate).isValid() || !moment(endExpirationDate).isValid()) {
      throw Error('Invalid expiration date')
    } else {
      startExpirationDate = startExpirationDate ? moment(startExpirationDate).format('YYYY-MM-DD 00:00:00') : null
      endExpirationDate = startExpirationDate ? moment(endExpirationDate).format('YYYY-MM-DD 23:59:59') : null
    }
  }
  if (startExpirationDate > endExpirationDate) throw Error('Invalid expiration date range')
  return { startExpirationDate, endExpirationDate }
}

const dateValidation = (from, to) => {
  if (!from) {
    from = '2021-01-01'
  }
  if (!to) {
    to = moment().format('YYYY-MM-DD')
  }
  if (!from || !to) {
    throw Error('Empty start date and/or end date')
  } else {
    if (!moment(from).isValid() || !moment(to).isValid()) {
      throw Error('Invalid start date and/or end date')
    } else {
      from = moment(from).format('YYYY-MM-DD 00:00:00')
      to = moment(to).format('YYYY-MM-DD 23:59:59')
    }
  }
  if (from > to) throw Error('Invalid date range')
  return { from, to }
}

const getUserRegion = (user, param) => {
  let provinceId = null,
    regencyId = null,
    subDistrictId = null
  if (user.role == 1 || user.role == 2) {
    provinceId = param.provinceIds
    regencyId = param.regencyIds
    subDistrictId = param.subDistrictIds
  } else {
    if (user.entity.type == 1) {
      provinceId = user.entity.provinceId
      regencyId = param.regencyIds
      subDistrictId = param.subDistrictIds
    } else if (user.entity.type == 2) {
      provinceId = user.entity.provinceId
      regencyId = user.entity.regencyId
      subDistrictId = param.subDistrictIds
    } else {
      subDistrictId = param.subDistrictIds
    }
  }

  return {
    provinceId: provinceId,
    regencyId: regencyId,
    subDistrictId: subDistrictId
  }
}

const materialValidation = (materialIds, materialFromTag) => {
  materialIds = materialIds ? parsingArrIds(materialIds) : []
  for (let materialId of materialIds) {
    if (isNaN(materialId)) throw Error('Invalid material')
  }
  if (materialIds.length > 0 && materialFromTag.length > 0) {
    materialIds = materialIds.filter(value => {
      return materialFromTag.includes(value)
    })
    materialIds = materialIds.length == 0 ? [null] : materialIds
  } else if (materialIds.length == 0 && materialFromTag.length > 0) {
    materialIds = materialFromTag
  }
  return materialIds
}

const getResponseTransactions = (regionTransactions, regionRemainingStock, regionOverdue, region, isSimpleDashboard = false) => {
  let transactions = regionTransactions[0]
  let remainingStock = regionRemainingStock[0]
  let overdueStock = regionOverdue[0]

  const intRemainingStock = remainingStock ? remainingStock.qty : 0
  const intOverdueStock = overdueStock ? overdueStock.qty : 0

  remainingStock.qty = parseInt(intRemainingStock) - parseInt(intOverdueStock)

  if (remainingStock?.entityType == 97) {
    remainingStock.qty = 0
  }

  if (isSimpleDashboard) {
    let distribution = (Math.abs(transactions?.received_distribution) || 0)
      + (Math.abs(transactions?.not_received_distribution) || 0)
      + (Math.abs(transactions?.canceled_distribution) || 0)
      - (Math.abs(transactions?.receipt_of_return) || 0)
    let receipt = (Math.abs(transactions?.receipt_from_kemenkes) || 0)
      + (Math.abs(transactions?.receipt_from_dinkes) || 0)
      - (Math.abs(transactions?.received_distribution_return) || 0)
      - (Math.abs(transactions?.not_received_distribution_return) || 0)
    return {
      no: region.rowNumber,
      id: region.id,
      entity_type: region.entityType,
      recipient: region.label,
      distribution: distribution,
      distribution_code: 2,
      receipt: receipt,
      receipt_code: 3,
      consumption: Math.abs(transactions?.consumption) || 0,
      consumption_code: 41,
      defect: Math.abs(transactions?.defect) || 0,
      final_stock: Math.abs(remainingStock?.qty) || 0
    }
  } else {
    return {
      no: region.rowNumber,
      id: region.id,
      entity_type: region.entityType,
      recipient: region.label,
      provinceId: region.provinceId,
      regencyId: region.regencyId,
      subDistrictId: region.subDistrictId,
      receipt_from_kemenkes: Math.abs(transactions?.receipt_from_kemenkes) || 0,
      receipt_from_kemenkes_code: 11,
      receipt_from_dinkes: Math.abs(transactions?.receipt_from_dinkes) || 0,
      receipt_from_dinkes_code: 12,
      receipt_from_faskes: Math.abs(transactions?.receipt_from_faskes) || 0,
      receipt_from_faskes_code: 13,
      receipt_of_return: Math.abs(transactions?.receipt_of_return) || 0,
      receipt_of_return_code: 14,
      received_distribution: Math.abs(transactions?.received_distribution) || 0,
      received_distribution_code: 22,
      not_received_distribution: Math.abs(transactions?.not_received_distribution) + Math.abs(transactions?.canceled_distribution) || 0,
      not_received_distribution_code: 21,
      received_distribution_return: Math.abs(transactions?.received_distribution_return) || 0,
      received_distribution_return_code: 32,
      not_received_distribution_return: Math.abs(transactions?.not_received_distribution_return) || 0,
      not_received_distribution_return_code: 31,
      consumption: Math.abs(transactions?.consumption) || 0,
      consumption_code: 41,
      defect: Math.abs(transactions?.defect) || 0,
      final_stock: Math.abs(remainingStock?.qty) || 0
    }
  }
}


const materialTagValidation = async (materialTags) => {
  let materialFromTag = []
  if (materialTags) {
    materialTags = parsingArrIds(materialTags)
    for (let materialTag of materialTags) {
      if (isNaN(materialTag)) throw Error('Invalid material')
    }
    await MaterialMaterialTag
      .findAll({
        where: { material_tag_id: materialTags },
        attributes: ['material_id']
      })
      .then(materials => {
        if (Array.isArray(materials) && materials.length > 0) {
          materials.forEach(material => materialFromTag.push(material.material_id))
        }
      })
  }
  return materialFromTag
}

const entityTagValidation = async (entityTags) => {
  let entityFromTag = []
  if (entityTags) {
    entityTags = parsingArrIds(entityTags)
    for (let entityTag of entityTags) {
      if (isNaN(entityTag)) throw Error('Invalid Entity')
    }
    await EntityEntityTag
      .findAll({
        where: { entity_tag_id: entityTags },
        attributes: ['entity_id']
      })
      .then(entities => {
        if (Array.isArray(entities) && entities.length > 0) {
          entities.forEach(entity => entityFromTag.push(entity.entity_id))
        }
      })
  }
  return entityFromTag
}

const entityValidation = (entityIds, entityFromTag) => {
  entityIds = entityIds ? parsingArrIds(entityIds) : []
  for (let entityId of entityIds) {
    if (isNaN(entityId)) throw Error('Invalid entity')
  }
  if (entityIds.length > 0 && entityFromTag.length > 0) {
    entityIds = entityIds.filter(value => {
      return entityFromTag.includes(value)
    })
    entityIds = entityIds.length == 0 ? [null] : entityIds
  } else if (entityFromTag.length > 0) {
    entityIds = entityFromTag
  }
  return entityIds
}

const entityTypeValidation = (entityTypes) => {
  if (entityTypes) {
    entityTypes = parsingArrIds(entityTypes)
    for (let entityType of entityTypes) {
      if (isNaN(entityType)) throw Error('Invalid entity type')
      let checkType = SUMMARY_BOX_ENTITY_TYPES.find(data => {
        return data.id == entityType
      })
      if (!checkType) throw Error('Invalid entity type')
    }
  }
  return entityTypes
}

const vaccineValidation = (isVaccine) => {
  if (!isVaccine) isVaccine = []
  else isVaccine = parsingArrIds(isVaccine)
  //if (!isVaccine.includes(1) && !isVaccine.includes(0)) throw Error('Invalid vaccine type')
  return isVaccine
}

const paginate = (array, limit, page) => {
  return array.slice((page - 1) * limit, page * limit)
}

const parsingArrIds = (str) => {
  let result = String(str).split(',')
  result = result.map(item => Number(String(item).trim()))
  return result
}


export async function getValidatedFilter({ user, query }) {
  let {
    from,
    to,
    batch,
    startExpirationDate,
    endExpirationDate,
    materialIds,
    materialTags,
    activityId,
    entityTags,
    entityIds,
    provinceIds,
    regencyIds,
    subDistrictIds,
    entityTypes,
    isVaccine,
    detailId,
    detailEntityType,
    transactionCode,
    page,
    limit
  } = query

  let userRegion = getUserRegion(user, query)
  provinceIds = userRegion.provinceId
  regencyIds = userRegion.regencyId
  subDistrictIds = userRegion.subDistrictId

  from = dateValidation(from, to).from
  to = dateValidation(from, to).to

  startExpirationDate = expirationDateValidation(startExpirationDate, endExpirationDate).startExpirationDate
  endExpirationDate = expirationDateValidation(startExpirationDate, endExpirationDate).endExpirationDate

  let materialFromTag = await materialTagValidation(materialTags)
  materialIds = materialValidation(materialIds, materialFromTag)

  let entityFromTag = await entityTagValidation(entityTags)
  if (!entityIds && entityFromTag.length > 0) {
    entityIds = entityFromTag
  } else {
    entityIds = entityValidation(entityIds, entityFromTag)
  }

  entityTypes = entityTypeValidation(entityTypes)
  isVaccine = vaccineValidation(isVaccine)
  activityId = activityId ? parsingArrIds(activityId) : [null]

  if (subDistrictIds) {
    if (!regencyIds) throw Error('Empty regency')
    if (!provinceIds) throw Error('Empty province')
    subDistrictIds = parsingArrIds(subDistrictIds) || []
    for (let subDistrictId of subDistrictIds) {
      if (isNaN(subDistrictId)) throw Error('Invalid sub district')
    }
  }
  if (regencyIds) {
    if (!provinceIds) throw Error('Empty province')
    regencyIds = parsingArrIds(regencyIds) || []
    for (let regencyId of regencyIds) {
      if (isNaN(regencyId)) throw Error('Invalid regency')
    }
  }
  if (provinceIds) {
    provinceIds = parsingArrIds(provinceIds) || []
    for (let provinceId of provinceIds) {
      if (isNaN(provinceId)) throw Error('Invalid province')
    }
  }

  if (detailId) detailId = parseInt(detailId)

  if (transactionCode) transactionCode = parseInt(transactionCode)

  if (detailEntityType) detailEntityType = parseInt(detailEntityType)

  let regionSelector = 'entityProvinceId'
  if (Array.isArray(entityIds) && entityIds.length > 0) {
    regionSelector = 'entityId'
  } else if (regencyIds) {
    regionSelector = 'entityId'
  } else if (provinceIds) {
    regionSelector = 'entityRegencyId'
  }

  if (!page) page = 1
  if (!limit) limit = 10

  return {
    from,
    to,
    startExpirationDate,
    endExpirationDate,
    batch,
    materialIds,
    entityIds,
    provinceIds,
    regencyIds,
    subDistrictIds,
    regionSelector,
    entityTypes,
    isVaccine,
    activityId,
    detailId,
    transactionCode,
    detailEntityType,
    page,
    entityTags,
    limit
  }
}

const getParents = async (queryParam) => {
  let parents = []
  let lastRow = 0
  let {
    provinceIds,
    regencyIds,
    entityIds,
  } = queryParam

  let where = {}
  let attribute = ['id', 'name', 'type']

  if (Array.isArray(entityIds) && entityIds.length > 0) {
    return {
      parents: [],
      lastRow: 0
    }
  } else if (Array.isArray(regencyIds) && regencyIds.length > 0) {
    where.province_id = provinceIds
    where.regency_id = regencyIds
    where.type = 2
    where.is_vendor = 1
  } else if (Array.isArray(provinceIds) && provinceIds.length > 0) {
    where.province_id = provinceIds
    where.type = 1
    where.is_vendor = 1
  } else {
    where.type = [97, 98, 95]
    where.is_vendor = 1
  }

  let option = {
    where: where,
    attribute: attribute
  }

  await Entity.findAll(option)
    .then(entities => {
      if (Array.isArray(entities) && entities.length > 0) {
        entities.forEach((entity, row) => {
          parents.push({
            id: entity.id,
            rowNumber: row + 1,
            label: entity.name,
            provinceId: entity.province_id,
            regencyId: entity.regency_id,
            subDistrictId: entity.sub_district_id,
            entityType: null,
            sortingType: entity.type
          })
          lastRow = row + 1
        })
      }
    })

  if (parents.length > 1 && !provinceIds) {
    let nationalParents = [97, 98, 95]
    let parentsTemp = []
    nationalParents.forEach((data, index) => {
      let parent = parents.find(parent => {
        return parent.sortingType == data
      })
      parent.rowNumber = index + 1
      parentsTemp.push(
        parent
      )
    })
    parents = parentsTemp
  }

  return {
    parents,
    lastRow
  }
}


export const getTransactionTableData = async (req, isSimpleDashboard = false) => {
  const date = moment()
  let queryParam = await getValidatedFilter(req)

  let response = []
  let { lastRow } = await getParents(queryParam)

  let regions = await getRegions(queryParam, lastRow)
  let regionsTransactions = await getTransactions(queryParam, queryParam.regionSelector)
  let regionsRemainingStocks = await getRemainingStock(queryParam) //await getRemainingStock(queryParam, queryParam.regionSelector)
  let regionOverdues = await getOverdue(queryParam, queryParam.regionSelector)
  for (let region of regions) {
    let regionTransaction = regionsTransactions.filter(transaction => {
      return transaction['regionId'] == region.id
    })
    let regionRemainingStock = regionsRemainingStocks.filter(stock => {
      return stock['regionId'] == region.id
    })
    let regionOverdue = regionOverdues.filter(stock => {
      return stock['regionId'] == region.id
    })
    response.push(getResponseTransactions(regionTransaction, regionRemainingStock, regionOverdue, region, isSimpleDashboard))
  }

  let result = {}
  let totalData = response.length
  response = paginate(response, queryParam.limit, queryParam.page)
  result.date = date
  result.data = response
  result.total_data = totalData
  result.current_Page = parseInt(queryParam.page)
  result.total_page = Math.ceil(totalData / queryParam.limit)

  return convertTransactionTableDataV1(result)
}


const getTransactionFilter = (queryParam, parentIds, isSummaryBox = false) => {
  let {
    filter,
    regionEntityClause
  } = getGeneralFilter(queryParam)

  if (parentIds.length > 0) {
    filter += ' and entityId in (:parentIds)'
    queryParam.parentIds = parentIds
  } else {
    if (queryParam.entityIds?.length > 0) {
      filter += ' and entityId in (:entityIds)'
      regionEntityClause += ''
    } else if (queryParam.regencyIds?.length > 0) {
      filter += isSummaryBox ? ' and entityType in (2, 3)' : ' and entityType in (3)'
      regionEntityClause += ' and entityType in (3)'
    } else if (queryParam.provinceIds?.length > 0) {
      filter += isSummaryBox ? ' and entityType in (1, 2, 3)' : ' and entityType in (2, 3)'
      regionEntityClause += ' and entityType in (2)'
    } else {
      filter += isSummaryBox ? ' and entityType in (1, 2, 3, 97, 98, 95)' : ' and entityType in (1, 2, 3)'
      regionEntityClause += ' and entityType in (1)'
    }
  }

  return {
    filter,
    regionEntityClause
  }
}

const getGeneralFilter = (queryParam) => {
  let filter = ''
  if (Array.isArray(queryParam.provinceIds) && queryParam.provinceIds.length > 0)
    filter += ' and entityProvinceId in (:provinceIds)'
  if (Array.isArray(queryParam.regencyIds) && queryParam.regencyIds.length > 0)
    filter += ' and entityRegencyId in (:regencyIds)'
  if (Array.isArray(queryParam.subDistrictIds) && queryParam.subDistrictIds.length > 0)
    filter += ' and entitySubDistrictId in (:subDistrictIds)'

  if (queryParam.batch)
    filter += ' and batchCode=:batch'
  else if (queryParam.startExpirationDate && queryParam.endExpirationDate)
    filter += ' and expiredBatch between :startExpirationDate and :endExpirationDate'

  if (Array.isArray(queryParam.materialIds) && queryParam.materialIds.length > 0)
    filter += ' and master_material_id in (:materialIds)'

  if (Array.isArray(queryParam.entityIds) && queryParam.entityIds.length > 0)
    filter += ' and entityId in (:entityIds)'

  if (queryParam.entityTypes?.length > 0) {
    if (queryParam.entityTypes.includes(30)) {
      queryParam.entityTypes.push(3)
    }
    filter += ' and entityType in (:entityTypes)'
  }

  if (queryParam.isVaccine.length > 0) {
    filter += ' and master_material_is_vaccine in (:isVaccine)'
  }

  if (queryParam.activityId.length > 0) {
    if (queryParam.remainingStock) {
      filter += ' and stocks_activity_id in (:activityId)'
    } else {
      filter += ' and activity_id in (:activityId)'
    }
  }

  let regionEntityClause = ''

  return {
    filter,
    regionEntityClause
  }
}


const getTransactions = async (queryParam, regionSelector, parentIds = [], isSummaryBox = false) => {
  let {
    filter,
    regionEntityClause
  } = isSummaryBox ? getGeneralFilter(queryParam) : getTransactionFilter(queryParam, parentIds)
  let indexGabungan = queryParam.provinceIds?.length > 0 ? 'use index(gabungan)' : ''
  let query = `select ${regionSelector} as regionId,
                            entityType,
                            case
                               when entityType = 3 and entityIsPuskesmas = 0 then 30
                               else entityType end as newEntityType,
                            case 
                                when entityType = 97 then 'Kemenkes RI'
                                when entityType = 98 then 'Gudang Vaksin'
                                when entityType = 1 then 'Dinkes Provinsi'
                                when entityType = 2 then 'Dinkes Kab/Kota'
                                when entityType = 3 then 'Puskesmas'
                                when entityType = 30 then 'TNI, Polri, RS, KKP'
                                else '' end as entityTypeName,
                            case 
                                when entityType = 97 then 1
                                when entityType = 98 then 2
                                when entityType = 1 then 3
                                when entityType = 2 then 4
                                when entityType = 3 then 5
                                when entityType = 30 then 6
                                else '' end as summaryOrder,
                           SUM(case when transactionDashboardCode = 11 ${regionEntityClause} then changeQty else 0 end) as receipt_from_kemenkes,
                           SUM(case when transactionDashboardCode = 12 ${regionEntityClause} then changeQty else 0 end) as receipt_from_dinkes,
                           SUM(case when transactionDashboardCode = 13 ${regionEntityClause} then changeQty else 0 end) as receipt_from_faskes,
                           SUM(case when transactionDashboardCode = 14 ${regionEntityClause} then changeQty else 0 end) as receipt_of_return,
                           SUM(case when transactionDashboardCode = 22 ${regionEntityClause} then changeQty else 0 end) as received_distribution,
                           SUM(case when transactionDashboardCode = 21 ${regionEntityClause} then changeQty else 0 end) as not_received_distribution,
                           SUM(case when transactionDashboardCode = 20 ${regionEntityClause} and orderShippedAt is not null and orderUpdatedAt is not null and orderUpdatedAt > :to then changeQty else 0 end) as canceled_distribution,
                           SUM(case when transactionDashboardCode = 32 ${regionEntityClause} then changeQty else 0 end) as received_distribution_return,
                           SUM(case when transactionDashboardCode = 31 ${regionEntityClause} then changeQty else 0 end) as not_received_distribution_return,
                           ABS(SUM(case when transactionDashboardCode = 41 then changeQty else 0 end)) - ABS(SUM(case when transactionDashboardCode = 42 then changeQty else 0 end)) as consumption,
                           IF(
                            ABS(SUM(case when transactionDashboardCode = 51 then changeQty else 0 end)) - ABS(SUM(case when transactionTypeId = 11 then changeQty else 0 end)) > 0, 
                            ABS(SUM(case when transactionDashboardCode = 51 then changeQty else 0 end)) - ABS(SUM(case when transactionTypeId = 11 then changeQty else 0 end)), 
                            0
                          ) as defect
                    from transactions 
                    ${indexGabungan}
                    where createdAt between :from and :to and entityIsVendor = 1 
                    ${filter}
                    group by regionId
                    having regionId is not null
                    ;`

  if (isSummaryBox) {
    query = query.replace('group by regionId', 'group by newEntityType')
      .replace('having regionId is not null', 'order by summaryOrder asc')
  }
  let transactions = await sequelizeWH.query(query, {
    type: QueryTypes.SELECT,
    plain: false,
    logging: false,
    replacements: queryParam
  })
  return transactions
}

const getRemainingStock = async (queryParam) => {
  let filter = 'emma.activity_id in (:activityId) and ehmm.entity_id in (:entityIds) and ehmm.master_material_id in (:materialIds)'
  let remainingStock = await sequelize.query(`
        select sum(emma.stock_on_hand) as qty, ehmm.entity_id as regionId
        from entity_master_material_activities as emma
        left join entity_has_master_materials as ehmm on ehmm.id = emma.entity_master_material_id
        where ${filter}
    `, {
    type: QueryTypes.SELECT,
    plain: false,
    logging: false,
    replacements: queryParam
  })

  return remainingStock
}

const getOverdue = async (queryParam) => {
  let filter = ' entityId in (:entityIds) and master_material_id in (:materialIds) and activity_id in (:activityId) '
  filter += ' and createdAt > (:to) and createdAt <= now() '
  filter += ' and deletedAt is null '
  filter += ' group by entityId '
  let overdueTransaction = await sequelizeWH.query(`
          select sum(changeQty) as qty, entityId as regionId from transactions where ${filter}
      `, {
    type: QueryTypes.SELECT,
    plain: false,
    logging: false,
    replacements: queryParam
  })

  return overdueTransaction
}

const convertTransactionTableDataV1 = (transaction) => {
  let v1Response = {}
  v1Response.date = transaction.date

  let transactionsDatas = transaction.data
  let v1Datas = []

  transactionsDatas.forEach(transactionData => {
    let v1Data = {
      'rowNumber': transactionData.no,
      'entityId': transactionData.id,
      'entityName': transactionData.recipient,
      'entity_type': transactionData.entity_type,
      'provinceId': null,
      'regencyId': null,
      'subDistrictId': null,
      'openingQty': transactionData.opening_stock,
      'receivedQty': transactionData.receipt_from_kemenkes + transactionData.receipt_from_dinkes + transactionData.receipt_from_faskes,
      'receivedCode': '111213',
      'receivedReturnQty': transactionData.receipt_of_return,
      'receivedReturnCode': '14',
      'distributedQty': transactionData.received_distribution + transactionData.not_received_distribution,
      'distributedCode': '2122',
      'returnQty': transactionData.received_distribution_return + transactionData.not_received_distribution_return,
      'returnCode': '3132',
      'consumedQty': transactionData.consumption,
      'consumedCode': '41',
      'defectQty': transactionData.defect,
      'defectCode': '51',
      'remainingQty': transactionData.final_stock
    }
    v1Datas.push(v1Data)
  })
  v1Response.data = v1Datas
  v1Response.total_data = transaction.total_data
  v1Response.current_Page = transaction.current_Page
  v1Response.total_page = transaction.total_page
  return v1Response
}