/* eslint-disable no-case-declarations */
import stream from 'stream'
import { Op } from 'sequelize'

import models from '../models'

import { USER_ROLE } from '../helpers/constants'
import { 
  countMaterialNonIPV,
  countMaterialIPV,
} from '../helpers/yearlyResultHelper'
import { yearlyPlanResultWorkbook } from '../helpers/xls/excelTemplate'

import * as coldstorageAnnualPlanController from './coldstorageAnnualPlanController'

export async function getYearlyPlan(year, entity_regency_id) {
  return await models.YearlyPlan.findOne({
    where: {
      year,
      entity_regency_id
    },
    include: {
      association: 'regency',
      attributes: ['id', 'name'],
      include: {
        association: 'province',
        attributes: ['id', 'name'],
      }
    }
  })
}

async function countResult({ yearly_plan, user, version }) {
  const yearlyChilds = await models.YearlyChild.findAll({
    where: {
      yearly_plan_id: yearly_plan.id
    },
    include: [{
      association: 'targets'
    }]
  })

  const targetDistributions = await models.MasterTargetDistribution.findAll({
    raw: true
  })

  const insertAttributes = {
    updated_by: user.id,
    created_by: user.id,
    version,
  }
  const inserts = []

  await countMaterialIPV({ yearlyPlanID: yearly_plan.id, yearlyChilds, targetDistributions, insertAttributes, inserts })

  await countMaterialNonIPV({ yearlyChilds, targetDistributions, insertAttributes, inserts })

  await models.YearlyChildResult.bulkCreate(inserts)
}

async function deleteResult({ yearly_plan, user, version }) {
  let arrayOfChild = await models.YearlyChild.findAll({
    attributes: ['id'],
    where: { yearly_plan_id: yearly_plan.id },
    raw: true
  })
  arrayOfChild = arrayOfChild.map(el => { return el.id })
  
  const childResultCondtions = {
    [Op.and]: [ { yearly_child_id: arrayOfChild }, { version } ]
  }
  await models.YearlyChildResult.update(
    { deleted_by: user.id },
    { where: childResultCondtions },
  )
  await models.YearlyChildResult.destroy(
    { where: childResultCondtions },
  )
}

async function formatResult({ yearly_plan, material_id = null, entity_id = null }) {
  const results = []
  let conditionQuery = {}
  if(material_id) {
    conditionQuery = {
      where: {
        material_id: material_id,
      },
    }
  }
  let yearlyChildOptions = {} 
  if(entity_id) {
    yearlyChildOptions = {
      entity_id
    }
  }
  const yearlyResults = await models.YearlyChildResult.findAll({
    ...conditionQuery,
    include: [
      {
        association: 'yearly_child',
        where: {
          yearly_plan_id: yearly_plan.id,
          ...yearlyChildOptions
        },
        include: [{
          association: 'entity',
          attributes: models.Entity.getBasicAttribute(),
          include: {
            association: 'sub_district',
            attributes: ['id', 'name']
          }
        }]
      },
      {
        association: 'material',
        attributes: models.Material.getBasicAttribute()
      },
      {
        association: 'user_updated_by',
        attributes: ['id', 'username', 'email', 'firstname', 'lastname']
      }
    ],
    order: [['material_id', 'ASC']]
  })
  
  for(let result of yearlyResults) {
    // child
    let { id, material_id, yearly_child_id, yearly_need, monthly_need, weekly_need, updated_by, updated_at, ipv } = result
    let monthlyDistribution = []
    for(let month = 1; month <= 12; month++) {
      let date = new Date(2021, month-1)
      monthlyDistribution.push({
        month,
        name: date.toLocaleString('default', { month: 'short' }),
        monthly_need: monthly_need + weekly_need
      })
    }
    let customDistribution = JSON.parse(result.monthly_distribution)
    customDistribution.forEach(item => {
      monthlyDistribution[item.month-1].monthly_need = item.monthly_need
    })
    let data = {
      id, 
      material_id,
      yearly_child_id,
      regency: yearly_plan.regency,
      entity: result.yearly_child.entity,
      material: result.material,
      ipv,
      material_need: {
        yearly_need,
        monthly_need,
        weekly_need,
        min: weekly_need ?? 0,
        max: monthly_need + weekly_need,
        yearly_vial: result.yearly_vial,
        monthly_vial: result.monthly_vial,
        weekly_vial: result.weekly_vial,
      },
      monthly_distribution: monthlyDistribution,
      updated_by,
      user_updated_by: result.user_updated_by,
      updated_at,
      yearly_plan: yearly_plan.dataValues,
    }
    delete data['yearly_child']
    results.push(data)
  }

  return results
}

async function validateTargetIPV({ yearlyPlan }) {
  let incompleteTarget = await models.YearlyChildTarget.findAll({
    where: { custom_qty: 0 },
    include: [{
      association: 'yearly_child',
      where: { yearly_plan_id: yearlyPlan.id },
      required: true,
      include: { association: 'entity', attributes: ['id', 'name'] }
    }, {
      association: 'master_target',
      attributes: ['id', 'name']
    }]
  })

  let incompleteIPV = await models.YearlyPlanIPV.findAll({
    where: { custom_ipv: 0, yearly_plan_id: yearlyPlan.id },
    include: [{
      association: 'master_ipv',
      attributes: ['id', 'material_id'],
      required: true,
      include: { association: 'material', attributes: ['id', 'name']}
    }]
  })

  incompleteTarget = incompleteTarget.map(el => {
    return {
      entity_name: el.yearly_child.entity.name,
      target_name: el.master_target.name
    }
  })
  incompleteIPV = incompleteIPV.map(el => {
    return {
      material_name: el.master_ipv.material.name
    }
  })

  return { incompleteTarget, incompleteIPV }
}

export async function submit(req, res, next) {
  try {
    const { entity_regency_id, year } = req.params
    const user = req.user
    let version = 1

    const yearlyPlan = await getYearlyPlan(year, entity_regency_id)

    if(!yearlyPlan) {
      return res.status(422).json({
        message: 'Data tidak tersedia',
        data: null,
      })
    }

    if(yearlyPlan.submitted_at && user.role !== USER_ROLE.SUPERADMIN) {
      return res.json({
        message: 'Data sudah disubmit',
        data: null,
      })
    }

    const { incompleteTarget, incompleteIPV } = await validateTargetIPV({ yearlyPlan })
    if(incompleteTarget.length > 0 || incompleteIPV.length > 0) {
      return res.status(400).json({
        message: 'Data tidak lengkap',
        data: {
          ipv: incompleteIPV,
          target: incompleteTarget
        },
      })
    }

    let latestResult = await models.YearlyChildResult.findOne({
      include: {
        association: 'yearly_child',
        where: {
          yearly_plan_id: yearlyPlan.id
        },
        required: true
      }
    })

    if(latestResult) {
      version = latestResult.version
      await deleteResult({ yearly_plan: yearlyPlan, user, version })
      version = version + 1
    }

    await countResult({ yearly_plan: yearlyPlan, user, version: version })

    yearlyPlan.submitted_at = new Date()
    yearlyPlan.submitted_by = user.id
    yearlyPlan.status = 'di desk'

    await yearlyPlan.save()

    await coldstorageAnnualPlanController.generateAnnualPlanning(entity_regency_id, year)

    return res.json({message: 'Success'})
  } catch(err) {
    return next(err)
  }
}

export async function askApproval(req, res, next) {
  try {
    const { entity_regency_id, year } = req.params
    const yearlyPlan = await getYearlyPlan(year, entity_regency_id)
    if(!yearlyPlan) {
      return res.json({
        message: 'Data tidak tersedia',
        data: null,
      })
    }

    yearlyPlan.status = 'di desk'
    await yearlyPlan.save()
    return res.json({message: 'Success'})
  } catch(err) {
    return next(err)
  }
}

export async function revision(req, res, next) {
  try {
    const { entity_regency_id, year } = req.params
    const {comment} = req.body
    const yearlyPlan = await getYearlyPlan(year, entity_regency_id)
    if(!yearlyPlan) {
      return res.json({
        message: 'Data tidak tersedia',
        data: null,
      })
    }

    yearlyPlan.submitted_at = null
    yearlyPlan.status = 'revisi'
    yearlyPlan.comment = comment
    await yearlyPlan.save()

    await coldstorageAnnualPlanController.generateAnnualPlanning(entity_regency_id, year)

    return res.json({message: 'Success'})
  } catch(err) {
    return next(err)
  }
}

export async function approve(req, res, next) {
  try {
    const { entity_regency_id, year } = req.params
    const yearlyPlan = await getYearlyPlan(year, entity_regency_id)
    const {comment} = req.body
    if(!yearlyPlan) {
      return res.status(422).json({
        message: 'Data tidak tersedia',
        data: null,
      })
    }

    let ipvs = await models.YearlyPlanIPV.findAll({
      where: {
        yearly_plan_id: yearlyPlan.id
      }
    })

    let childs = await models.YearlyChild.findAll({
      where: {
        yearly_plan_id: yearlyPlan.id
      }
    })

    let childsId = childs.map(child => {
      return child.id
    })

    let targets = await models.YearlyChildTarget.findAll({
      where: {
        yearly_child_id: childsId
      }
    })

    let isApproved = true
    ipvs.forEach(ipv => {
      if(ipv.status !== "approve") {
        isApproved = false
      }
    })

    targets.forEach(target => {
      if(target.status !== "approve") {
        isApproved = false
      }
    })

    if(!isApproved) {
      return res.status(422).json({
        message: 'Ada IPV/Target yang belum disetujui',
        data: null,
      })
    }


    yearlyPlan.status = 'disetujui'
    yearlyPlan.comment = comment
    await yearlyPlan.save()

    await coldstorageAnnualPlanController.generateAnnualPlanning(entity_regency_id, year)
    
    return res.json({message: 'Success'})
  } catch(err) {
    return next(err)
  }
}

export async function detail(req, res, next) {
  try {
    const { entity_regency_id, year } = req.params
    const { material_id, entity_id } = req.query

    const yearlyPlan = await getYearlyPlan(year, entity_regency_id)

    if(!yearlyPlan) {
      return res.status(422).json({
        message: 'Data tidak tersedia',
        data: null,
      })
    }

    let result = await formatResult({ yearly_plan: yearlyPlan, material_id, entity_id })
    return res.status(200).json(
      result
    )
  } catch(err) {
    return next(err)
  }
}

export async function exportExcel(req, res, next) {
  try {
    const { entity_regency_id, year } = req.params
    const yearlyPlan = await models.YearlyPlan.findOne({
      where: { entity_regency_id, year },
      include: {
        association: 'regency',
        attributes: ['id', 'name'],
        include: {
          association: 'province',
          attributes: ['id', 'name'],
        }
      }
    })

    let result = await formatResult({ yearly_plan: yearlyPlan })

    const material = []
    let oldMaterialID = null

    for(let item of result) {
      if(oldMaterialID !== item.material_id) {
        material.push({
          material: item.material,
          year: item.yearly_plan.year,
          regency_name: item.regency.name,
          province_name: item.regency.province?.name || '',
          results: [item]
        })
        oldMaterialID = item.material_id
      } else {
        let idx = material.findIndex(el => el.material.id === item.material_id)
        material[idx]['results'].push(item)
      }
    }
    const workbook = await yearlyPlanResultWorkbook(material)
    
    const timestamp = Date()
    const filename = `Hasil perhitungan ${year}-${yearlyPlan.regency.name} (${timestamp})`

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    const readStream = new stream.PassThrough()
    readStream.end(arrayBuffer)
    res.writeHead(200, {
      'Content-Length': arrayBuffer.length,
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      'Access-Control-Expose-Headers': 'Filename',
      'Filename': `${filename}.xlsx`
    })

    return readStream.pipe(res)
  } catch (error) {
    next(error)
  }
}
