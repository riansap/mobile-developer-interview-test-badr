import { body } from 'express-validator'
import models from '../../models'
import { ENTITY_TYPE } from '../../helpers/constants'

export const generateMixMax = [
  body('year')
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.yearly_plan.year'),
    })),
  body('entity_province_id')
    .optional({ nullable: true, checkFalsy: true })
    .isNumeric()
    .withMessage((value, { req }) => req.__('validator.number', {
      field: req.__('field.yearly_plan.entity_province_id'),
    }))
    .custom(checkAllCityGenerate),
  body('entity_regency_id')
    .optional({ nullable: true, checkFalsy: true })
    .isArray()
    .withMessage((value, { req }) => req.__('validator.array', {
      field: req.__('field.yearly_plan.entity_regency_id'),
    })),
]


async function checkAllCityGenerate(value, { req }) {
  if (value) {
    const { year } = req.body
    const entityProvince = await models.Entity.findOne({
      where : {province_id: value, type: ENTITY_TYPE.PROVINSI, is_vendor: 1}
    })

    if (!entityProvince) throw Error('Entity Province not found')
    const { province_id } = entityProvince
    const entityRegencies = await models.Entity.findAll({
      where: { province_id, type: ENTITY_TYPE.KOTA, is_vendor: 1 },
      include: [
        {
          association: 'yearly_plan',
          where: { year },
          include : {association: 'entity_master_material_minmax', required: true},
          required: false
        }
      ]
    })

    if (entityRegencies.filter(it => it.yearly_plan.length <= 0).length > 0 || entityRegencies.length<=0)
      throw Error('Cannot generate min max because all min max regencies not generated yet')
  }

  return true
}