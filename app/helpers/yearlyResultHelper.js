import models from '../models'

import { YEARLY_NEED_MATERIAL_ID, MASTER_TARGET_ID, MATERIAL_CUSTOM_DISTRIBUTION, BIAS_MATERIAL } from './constants'

function isBiasMaterial(material_id) {
  return BIAS_MATERIAL.includes(material_id)
}

function getMaterialMonthDistribution({ material_id, monthly_need = 0, target_distributions = [], yearly_child = {}, inserts = [] }) {
  // console.log('------------------Count Month Distribution-------------------')
  // return 
  let monthlyDistributions = []
  switch (material_id) {
  case YEARLY_NEED_MATERIAL_ID.ADS_05_BIAS:
  {
    let ADSDistributions = [
      {
        month: 8,
        materials: [
          YEARLY_NEED_MATERIAL_ID.MR_BIAS,
          YEARLY_NEED_MATERIAL_ID.HPV_BIAS
        ]
      },
      {
        month: 11,
        materials: [
          YEARLY_NEED_MATERIAL_ID.DT_BIAS,
          YEARLY_NEED_MATERIAL_ID.TD_BIAS,
        ]
      }
    ]
    ADSDistributions.forEach(ads => {
      const { month, materials } = ads
      const monthly_need = getYearlyNeedFormula2({
        materialChilds: materials,
        targetDistributions: target_distributions,
        yearly_child
      })
      monthlyDistributions.push({
        month, monthly_need
      })
    })
    break
  }
  case YEARLY_NEED_MATERIAL_ID.SB_25_BIAS:
  case YEARLY_NEED_MATERIAL_ID.SB_5_BIAS:
  {
    let SBDistributions = [
      {
        month: 8,
        materials: [
          YEARLY_NEED_MATERIAL_ID.MR_BIAS,
          YEARLY_NEED_MATERIAL_ID.HPV_BIAS
        ]
      },
      {
        month: 11,
        materials: [
          YEARLY_NEED_MATERIAL_ID.DT_BIAS,
          YEARLY_NEED_MATERIAL_ID.TD_BIAS,
        ]
      }
    ]
    SBDistributions.forEach(sb => {
      const { month, materials } = sb
      const yearlyNeed = getYearlyNeedFormula2({
        materialChilds: materials,
        targetDistributions: target_distributions,
        yearly_child
      })
      // let masterDistributions = target_distributions.filter(el => el.material_id === YEARLY_NEED_MATERIAL_ID.MR_BIAS)
      let ADS_5 = 0
      if (month === 8) {
        ADS_5 = inserts.find(el => el.material_id === YEARLY_NEED_MATERIAL_ID.ADS_5_BIAS)['yearly_need'] ?? 0
      }
      const divider = material_id === YEARLY_NEED_MATERIAL_ID.SB_5_BIAS ? 100 : 50
      const monthly_need = Math.ceil((yearlyNeed + ADS_5) / divider)
      // console.log(`SB_5_month_distribution ${yearlyNeed}+${ADS_5}/${divider} = ${monthly_need}`)
      monthlyDistributions.push({
        month, monthly_need
      })
    })
    break
  }
  default:
    MATERIAL_CUSTOM_DISTRIBUTION.forEach(itemDistribution => {
      const { material_id: customMaterial, months } = itemDistribution
      if (material_id === customMaterial) {
        months.forEach(month => {
          monthlyDistributions.push({
            month, monthly_need
          })
        })
      }
    })
    break
  }
  return JSON.stringify(monthlyDistributions)
}

function getYearlyNeedFormula1({ ipv, masterDistributions = [], targets = [] }) {
  // Jumlah Kelompok sasaran per puskesmas * jml pemberian Vaksin u. kelompok sasaran * 100%) / IP Vaksin di Puskesmas
  let yearlyNeed = 0
  for (let masterDistribution of masterDistributions) {
    let materialNeed = 0
    let childTarget = targets.find(el => {
      return el.id === masterDistribution.master_target_id
    })
    // console.log('result', childTarget.YearlyChildTarget.custom_qty+' * '+masterDistribution.qty+' / '+childIPV.YearlyChildIPV.custom_ipv) * piece_per_unit
    let jmPemberian = (childTarget.YearlyChildTarget.custom_qty * masterDistribution.qty)
    if (masterDistribution.master_target_id === MASTER_TARGET_ID.WANITA_USIA_SUBUR) {
      jmPemberian = jmPemberian * (20 / 100)
    }
    materialNeed = Math.ceil(
      jmPemberian / ipv
    )
    yearlyNeed = yearlyNeed + materialNeed
  }
  return yearlyNeed
}

function getYearlyNeedFormula2({ materialChilds = [], targetDistributions = [], yearly_child }) {
  // find
  // Jumlah Kelompok sasaran per puskesmas * jml pemberian Vaksin u. kelompok sasaran
  let yearlyNeed = 0
  let masterDistributions = targetDistributions.filter(element => {
    return materialChilds.includes(element.material_id)
  })
  for (let masterDistribution of masterDistributions) {
    let materialNeed = 0
    let childTarget = yearly_child.targets.find(el => {
      return el.id === masterDistribution.master_target_id
    })
    // Jumlah Kelompok sasaran per puskesmas * jml pemberian Vaksin u. kelompok sasaran
    materialNeed = childTarget.YearlyChildTarget.custom_qty * masterDistribution.qty
    if (masterDistribution.master_target_id === MASTER_TARGET_ID.WANITA_USIA_SUBUR) {
      materialNeed = materialNeed * (20 / 100)
    }
    yearlyNeed = yearlyNeed + materialNeed
  }
  return yearlyNeed
}

function setResultNeedObj() {
  return {
    yearly_need: 0,
    monthly_need: 0,
    weekly_need: 0,
  }
}

function getYearlyNeedCustom({ inserts, material_id, yearly_child, targetDistributions = [] }) {
  // console.log('------------------Count Custom Material-------------------'+material_id)
  let yearlyNeed = 0
  let resultNeed = setResultNeedObj()
  let materialSB = [
    YEARLY_NEED_MATERIAL_ID.ADS_005,
    YEARLY_NEED_MATERIAL_ID.ADS_05,
    YEARLY_NEED_MATERIAL_ID.ADS_5,
    YEARLY_NEED_MATERIAL_ID.HepB
  ]
  let materialSB_BIAS = [
    YEARLY_NEED_MATERIAL_ID.ADS_05_BIAS,
    YEARLY_NEED_MATERIAL_ID.ADS_5_BIAS,
  ]
  inserts = inserts.filter(el =>
    el.yearly_child_id === yearly_child.id
  )

  switch (material_id) {
  case YEARLY_NEED_MATERIAL_ID.ADS_005:
  {
    yearlyNeed = getYearlyNeedFormula2({
      materialChilds: [YEARLY_NEED_MATERIAL_ID.BCG],
      targetDistributions,
      yearly_child
    })
    resultNeed = {
      yearly_need: yearlyNeed,
      monthly_need: Math.ceil(yearlyNeed / 12),
      weekly_need: Math.ceil(Math.ceil(yearlyNeed / 12) / 4)
    }
    break
  }
  case YEARLY_NEED_MATERIAL_ID.ADS_05:
  {
    let materialADS_05 = [
      YEARLY_NEED_MATERIAL_ID.DPT_HB,
      YEARLY_NEED_MATERIAL_ID.MR,
      YEARLY_NEED_MATERIAL_ID.TD,
      YEARLY_NEED_MATERIAL_ID.IPV,
      YEARLY_NEED_MATERIAL_ID.PCV_MDV,
      YEARLY_NEED_MATERIAL_ID.JE_5_DS
    ]
    yearlyNeed = getYearlyNeedFormula2({
      materialChilds: materialADS_05,
      targetDistributions,
      yearly_child
    })
    resultNeed = {
      yearly_need: yearlyNeed,
      monthly_need: Math.ceil(yearlyNeed / 12),
      weekly_need: Math.ceil(Math.ceil(yearlyNeed / 12) / 4)
    }
    break
  }
  case YEARLY_NEED_MATERIAL_ID.ADS_5:
  {
    resultNeed = setResultNeedObj()
    let materialADS_5 = [
      YEARLY_NEED_MATERIAL_ID.BCG,
      YEARLY_NEED_MATERIAL_ID.MR,
    ]
    let piecePerUnits = [
      { material_id: YEARLY_NEED_MATERIAL_ID.BCG, pieces_per_unit: 20 },
      { material_id: YEARLY_NEED_MATERIAL_ID.MR, pieces_per_unit: 10 },
    ]
    inserts.filter(el =>
      materialADS_5.includes(el.material_id)
    ).forEach(el => {
      let piecePerUnit = piecePerUnits.find(piece => piece.material_id === el.material_id)
      piecePerUnit = piecePerUnit.pieces_per_unit ?? 1
      // console.log('Piece per unit', piecePerUnit)
      resultNeed['yearly_need'] += el.yearly_need / piecePerUnit
      resultNeed['monthly_need'] += el.monthly_need / piecePerUnit
      resultNeed['weekly_need'] += el.weekly_need / piecePerUnit
    })
    break
  }
  case YEARLY_NEED_MATERIAL_ID.SB_25:
  case YEARLY_NEED_MATERIAL_ID.SB_5:
    resultNeed = setResultNeedObj()
    inserts.filter(el =>
      materialSB.includes(el.material_id)
    ).forEach(el => {
      resultNeed['yearly_need'] += el.yearly_need
      resultNeed['monthly_need'] += el.monthly_need
      resultNeed['weekly_need'] += el.weekly_need
    })
    Object.keys(resultNeed).forEach(key => {
      let divider = 50
      if (material_id === YEARLY_NEED_MATERIAL_ID.SB_5) {
        divider = 100
      }
      resultNeed[key] = Math.round(resultNeed[key] / divider)
    })
    break
  case YEARLY_NEED_MATERIAL_ID.BCG_pelarut:
  {
    let bcgPelarutNeed = inserts.find(el =>
      el.material_id === YEARLY_NEED_MATERIAL_ID.BCG
    )
    resultNeed = {
      yearly_need: bcgPelarutNeed['yearly_need'],
      monthly_need: bcgPelarutNeed['monthly_need'],
      weekly_need: bcgPelarutNeed['weekly_need'],
    }
    break
  }
  case YEARLY_NEED_MATERIAL_ID.MR_pelarut:
  {
    let mrPelarutNeed = inserts.find(el =>
      el.material_id === YEARLY_NEED_MATERIAL_ID.MR
    )
    resultNeed = {
      yearly_need: mrPelarutNeed['yearly_need'],
      monthly_need: mrPelarutNeed['monthly_need'],
      weekly_need: mrPelarutNeed['weekly_need'],
    }
    break
  }
  case YEARLY_NEED_MATERIAL_ID.MR_BIAS_pelarut:
  {
    let mrBias = inserts.find(el =>
      el.material_id === YEARLY_NEED_MATERIAL_ID.MR_BIAS
    )
    resultNeed = {
      yearly_need: mrBias['yearly_need'],
      monthly_need: mrBias['monthly_need'],
      weekly_need: mrBias['weekly_need'],
    }
    break
  }
  case YEARLY_NEED_MATERIAL_ID.Polio_dropper:
  {
    let polioDropperNeed = inserts.find(el =>
      el.material_id === YEARLY_NEED_MATERIAL_ID.Polio
    )
    resultNeed = {
      yearly_need: polioDropperNeed['yearly_need'] / 10,
      monthly_need: polioDropperNeed['monthly_need'] / 10,
      weekly_need: polioDropperNeed['weekly_need'] / 10,
    }
    break
  }
  case YEARLY_NEED_MATERIAL_ID.ADS_05_BIAS:
  {
    let materialADS_05_BIAS = [
      YEARLY_NEED_MATERIAL_ID.MR_BIAS,
      YEARLY_NEED_MATERIAL_ID.DT_BIAS,
      YEARLY_NEED_MATERIAL_ID.TD_BIAS,
      YEARLY_NEED_MATERIAL_ID.HPV_BIAS
    ]
    yearlyNeed = getYearlyNeedFormula2({
      materialChilds: materialADS_05_BIAS,
      targetDistributions,
      yearly_child
    })
    resultNeed = {
      yearly_need: yearlyNeed,
      monthly_need: Math.ceil(yearlyNeed / 12),
      weekly_need: Math.ceil(Math.ceil(yearlyNeed / 12) / 4)
    }
    break
  }
  case YEARLY_NEED_MATERIAL_ID.ADS_5_BIAS:
  {
    let ads5Bias = inserts.find(el =>
      el.material_id === YEARLY_NEED_MATERIAL_ID.MR_BIAS
    )
    resultNeed = {
      yearly_need: ads5Bias['yearly_need'] / 10,
      monthly_need: ads5Bias['monthly_need'] / 10,
      weekly_need: ads5Bias['weekly_need'] / 10,
    }
    break
  }
  case YEARLY_NEED_MATERIAL_ID.SB_25_BIAS:
  case YEARLY_NEED_MATERIAL_ID.SB_5_BIAS:
    resultNeed = setResultNeedObj()
    inserts.filter(el =>
      materialSB_BIAS.includes(el.material_id)
    ).forEach(el => {
      resultNeed['yearly_need'] += el.yearly_need
      resultNeed['monthly_need'] += el.monthly_need
      resultNeed['weekly_need'] += el.weekly_need
    })
    Object.keys(resultNeed).forEach(key => {
      let divider = 50
      if (material_id === YEARLY_NEED_MATERIAL_ID.SB_5_BIAS) {
        divider = 100
      }
      resultNeed[key] = Math.round(resultNeed[key] / divider)
    })
    break
  case YEARLY_NEED_MATERIAL_ID.JE_Pelarut:
  {
    resultNeed = setResultNeedObj()
    inserts.filter(el =>
      el.material_id == YEARLY_NEED_MATERIAL_ID.JE_5_DS
    ).forEach(el => {
      resultNeed['yearly_need'] += el.yearly_need
      resultNeed['monthly_need'] += el.monthly_need
      resultNeed['weekly_need'] += el.weekly_need
    })
    break
  }
  case YEARLY_NEED_MATERIAL_ID.Rotavac_Dropper:
  {
    resultNeed = setResultNeedObj()
    inserts.filter(el =>
      el.material_id == YEARLY_NEED_MATERIAL_ID.Rotavac_Rotavirus
    ).forEach(el => {
      resultNeed['yearly_need'] += el.yearly_need
      resultNeed['monthly_need'] += el.monthly_need
      resultNeed['weekly_need'] += el.weekly_need
    })
    break
  }
  }



  return resultNeed
}

export async function countMaterialIPV({ yearlyPlanID, yearlyChilds, targetDistributions, insertAttributes, inserts }) {
  const yearlyPlanIPV = await models.YearlyPlanIPV.findAll({
    where: { yearly_plan_id: yearlyPlanID },
    include: [{
      association: 'master_ipv',
      attributes: ['id', 'material_id', 'activity_id', 'master_material_id'],
      required: true,
      include: [{
        association: 'material',
        attributes: ['id', 'pieces_per_unit']
      }]
    }]
  })
  for (let child of yearlyChilds) {
    const { id: childID } = child
    for (let parentIPV of yearlyPlanIPV) {
      console.log(parentIPV)
      const { master_ipv, custom_ipv } = parentIPV
      let masterDistributions = targetDistributions.filter(element => {
        return element.material_id === master_ipv.material_id
      })

      const yearlyNeed = getYearlyNeedFormula1({ ipv: custom_ipv, masterDistributions, targets: child.targets })
      let monthlyNeed = Math.ceil(yearlyNeed / 12)
      let piecePerUnit = master_ipv.material ? (master_ipv.material.pieces_per_unit ?? 0) : 0
      if (masterDistributions.length > 0) {
        const data = {
          material_id: master_ipv.material_id,
          yearly_child_id: childID,
          yearly_need: yearlyNeed * piecePerUnit,
          yearly_vial: yearlyNeed,
          ipv: custom_ipv,
          monthly_distribution: getMaterialMonthDistribution({
            material_id: master_ipv.material_id,
            monthly_need: yearlyNeed * piecePerUnit,
            target_distributions: targetDistributions,
            yearly_child: child,
          }),
          activity_id: master_ipv.activity_id,
          master_material_id: master_ipv.master_material_id,
          ...insertAttributes
        }
        if (!isBiasMaterial(master_ipv.material_id)) {
          data['monthly_need'] = monthlyNeed * piecePerUnit
          data['monthly_vial'] = monthlyNeed
          data['weekly_need'] = Math.ceil(monthlyNeed / 4) * piecePerUnit
          data['weekly_vial'] = Math.ceil(monthlyNeed / 4)
        }
        inserts.push(data)
      }
    }
  }
}

export async function countMaterialNonIPV({ yearlyChilds, targetDistributions, insertAttributes, inserts }) {
  // count non target distribution
  const materialNonIPVs = await models.MasterIPV.findAll({
    where: { has_ipv: 0 },
    order: [['material_id', 'ASC']]
  })
  for (let child of yearlyChilds) {
    for (let nonIPV of materialNonIPVs) {
      const { material_id: nonIPVMaterialID } = nonIPV

      let { yearly_need, monthly_need, weekly_need } = getYearlyNeedCustom({ inserts, material_id: nonIPVMaterialID, yearly_child: child, targetDistributions })

      const data = {
        material_id: nonIPVMaterialID,
        yearly_child_id: child.id,
        yearly_need,
        ipv: 0,
        monthly_distribution: getMaterialMonthDistribution({
          material_id: nonIPVMaterialID,
          monthly_need: yearly_need,
          target_distributions: targetDistributions,
          yearly_child: child,
          inserts: inserts.filter(el => el.yearly_child_id === child.id)
        }),
        master_material_id: nonIPV.master_material_id,
        activity_id: nonIPV.activity_id,
        ...insertAttributes
      }
      if (!isBiasMaterial(nonIPVMaterialID)) {
        data['monthly_need'] = monthly_need
        data['weekly_need'] = weekly_need
      }
      inserts.push(data)
    }
  }
}