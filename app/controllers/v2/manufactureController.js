import { Op } from 'sequelize'
import models from '../../models'

export function list(req, res, next) {
  try {
    const {
      keyword, material_id, is_asset, type, status,
    } = req.query
    const condition = []

    let materialCondition = {}
    if (keyword) condition.push({ name: { [Op.like]: `%${keyword}%` } })
    if (material_id) {
      materialCondition = {
        where: { id: material_id },
        required: true,
      }
    }
    if (is_asset) condition.push({ is_asset })
    if (type) condition.push({ type })
    if (status) condition.push({ status })

    req.include = {
      model: models.MasterMaterial,
      as: 'master_materials',
      ...materialCondition,
    }
    if (condition.length > 0) req.condition = condition

    req.mappingDocs = ({ docs }) => docs.map((manufacture) => {
      let { master_materials } = manufacture

      delete manufacture.dataValues.master_materials
      
      return {
        ...manufacture.dataValues,
        materials : master_materials
      }
    })

    req.xlsColumns = [
      { key: 'name' },
      { key: 'type' },
      { key: 'reference_id' },
      { key: 'description' },
      { key: 'contact_name' },
      { key: 'phone_number' },
      { key: 'email' },
      { key: 'address' },
      { key: 'status_label', title: 'status' },
      { key: 'updated_at' },
      { key: 'user_updated_by_label', title: 'updated_by' },
    ]

    next()
  } catch (err) {
    return next(err)
  }
}
