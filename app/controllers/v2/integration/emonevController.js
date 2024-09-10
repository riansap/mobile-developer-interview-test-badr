import { Op, QueryTypes } from 'sequelize'
import models from '../../../models'

import __ from 'lodash'

const { sequelize } = models

import moment from 'moment'


export async function listDataProvince(req, res, next) {
  try {
    let {
      year, code, date_cutoff,
      start_date_consumption, end_date_consumption
    } = req.query

    if (!date_cutoff) {
      date_cutoff = moment().format('YYYY-MM-DD')
    }

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

    let province = await models.IntegrationEmonevProvince.findOne({
      where: {
        code: code
      }
    })

    let entities = await models.Entity.findAll({
      where : {province_id : province.province_id, type : 1}
    })

    const entityIds = __.keys(__.groupBy(entities, 'id'))

    const yearStock = new Date(date_cutoff).getFullYear()
    let stockLastYear = await getStockProvince(province.province_id, yearStock - 1, null)
    let stockUpdate = await getStockProvince(province.province_id, yearStock, date_cutoff)
    let consumptions = await getConsumption(province.province_id, date_cutoff, start_date_consumption, end_date_consumption)

    if (!start_date_consumption || !end_date_consumption) {
      start_date_consumption = `${yearStock}-01-01 00:00:00`
      end_date_consumption = `${date_cutoff} 23:59:59`
    }else{
      start_date_consumption = `${start_date_consumption} 00:00:00`
      end_date_consumption = `${end_date_consumption} 23:59:59`
    }
    
    const monthCount = Math.round(moment(end_date_consumption).diff(moment(start_date_consumption), 'months', true))

    let stocks = await models.Stock.findAll({
      attributes: ['id', 'qty', 'available', 'batch_id', 'allocated', 'createdAt', 'updatedAt', 'activity_id'],
      include: [
        {
          association: 'batch',
          attributes: models.Batch.getBasicAttribute(),
          include: { association: 'manufacture', attributes: ['name', 'address'] },
          where : {expired_date: { [Op.gte]: `${date_cutoff} 23:59:59` }},
          required : false
        },
        {
          association: 'activity',
          attributes: ['id', 'name']
        },
        {
          association : 'entity_master_material',
          attributes : ['id', 'master_material_id'],
          where : {
            entity_id : {[Op.in] : entityIds}
          },
          required : true
        }
      ],
      order : [['updatedAt', 'desc']]
    })

    stocks = stocks.filter(it => !it.batch_id || (it.batch_id && it.batch))
    stocks = stocks.map(item=>{
      var {master_material_id} = item.entity_master_material
      item.dataValues.master_material_id = master_material_id
      delete item.dataValues.entity_master_material
      return item.dataValues
    })

    for (let material of materialsEmonev) {
      let item = {
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
      }

      const data_stock_last_year = stockLastYear.filter(it=> it.master_material_id == item.id)
      const data_stock_update = stockUpdate.filter(it=> it.master_material_id == item.id)
      const data_consumption = consumptions.filter(it=> it.master_material_id == item.id)

      for(let itm of data_stock_last_year) item.stock_lastyear += itm.closing_qty
      for(let itm of data_stock_update) item.stock_update += itm.closing_qty
      for(let itm of data_consumption) item.consumption += itm.consumption - itm.returnfaskes

      item.stocks = stocks.filter(it=> it.master_material_id == item.id)

      item.consumption = Math.round(item.consumption/ monthCount)
      item.stock_last_update = item.stocks.length>0 ? item.stocks[0].updatedAt : null

      data.push(item)
    }

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

async function getStockProvince(province_id, year, date_cutoff) {
  let end_date = null
  if (date_cutoff) {
    end_date = date_cutoff + ' 23:59:59'
  } else end_date = `${year}-12-31 23:59:59`

  const stocks = await sequelize.query(
    `select t.master_material_id, sum(IF(s.chg_type = 2, ABS(t.change_qty), IF(s.chg_type = 3, t.opening_qty  - ABS(t.change_qty), t.opening_qty + ABS(t.change_qty)))) as closing_qty from transactions t , transaction_types s, stocks st LEFT JOIN batches b ON st.batch_id = b.id and b.expired_date>='${end_date}' WHERE st.id = t.stock_id and s.id = t.transaction_type_id and t.id in (select max(a.id) from transactions a, entities et WHERE a.entity_id = et.id and et.province_id = ${province_id} and et.type = 1 and a.createdAt<='${end_date}' and a.master_material_id is not NULL and a.master_material_id in (1, 3, 5, 10, 11, 31, 32, 34, 35, 36, 37, 42, 43, 45, 46, 49, 50, 52, 53, 57, 80) and a.stock_id is not NULL and a.deleted_at is NULL group by a.stock_id) AND (st.batch_id is NULL OR b.id is NOT NULL) GROUP BY t.master_material_id`,
    {
      type: QueryTypes.SELECT,
      plain: false
    }
  )

  return stocks
}

async function getConsumption(province_id, date_cutoff, start_date_consumption, end_date_consumption) {
  if (!start_date_consumption || !end_date_consumption) {
    let year = new Date(date_cutoff).getFullYear()
    start_date_consumption = `${year}-01-01 00:00:00`
    end_date_consumption = `${date_cutoff} 23:59:59`
  }else{
    start_date_consumption = `${start_date_consumption} 00:00:00`
    end_date_consumption = `${end_date_consumption} 23:59:59`
  }

  const consumptions = await sequelize.query(
    `select a.master_material_id, sum(IF(a.transaction_type_id = 2 and a.order_id is NULL, abs(a.change_qty),0)) as consumption, sum(IF(a.transaction_type_id = 5, abs(a.change_qty),0)) as returnfaskes from transactions a, entities b WHERE a.entity_id = b.id and b.province_id = ${province_id} and b.type = 3 and b.is_vendor = 1 and b.is_puskesmas = 1 and a.createdAt >='${start_date_consumption}' and a.createdAt<='${end_date_consumption}' and ((a.transaction_type_id = 2 and a.order_id is NULL) or transaction_type_id = 5) and a.master_material_id is not NULL and a.deleted_at is NULL group by a.master_material_id`,
    {
      type: QueryTypes.SELECT,
      plain: false
    }
  )

  return consumptions
}