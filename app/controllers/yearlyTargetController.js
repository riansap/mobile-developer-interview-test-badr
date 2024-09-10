import models from '../models'
import { Op } from 'sequelize'
import { ENTITY_TAGS } from '../helpers/constants'
import { translateHeadersToEnglish } from '../helpers/common'

async function getCustomerFromVendor({ regency }) {
  return await models.Entity.findAll({
    where: {
      is_vendor: 1,
      status: 1,
      regency_id: regency.regency_id
    },
    include: [{
      association: 'entity_tags',
      attributes: ['id', 'title'],
      where: { id: ENTITY_TAGS.PUSKESMAS },
      required: true,
    }],
  })
}

async function getTargetChild({ yearly_plan, entity_id = null }) {
  const whereCondition = [{
    yearly_plan_id: yearly_plan.id
  }]
  if (entity_id) whereCondition.push({ entity_id })
  const childs = await models.YearlyChild.findAll({
    where: whereCondition,
    include: [
      {
        association: 'user_updated_by',
        attributes: ['id', 'username', 'email', 'firstname', 'lastname']
      },
      {
        association: 'entity',
        attributes: ['id', 'type_label', 'name', 'address'],
        include: {
          association: 'sub_district',
          attributes: ['id', 'name']
        }
      },
      'targets',
    ],
  })

  return childs.map(child => {
    return {
      ...child.dataValues,
      regency: yearly_plan.regency.dataValues
    }
  })
}

async function getTargetParent({ year, entity_regency_id }) {
  return await models.YearlyPlan.findOne({
    where: {
      year,
      entity_regency_id,
    },
    include: [
      {
        association: 'user_updated_by',
        attributes: ['id', 'username', 'email', 'firstname', 'lastname']
      },
      {
        association: 'regency',
        attributes: ['id', 'code', 'type_label', 'name', 'regency_id'],
      },
      'targets',
    ],
  })
}

async function generateTargetParent({ targets, year, entity_regency_id, user }) {
  const yearlyPlan = await models.YearlyPlan.create({ year, entity_regency_id, step: 1, created_by: user.id })
  const newTargetParents = []
  for (let target of targets) {
    newTargetParents.push({
      master_target_id: target.master_target_id,
      propotion: 100,
      qty: target.qty,
      yearly_plan_id: yearlyPlan.id
    })
  }
  await models.YearlyParentTarget.bulkCreate(newTargetParents)
}

async function generateTargetChild({ yearly_plan, regency, targetIds }) {
  let entities = await getCustomerFromVendor({ regency })

  for await (let entity of entities) {
    let yearlyChild = await models.YearlyChild.create({
      yearly_plan_id: yearly_plan.id,
      entity_id: entity.id,
    })
    for await (let id of targetIds) {
      await models.YearlyChildTarget.create({
        master_target_id: id,
        yearly_child_id: yearlyChild.id,
      })
    }
  }
}

export async function detail(req, res, next) {
  try {
    let { year, entity_regency_id } = req.params
    const { entity_id } = req.query
    const user = req.user
    let parent = await getTargetParent({ year, entity_regency_id })

    if (parent == null) {
      // create from master regencies
      const masterTargetRegencies = await models.MasterTargetRegency.findAll({
        where: { year, entity_id: entity_regency_id }
      })
      if (!masterTargetRegencies.length) return res.json({ message: 'Data Master tidak tersedia', data: null })
      await generateTargetParent({ targets: masterTargetRegencies, year, entity_regency_id, user })
      parent = await getTargetParent({ year, entity_regency_id })
    }

    let hasChild = await models.YearlyChild.count({
      where: { yearly_plan_id: parent.id }
    })
    if (!hasChild) {
      await generateTargetChild({
        yearly_plan: parent,
        regency: parent.regency,
        targetIds: parent.targets.map((item) => item.id),
      })
    }

    let child = await getTargetChild({ yearly_plan: parent, entity_id })

    let lang = req.headers['accept-language']

    if (lang == 'en') {
      for (let item of parent.targets) {
        item.name = translateHeadersToEnglish(item.name)
      }

      for(let item of child){
        for(let itm of item.targets){
          itm.name = translateHeadersToEnglish(itm.name)
        }
      }

    }

    return res.json({
      message: 'success',
      data: {
        parent,
        child,
      },
    })
  } catch (error) {
    return next(error)
  }
}

export async function update(req, res, next) {
  try {
    let { year, entity_regency_id } = req.params
    let plan = await models.YearlyPlan.findOne({
      where: {
        year,
        entity_regency_id,
      }
    })
    const parent = await getTargetParent({ year, entity_regency_id })
    const user = req.user
    if (parent == null) {
      return res.json({
        message: 'Data tidak tersedia',
        data: null,
      })
    }

    const child = await getTargetChild({ yearly_plan: parent })

    if (child == null) {
      return res.json({
        message: 'Data tidak tersedia',
        data: null,
      })
    }

    let body = req.body

    await models.sequelize.transaction(async (t) => {
      let updateParent = []
      for await (let target of body.parent.targets) {
        let status = null
        if (plan.status === null) {
          status = 'revision'
        } else {
          status = target.status || 'revision'
        }
        let p = models.YearlyParentTarget.update(
          {
            propotion: target.propotion,
            custom_qty: target.custom_qty,
            status: status
          },
          {
            where: {
              master_target_id: target.id,
              yearly_plan_id: body.parent.id,
            },
            transaction: t,
          }
        )
        updateParent.push(p)
      }
      await models.YearlyPlan.update({ updated_by: user.id }, {
        where: {
          id: body.parent.id
        },
        transaction: t
      })

      // concurrent update
      // eslint-disable-next-line no-undef
      await Promise.all(updateParent)

      let updateChild = []
      const childIds = []
      for await (let item of body.childs) {
        childIds.push(item.id)
        for await (let target of item.targets) {
          let status = null
          if (plan.status === null) {
            status = "revision"
          } else {
            status = target.status
          }
          console.log("YearlyChildTarget", status)
          let p = models.YearlyChildTarget.update(
            {
              propotion: target.propotion,
              custom_qty: target.custom_qty,
              qty: target.qty,
              status: status
            },
            {
              where: {
                master_target_id: target.id,
                yearly_child_id: item.id,
              },
              transaction: t,
            }
          )

          updateChild.push(p)
        }
      }
      // eslint-disable-next-line no-undef
      await Promise.all(updateChild)

      await models.YearlyChild.update({ updated_by: user.id }, {
        where: {
          id: {
            [Op.in]: childIds
          }
        },
        transaction: t
      })
    })
    const parent_updated = getTargetParent({ year, entity_regency_id })
    const child_updated = getTargetChild({ yearly_plan: parent })

    // eslint-disable-next-line no-undef
    const updated = await Promise.all([parent_updated, child_updated])

    return res.json({
      message: 'Success',
      data: {
        parent: updated[0],
        child: updated[1],
      },
    })
  } catch (error) {
    return next(error)
  }
}

export async function nextStep(req, res, next) {
  // get to next step
  const { entity_regency_id, year } = req.params
  const { step } = req.body
  try {
    // 
    let formStep = await models.YearlyPlan.findOne({
      where: { entity_regency_id, year }
    })
    if (formStep) {
      formStep.updated_by = req.user.id
      formStep.step = step
      await formStep.save()
    }
    return res.json({
      formStep
    })
  } catch (err) {
    return next(err)
  }
}

export async function lastStep(req, res, next) {
  const { entity_regency_id, year } = req.params
  try {
    const yearlyPlan = await models.YearlyPlan.findOne({
      where: {
        year,
        entity_regency_id,
      },
    })

    if (!yearlyPlan) {
      return res.status(204).json({})
    }
    let targets = await models.YearlyChildTarget.findAll({
      include: [
        {
          association: 'yearly_child',
          where: {
            yearly_plan_id: yearlyPlan.id
          }
        },
      ],
    })

    let targetStatus = 'approve'
    if (targets.length >= 0) {
      targets.forEach(target => {
        if (target.status === 'revision') {
          targetStatus = 'revision'
        }
      })
    }

    let ipvs = await models.YearlyPlanIPV.findAll({
      where: {
        yearly_plan_id: yearlyPlan.id,
      },
    })

    let ipvStatus = 'approve'
    if (ipvs.length >= 0) {
      ipvs.forEach(ipv => {
        if (ipv.status === 'revision') {
          ipvStatus = 'revision'
        }
      })
    }

    return res.json({
      yearlyPlan,
      status: {
        targetStatus,
        ipvStatus
      }
    })
  } catch (err) {
    console.log(err)
    return next(err)
  }
}
