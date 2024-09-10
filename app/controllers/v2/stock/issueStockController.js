import { Op } from 'sequelize'

import models from '../../../models'

import { USER_ROLE, TRANSACTION_TYPE } from '../../../helpers/constants'

const {
  sequelize,
} = models

export async function issueStock(req, res, next) {
  try {
    console.log('isssue stock')
    const { activity_id, material_id, customer_id } = req.query
    let { entity_id } = req.query

    const role = Number(req.user.role)
    if (role !== USER_ROLE.SUPERADMIN && role !== USER_ROLE.ADMIN) {
      if (!entity_id) {
        entity_id = req.entityID
      }
    }

    if(!entity_id) return res.status(400).json({ message: 'entity_id undefined' })
    if(!customer_id) return res.status(400).json({ message: 'customer_id undefined' })
    if(!activity_id) return res.status(400).json({ message: 'activity_id undefined' })

    const andCondition = []
    if (entity_id) andCondition.push({ entity_id })
    if (material_id) andCondition.push({ master_material_id: material_id })
    if (activity_id) andCondition.push({ '$masterMaterialActivities.activity_id$': activity_id })

    req.include = [
      {
        association: 'material',
        attributes: models.MasterMaterial.getBasicAttribute(),
      },
      {
        association: 'masterMaterialActivities',
        attributes: models.MasterMaterialActivities.getKeyAvailable(),
      },
      {
        association: 'stocks',
        attributes: models.Stock.getBasicAttributeV2(),
        include: [{
          association: 'batch',
          attributes: models.Batch.getBasicAttribute(),
          required: false,
          include: {
            association: 'manufacture',
            attributes: models.Manufacture.getBasicAttribute(),
          }
        }, {
          association: 'activity',
          attributes: ['id', 'name']
        }],
        required: true,
      },
    ]

    req.condition = {
      [Op.and]: andCondition,
    }

    req.order = [[{ model: models.MasterMaterial, as: 'material' }, 'name', 'ASC']]

    req.mappingDocs = async ({ docs }) => {
      const materialId = []
      docs.map((data) => {
        materialId.push(data.material.id)
      })
      const transactions = await models.Transaction.findAll({
        where: [
          {
            transaction_type_id: {
              [Op.in]: [
                TRANSACTION_TYPE.ISSUES,
                TRANSACTION_TYPE.RETURN,
              ],
            },
          },
          { order_id: null },
          { entity_id },
          { customer_id },
          { master_material_id: { [Op.in]: materialId } },
          { activity_id },
        ],
        attributes: [
          'stock_id',
          'transaction_type_id',
          [sequelize.fn('SUM', sequelize.col('change_qty')), 'total_qty'],
          [sequelize.fn('SUM', sequelize.col('open_vial')), 'total_open_vial'],
          [sequelize.fn('SUM', sequelize.col('close_vial')), 'total_close_vial'],
        ],
        group: ['stock_id', 'transaction_type_id'],
        raw: true,
      })
      return docs.map((data) => {
        let stock = []
        let qty = 0
        let availableIssueStock = 0

        if (data.material.managed_in_batch) {
          stock = data.stocks.filter((el) => el.batch_id !== null)
        } else {
          stock = data.stocks.filter((el) => el.batch_id === null)
        }

        stock = stock.map((item) => {
          let stockIssue = 0
          let stockOpenVial = 0
          let stockCloseVial = 0
          transactions.map((element) => {
            if (element.stock_id === item.id) {
              if (element.transaction_type_id === TRANSACTION_TYPE.ISSUES) {
                stockIssue += Math.abs(element.total_qty)
                stockOpenVial += Math.abs(element.total_open_vial)
                stockCloseVial += Math.abs(element.total_close_vial)
              } else if (element.transaction_type_id === TRANSACTION_TYPE.RETURN) {
                stockIssue -= element.total_qty
                stockOpenVial -= element.total_open_vial
                stockCloseVial -= element.total_close_vial
              }
            }
          })
          if (item.qty) qty += parseInt(item.qty)
          if (stockIssue) {
            availableIssueStock += stockIssue
            return {
              id: item.stock_id,
              activity_id: item.activity_id,
              activity: item.activity,
              total_issue: stockIssue,
              total_open_vial: stockOpenVial,
              total_close_vial: stockCloseVial,
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
          masterMaterialActivities: data?.masterMaterialActivities ? data?.masterMaterialActivities[0] : null,
          min: data.min,
          max: data.max,
          qty: availableIssueStock,
          available: availableIssueStock,
          is_batches: data.material.managed_in_batch ? true : false,
          updated_at: stock[0]?.updated_at || '-',
          stocks: stock,
        }
      })
    }
    return next()
  } catch (err) {
    console.log(err)
    return next(err)
  }
}