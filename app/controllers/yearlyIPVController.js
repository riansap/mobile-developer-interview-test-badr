import models from '../models'
import listResponse from '../helpers/listResponse'

export async function generateChildIPV({ yearly_plan, user }) {
  const materialIPVs = await models.YearlyPlanIPV.findAll({
    where: {
      yearly_plan: yearly_plan.id
    }
  })

  const childs = await models.YearlyChild.findAll({
    where: { yearly_plan_id: yearly_plan.id }
  })
  
  const newIPV = []
  for(let parentIPV of materialIPVs) {
    for(let child of childs) {
      newIPV.push({
        master_ipv_id: parentIPV.master_ipv_id,
        yearly_child_id: child.id,
        created_by: user.id,
        updated_by: user.id,
        custom_ipv: parentIPV.ipv
      })
    }
  }

  await models.YearlyChildIPV.bulkCreate(newIPV)
}

async function generateIPV({ yearly_plan, user }) {
  const materialIPVs = await models.MasterIPV.findAll({
    where: {
      has_ipv: 1
    },
    include: {
      association: 'material',
      attributes: models.Material.getBasicAttribute()
    },
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
  
async function getChildIPV({ yearly_plan, entity_id, page, paginate }) {
  let yearlyChildOptions = {}

  const queryOptions = {
    limit: Number(paginate),
    offset: (page-1) * Number(paginate),
    where: {
      yearly_plan_id: yearly_plan.id
    },
    include: [
      {
        association: 'master_ipv',
        include: {
          association: 'material',
          attributes: models.Material.getBasicAttribute()
        },
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
      material: child.master_ipv.material.dataValues,
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
    let data = await getChildIPV({ yearly_plan: yearlyPlan, entity_id, page, paginate })
  
    return res.json(data)
  } catch(err) {
    return next(err)
  }
}

export async function update(req, res, next) {
  const t = await models.sequelize.transaction()
  try {
    // update ipv
    let { year, entity_regency_id } = req.params
    let plan = await models.YearlyPlan.findOne({
      where: {
        year,
        entity_regency_id,
      }
    })
    const itemIPVs = req.body
    const user = req.user
    const updateIPV = []
    // itemIPVs
    for await (let item of itemIPVs) {
      let status =  null
      if (plan.status === null) {
        status = 'revision'
      } else {
        status = item.status || 'revision'
      }

      let transactionIPV = models.YearlyPlanIPV.update(
        {
          custom_ipv: item.custom_ipv,
          updated_by: user.id,
          status: status
        },
        {
          where: {
            id: item.id
          },
          transaction: t,
        }
      )
      updateIPV.push(transactionIPV)
    }
    await Promise.all(updateIPV)

    await t.commit()

    return res.status(200).json(req.body)
  } catch(err) {

    await t.rollback()

    return next(err)
  }
}
