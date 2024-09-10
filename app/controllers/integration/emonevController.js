import { Op } from 'sequelize'
import models from '../../models'

const { sequelize } = models

import moment from 'moment'

/*let mapping_xls_distribution = {
    "DT (kelas 1 SD)": 4,
    "DPT-HB-Hib (bayi)": 2,
    "Polio (IPV)": 2,
    "Td (kelas 2 SD)": 5,
    "Hepatitis B 0": 1,
    "Measles Rubella (bayi)": 2,
    "Polio (bOPV)": 1,
    "Pneumokokus (tahun pertama)": 2,
    "HPV (kelas 5 SD)": 7,
    "DPT-HB-Hib (baduta)": 3,
    "Measles Rubella (baduta)": 3,
    "Measles Rubella (kelas 1 SD)": 4,
    "Td (kelas 5 SD)": 6,
    "Td WUS": 9,
    "Polio (IPV) D.I Yogyakarta": 2,
    "HPV (kelas 6 SD)": 8,
    "Pneumokokus (tahun kedua dan seterusnya)": 2,
    "BCG": 1,
    "JE" : 2,
    "ROTAVIRUS": 2
} */

let mapping_xls_distribution = {
  905: 4,
  907: 2,
  908: 2,
  1036: 5,
  1175: 1,
  1176: 2,
  1177: 1,
  1343: 2,
  1344: 7,
  1350: 3,
  1351: 3,
  1352: 4,
  1353: 6,
  1354: 9,
  1474: 2,
  1475: 8,
  1476: 2,
  902: 1,
  1230: 2,
  1477: 2,
  1517: 2
}


export async function listDataProvince(req, res, next) {
  try {
    let {
      year, code, date_cutoff
    } = req.query

    if (!date_cutoff) {
      date_cutoff = moment().format('YYYY-MM-DD')
    }

    const materialIds = [] //[11, 34, 50, 31, 36, 42, 45, 42, 31, 32, 42, 57, 57, 35, 35, 57, 46]

    /*let materials = await models.MasterMaterial.findAll({
            attributes: ['id', 'name', 'code', 'pieces_per_unit', 'unit'],
            where: { id: { [Op.in]: materialIds } }
        }) */

    let materialsEmonev = await models.IntegrationEmonevMaterial.findAll({
      include: [
        {
          association: 'master_material',
          attributes: ['id', 'name', 'code', 'pieces_per_unit', 'unit'],
          required: true
        }
      ],
      where: {
        tahun: year,
        master_material_id: { [Op.not]: null }
      }
    })

    let data = []
    for (let material of materialsEmonev) {
      materialIds.push(material.master_material_id)
      data.push({
        id: material.master_material.id,
        year: year,
        consumption: 0,
        timestamp_utc: new Date(),
        stock_lastyear: 0,
        stock_update: 0,
        date_cutoff: date_cutoff,
        master_material_id: material.master_material.id,
        nama_xls: material.nama_xls,
        obat_id: material.obat_id,
        stock_last_update: null,
        created_at: material.createdAt,
        updated_at: material.updatedAt,
        material: material.master_material,
        stocks: []
      })
    }

    let province = await models.IntegrationEmonevProvince.findOne({
      where: {
        code: code
      }
    })

    let entities = await models.Entity.findAll({
      attributes: ['id'],
      where: { province_id: province.province_id }
    })

    let entityIds = []
    for (let entity of entities) entityIds.push(entity.id)

    /* search for data last year */
    const yearDate = new Date(date_cutoff).getFullYear()
    const stockYearly = await models.YearlyStockProvince.findAll({
      where: {
        year: yearDate - 1,
        province_id: province.province_id,
        master_material_id: { [Op.in]: materialIds }
      }
    })


    //const stockLastYear = await getStockLastYear(year, entityIds, materialIds)
    //const all_transaction_last_year = await getAllTransactionLastYear(year, entityIds, materialIds)

    for (let item of data) {
      // let transactions_stock = stockLastYear.filter(it => it.master_material_id == item.material.id)
      let transactions = stockYearly.filter(it => it.master_material_id == item.material.id)

      let totalconsumption = 0
      let totalstock = 0
      for (let transc of transactions) {
        totalstock += transc.qty
        totalconsumption += transc.consumption
      }
      item.consumption = Math.round(totalconsumption / 12)
      item.stock_lastyear = totalstock

      /*for(let transc of transactions_stock){
                item.stock_lastyear += transc.closing_qty
            }*/
    }

    /* end search for data last year */

    /* search for data current year */


    let dataTransactions = await getUpdateStock(province.province_id, date_cutoff, materialIds)

    for (let item of data) {
      let transactions = dataTransactions.filter(it => it.master_material_id == item.material.id)

      for (let transc of transactions) {
        item.stock_update += transc.qty
        let stocks = JSON.parse(transc.stocks)
        for (let it of stocks) {
          item.stock_last_update = (new Date(item.stock_last_update)).getTime() < (new Date(it.updatedAt)).getTime() ? it.updatedAt : item.stock_last_update
        }
        item.stocks.push(...stocks)
      }
    }

    /* end search for data current year */

    const response = {
      province: {
        id_smile: province.province_id,
        code_emonev: province.code,
        code: province.trader_id,
        name: province.name
      },
      data: data
    }
    return res.status(200).json(response)

  } catch (error) {

    console.error(error)
    return next(error)
  }
}

function getDataObat1474({ obat_id, code, date_cutoff, item }) {
  if (obat_id === '1474' && !code.toLowerCase().includes('dns-34')) {
    item.target = 0
    item.target_distribution = 0
    item.ipv = 0
    item.yearly_vial = 0
    item.target_percentage = 0
    item.stock_lastyear = 0
    item.stock_update = 0
    item.date_cutoff = date_cutoff
    item.timestamp_utc = new Date()
    item.activity = null
  } else if (item.obat_id === '1474' && code.toLowerCase().includes('dns-34')) {
    item.target_distribution = 3
  }
  return item
}

export async function listDataRegency(req, res, next) {
  try {
    let {
      year, code, date_cutoff
    } = req.query

    if (!date_cutoff) {
      date_cutoff = moment().format('YYYY-MM-DD')
    }

    let materialIds = []

    let materialsEmonev = await models.IntegrationEmonevMaterial.findAll({
      include: [{
        association: 'master_material',
        attributes: ['id', 'name', 'is_vaccine'],
      }],
      where: {
        tahun: year,
        master_material_id: { [Op.not]: null }
      }
    })

    for (let it of materialsEmonev) materialIds.push(it.master_material_id)

    let dataRegency = await models.IntegrationEmonevRegency.findOne({
      where: {
        code: code
      }
    })

    let entities = await models.Entity.findAll({
      attributes: ['id'],
      where: { regency_id: dataRegency.regency_id, type: [2, 3], is_vendor: 1 }
    })

    let entityIds = []
    for (let entity of entities) entityIds.push(entity.id)

    let includeTargetDistribution = [{
      association: 'master_material',
      attributes: ['id', 'name', 'is_vaccine'],
    }, {
      association: 'activity',
      attributes: ['id', 'name']
    }, {
      association: 'master_target',
      attributes: ['id', 'name']
    }]

    let optionsTargetDistribution = {
      include: includeTargetDistribution,
      where: {
        master_material_id: { [Op.in]: materialIds }
      }
    }

    let dataMasterDistributions = await models.MasterTargetDistribution.findAll(optionsTargetDistribution)

    /* target, ipvs diambil dari year_parent */

    let includeYearPlan = [
      {
        association: 'targets'
      },
      {
        association: 'ipvs',
        where: {
          master_material_id: { [Op.in]: materialIds }
        }
      }
    ]

    let optionsYearPlan = {
      include: includeYearPlan,
      where: {
        entity_regency_id: { [Op.in]: entityIds },
        year: year
      }
    }

    let dataYearlyPlan = await models.YearlyPlan.findAll(optionsYearPlan)
    // console.log(dataYearlyPlan.filter(it => it.status == 'disetujui').length)
    // console.log(dataYearlyPlan.length)
    if (materialIds.length <= 0)
      return res.status(422).json({ message: `Material emonev untuk tahun ${year} belum tersedia` })
    if (dataYearlyPlan.length != dataYearlyPlan.filter(it => it.status == 'disetujui').length || dataYearlyPlan.length <= 0) {
      return res.status(422).json({ message: 'Perencanaan Tahunan pada SMILE perlu disetujui oleh Dinas Kesehatan Provinsi untuk bisa terintegrasi dengan aplikasi E-Monev' })
    }

    let targets = []
    let ipvs = []
    for (let yearlyPlan of dataYearlyPlan) {
      ipvs.push(...yearlyPlan.ipvs)
      targets.push(...yearlyPlan.targets)
    }

    let includeYearlyChildTarget = [
      {
        association: 'yearly_plan',
        where: {
          year: year
        },
        required: true
      },
      {
        association: 'entity',
        where: {
          regency_id: dataRegency.regency_id
        },
        required: true
      },
      {
        association: 'results',
        include: [
          {
            association: 'activity',
            attributes: ['id', 'name']
          }
        ]
      }
    ]

    let optionsYearChild = {
      include: includeYearlyChildTarget
    }

    let yearlyTarget = await models.YearlyChild.findAll(optionsYearChild)

    let data = []
    let results = []

    for (let target of yearlyTarget) {
      results.push(...target.results)
    }

    for (let material of materialsEmonev) {
      let master_target_id = mapping_xls_distribution[material.obat_id] ?? null
      let distribution = {}
      let selected = []
      if (master_target_id) {
        selected = dataMasterDistributions.filter(it => it.master_material_id == material.master_material_id && it.master_target_id == master_target_id)
      } else {
        selected = dataMasterDistributions.filter(it => it.master_material_id == material.master_material_id)
      }

      if (selected.length > 0) {
        distribution = selected[0]
      }

      let yearlyvial = 0

      let results2 = []
      if (material.master_material.is_vaccine) {
        results2 = results.filter(it => it.master_material_id == material.master_material_id && it.activity_id == distribution.activity_id)
      } else {
        results2 = results.filter(it => it.master_material_id == material.master_material_id)
      }

      for (let itm of results2) {
        yearlyvial += (itm.yearly_vial ?? itm.yearly_need)
      }

      let item = {
        master_material_id: material.master_material_id,
        material: material.master_material.name,
        nama_xls: material.nama_xls,
        obat_id: material.obat_id,
        target: 0,
        target_distribution: distribution.qty ?? 0,
        ipv: 0,
        yearly_vial: yearlyvial,
        target_percentage: 0,
        stock_lastyear: 0,
        stock_update: 0,
        date_cutoff: date_cutoff,
        timestamp_utc: new Date(),
        activity: distribution.activity ?? (results2.length > 0 ? results2[0].activity : null)
      }

      const activity_id = item.activity ? item.activity.id : null

      for (let ipv of ipvs.filter(it => it.master_material_id == material.master_material_id && it.activity_id == activity_id)) {
        item.ipv += Number(ipv.YearlyPlanIPV.custom_ipv) ?? 0
      }

      for (let target of targets.filter(it => it.id == master_target_id)) {
        item.target += target.YearlyParentTarget.custom_qty ?? 0
      }

      item.target_percentage = item.nama_xls.toLowerCase() == 'td wus' ? 20 : 100

      data.push(item)
    }

    const yearDate = (new Date(date_cutoff)).getFullYear()
    let data_stock_last_year = await getStockLastYear(yearDate, entityIds, materialIds)
    let data_stock_current = await getStockCurrent(yearDate, date_cutoff, entityIds, materialIds)

    let materialIdNow = ''
    let activityIdNow = ''
    let indexMaterialId = ''
    data = data.sort((a, b) => a.master_material_id - b.master_material_id)  // sort material id

    for (let [index, item] of data.entries()) {
      const activity_id = item.activity ? item.activity.id : 1
      /**
       * nilai "stock_lastyear" dan "stock_update"
       * dipilih hanya salah satu data material id yang memberikan data. yang lainnya 0
       */
      if (materialIdNow !== item.master_material_id) {
        indexMaterialId = index
        item.stock_lastyear = countStockCurrent(item.master_material_id, activity_id, data_stock_last_year)
        item.stock_update = countStockCurrent(item.master_material_id, activity_id, data_stock_current)
      } else if (activityIdNow !== activity_id) {
        data[indexMaterialId].stock_update += countStockCurrent(item.master_material_id, activity_id, data_stock_current)
        data[indexMaterialId].stock_lastyear += countStockCurrent(item.master_material_id, activity_id, data_stock_last_year)
      }
      materialIdNow = item.master_material_id
      activityIdNow = activity_id
      /**
       * "obat_id": "1474"
       * semua regency default datanya 0 semua kecuali regency dengan province_id=34
       * default target_distribution = 3 regency jogja, yang lain boleh 0
       */
      getDataObat1474({ obat_id: item.obat_id, code, date_cutoff, item })
    }

    let response = {
      regency: {
        id_smile: dataRegency.regency_id,
        code_emonev: dataRegency.code,
        code: dataRegency.trader_id,
        name: dataRegency.name
      },
      data: data
    }

    return res.status(200).json(response)

  } catch (error) {
    console.error(error)
    return next(error)
  }
}

function getIncludesKabKota(conditionStock) {
  let includeStock = [
    {
      association: 'transaction_type',
      attributes: models.TransactionType.getBasicAttribute(),
    },
    {
      association: 'stock',
      attributes: ['id', 'batch_id', 'qty', 'available', 'allocated', 'createdAt', 'updatedAt', 'activity_id'],
      include: [
        {
          association: 'batch',
          attributes: models.Batch.getBasicAttribute(),
          include: { association: 'manufacture', attributes: ['name', 'address'] },
          where: conditionStock,
          required: false
        }
      ],
      required: false
    }

  ]

  return includeStock
}

async function getStockLastYear(year, entityIds = [], materialIds = []) {
  let transactionsIdLastyear = await models.Transaction.findAll({
    attributes: [[sequelize.fn('max', sequelize.col('id')), 'id']],
    group: ['stock_id'],
    where: {
      createdAt: {
        [Op.between]: [
          `${year - 1}-01-01 00:00:00`,
          `${year - 1}-12-31 23:59:59`,
        ]
      },
      entity_id: { [Op.in]: entityIds },
      stock_id: { [Op.not]: null },
      master_material_id: { [Op.in]: materialIds }
    }
  })

  let transactionIds = []

  for (let transaction of transactionsIdLastyear) transactionIds.push(transaction.id)

  let conditionStock = {
    expired_date: { [Op.gte]: `${year - 1}-12-31 23:59:59` }
  }

  let includeStock = getIncludesKabKota(conditionStock)

  let options = {
    where: {
      createdAt: {
        [Op.between]: [
          `${year - 1}-01-01 00:00:00`,
          `${year - 1}-12-31 23:59:59`,
        ]
      },
      entity_id: { [Op.in]: entityIds },
      master_material_id: { [Op.in]: materialIds },
      id: { [Op.in]: transactionIds }
    },
    include: includeStock,
    order: [['createdAt', 'ASC']],
    subQuery: false
  }



  let dataTransactions = await models.Transaction.findAll(options)
  return dataTransactions.filter(it => !it.stock.batch_id || (it.stock.batch_id && it.stock.batch))
}

async function getStockCurrent(year, date_cutoff, entityIds, materialIds) {
  let conditionStock = {
    expired_date: { [Op.gte]: `${date_cutoff} 23:59:59` }
  }


  let includeStock = getIncludesKabKota(conditionStock)

  let transactionsIdCurrents = await models.Transaction.findAll({
    attributes: [[sequelize.fn('max', sequelize.col('id')), 'id']],
    group: ['stock_id'],
    where: {
      createdAt: {
        [Op.lte]: `${date_cutoff} 23:59:59`
      },
      entity_id: { [Op.in]: entityIds },
      master_material_id: { [Op.in]: materialIds }
    }
  })

  let transactionIds = []

  for (let transaction of transactionsIdCurrents) transactionIds.push(transaction.id)

  includeStock[1].include[0].where = {
    expired_date: { [Op.gte]: `${date_cutoff} 23:59:59` }
  }

  includeStock[1].include.push({
    association: 'activity',
    attributes: ['id', 'name']
  })

  let options = {
    where: {
      id: { [Op.in]: transactionIds }
    },
    include: includeStock,
    order: [['updatedAt', 'ASC']],
    subQuery: false
  }

  let dataTransactions = await models.Transaction.findAll(options)

  return dataTransactions.filter(it => !it.stock.batch_id || (it.stock.batch_id && it.stock.batch))
  
}

function countStockCurrent(master_material_id, activity_id, data_transactions = []) {
  let transactions = []
  if (activity_id)
    transactions = data_transactions.filter(it => it.master_material_id == master_material_id && it.stock.activity_id == activity_id)
  else
    transactions = data_transactions.filter(it => it.master_material_id == master_material_id)

  let stock_update = 0
  for (let transc of transactions) {
    stock_update += transc.closing_qty
  }

  return stock_update
}


async function getUpdateStock(province_id, date_cutoff, materialIds) {
  const data = await models.UpdateStock.findAll({
    attributes: ['id', 'master_material_id', 'qty', 'stocks', 'updatedAt'],
    where: {
      master_material_id: { [Op.in]: materialIds },
      province_id: province_id,
      date_cutoff: date_cutoff
    }
  })

  return data
}
