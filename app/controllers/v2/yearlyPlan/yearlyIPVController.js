import models from '../../../models'
import listResponse from '../../../helpers/listResponse'
import sequelize from 'sequelize'

async function generateIPV({ yearly_plan, user }) {
  const materialIPVs = await models.MasterIPV.findAll({
    where: {
      has_ipv: 1
    }
  })
  
  const newIPV = []
  for(let master_ipv of materialIPVs) {
    newIPV.push({
      master_ipv_id: master_ipv.id,
      yearly_plan_id: yearly_plan.id,
      created_by: user.id,
      custom_ipv: master_ipv.ipv
    })
  }
  await models.YearlyPlanIPV.bulkCreate(newIPV)
}
  
async function getChildIPV({ yearly_plan, page, paginate }) {
  const queryOptions = {
    limit: Number(paginate),
    offset: (page-1) * Number(paginate),
    order : [[sequelize.col('master_ipv.master_material.name'), 'ASC']],
    where: {
      yearly_plan_id: yearly_plan.id
    },
    include: [
      {
        association: 'master_ipv',
        include: [{
          association: 'master_material',
          attributes: models.MasterMaterial.getBasicAttribute()
        }, {
          association: 'activity',
          attributes: models.MasterActivity.getBasicAttribute()
        }],
        required: true
      },
      {
        association: 'user_updated_by',
        attributes: ['id', 'username', 'email', 'firstname', 'lastname']
      },
      {
        association: 'user_created_by',
        attributes: ['id', 'username', 'email', 'firstname', 'lastname']
      },
    ]
  }
  const childIPVs = await models.YearlyPlanIPV.findAll(queryOptions)
  const total = await models.YearlyPlanIPV.count(queryOptions)

  const ipvDatas = []
  for(let child of childIPVs) {
    let data = {
      material: child.master_ipv.master_material.dataValues,
      activity: child.master_ipv.activity.dataValues,
      ...child.dataValues,
      master_ipv: {
        id: child.master_ipv.id,
        ipv: child.master_ipv.ipv
      }
    }
    delete data['yearly_plan']

    ipvDatas.push(data)
  }
  return listResponse(total, page, paginate, ipvDatas)
}
  
export async function detail(req, res, next) {
  try {
    const { entity_regency_id, year } = req.params
    const { page = 1, paginate = 10, entity_id } = req.query
    const yearlyPlan = await models.YearlyPlan.findOne({
      where: { year, entity_regency_id }
    })
    const user = req.user
  
    if(!yearlyPlan) {
      return res.json({
        message: 'Data tidak tersedia',
        data: null,
      })
    }
    // masterIPVs
    let hasIPV = await models.YearlyPlanIPV.count({
      where: {
        yearly_plan_id: yearlyPlan.id
      }
    })
    if(hasIPV <= 0 ) {
      await generateIPV({ yearly_plan: yearlyPlan, user })
    }
    let data = await getChildIPV({ yearly_plan: yearlyPlan, page, paginate })
  
    return res.json(data)
  } catch(err) {
    return next(err)
  }
}
