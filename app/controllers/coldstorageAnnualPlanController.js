import models from '../models'
import { formatRelationsCount } from '../helpers/common'
import listResponse from '../helpers/listResponse'
import _ from 'lodash'

import { annualPlanningDetailXLS, annualPlannningXLS } from '../helpers/xls/coldstorageAnnualPlanWorkbook'
import stream from 'stream'
import { Op, Sequelize, where } from 'sequelize'


export async function filter(req, res, next) {
    let {
        year,
        province_id,
        regency_id,
        entity_id,
        entity_tag_id,
        status_capacity
    } = req.query

    let entityCondition = []
    let condition = []

    if (year) condition.push({ year })
    if (entity_id) {
        entity_id = entity_id.split(',').map(val => Number(val))
        condition.push({ entity_id })
    }

    let entityOptions = {}
    if (province_id) {
        province_id = province_id.split(',').map((val) => Number(val))
        entityCondition.push({ province_id })
    }
    if (regency_id) {
        regency_id = regency_id.split(',').map(val => Number(val))
        entityCondition.push({ regency_id })
    }

    if (entityCondition.length > 0)
        entityOptions = { where: entityCondition }

    let include = [
        {
            association: 'entity',
            attributes: ['id', 'name', 'province_id', 'regency_id', 'type'],
            include: [
                {
                    association: 'province',
                    attributes: ['id', 'name']
                },
                {
                    association: 'regency',
                    attributes: ['id', 'name']
                }
            ],
            required: true,
            ...entityOptions
        }
    ]

    let attributes = models.ColdstorageAnnualPlanning.getBasicAttribute()

    if (status_capacity) {
        const conditionCapacity = []
        for (let statusCap of status_capacity.split(',')) {
            switch (Number(statusCap)) {
                case 1:
                    conditionCapacity.push({
                        [Op.and]: [
                            { yearly_volume_need_percent: { [Op.gt]: 0 } },
                            { yearly_volume_need_percent: { [Op.lte]: 20 } },
                        ]
                    })
                    break
                case 2:
                    conditionCapacity.push({
                        [Op.and]: [
                            { yearly_volume_need_percent: { [Op.gt]: 20 } },
                            { yearly_volume_need_percent: { [Op.lte]: 80 } },
                        ]
                    })
                    break
                case 3:
                    conditionCapacity.push({
                        yearly_volume_need_percent: { [Op.gt]: 80 }
                    })
                    break
                case 4:
                    conditionCapacity.push({
                        [Op.or]: [
                            { yearly_volume_need_percent: 0 },
                            { yearly_volume_need_percent: { [Op.eq]: null } },
                        ]
                    })
            }
        }

        condition.push({
            [Op.or] : conditionCapacity
        })

        attributes.push(
            [
                Sequelize.literal(`
                      CASE 
                        WHEN yearly_volume_need_percent = 0 THEN 4
                        WHEN yearly_volume_need_percent > 80 THEN 3
                        WHEN CEIL(yearly_volume_need_percent) BETWEEN 21 AND 80 THEN 2
                        WHEN CEIL(yearly_volume_need_percent) BETWEEN 1 AND 20 THEN 1
                        ELSE 4
                      END
                    `),
                'status_capacity'
            ]
        )
    }

    if (entity_tag_id) {
        entity_tag_id = entity_tag_id.split(',').map(val => Number(val))
        include[0].include.push({
            association: 'entity_tags',
            attributes: ['id'],
            through: { attributes: [] },
            where: { id: entity_tag_id },
            required: true
        })
    }

    req.include = include
    req.condition = condition
    req.attributes = attributes
    req.order = [[{ model: models.Entity, as: 'entity' }, 'type', 'asc'], [{ model: models.Entity, as: 'entity' }, 'province_id', 'asc'], [{ model: models.Entity, as: 'entity' }, 'regency_id', 'asc']]
    return next()
}

export async function list(req, res, next) {
    try {
        const { page = 1, paginate = 10 } = req.query
        const path = req.path

        const { condition = [], include, order, attributes } = req

        const options = {
            attributes,
            include,
            order,
            limit: Number(paginate),
            offset: (Number(page) - 1) * Number(paginate),
            where: condition,
            duplicating: false,
            subQuery: false
        }

        const countOptions = {
            ...options,
            include: formatRelationsCount(options.include, condition),
        }

        if (path.includes('xls')) {
            delete options.limit
            delete options.offset
        }

        let docs = await models.ColdstorageAnnualPlanning.findAll(options)
        let total = await models.ColdstorageAnnualPlanning.count(countOptions)

        if (path.includes('xls')) {
            const workbook = await annualPlannningXLS(docs)
            const filename = `Coldstorage Annual Planning ${Date()}`

            const arrayBuffer = await workbook.xlsx.writeBuffer()
            const readStream = new stream.PassThrough()
            readStream.end(arrayBuffer)
            res.writeHead(200, {
                'Content-Length': arrayBuffer.length,
                'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
                'Access-Control-Expose-Headers': 'Filename',
                Filename: `${filename}.xlsx`,
            })

            return readStream.pipe(res)
        }

        if (Array.isArray(docs) && docs.length <= 0) {
            throw { status: 204, message: req.__('204') }
        }

        return res.status(200).json(listResponse(total, page, paginate, docs))
    } catch (error) {
        console.log(error)
        next(error)
    }
}

function extractMonthlyDistribution(item, newData, yearly_volume) {
    let monthlyDistribution = JSON.parse(item.monthly_distribution)

    for (let monthlyDist of monthlyDistribution) {
        newData.yearly_volume_need += yearly_volume

        if (monthlyDist.month === 8) {
            newData.peak_volume_q3 += yearly_volume
            newData.peak_volume_augustus += yearly_volume
        }
        if (monthlyDist.month === 11) {
            newData.peak_volume_q4 += yearly_volume
            newData.peak_volume_november += yearly_volume
        }
    }

}

function formatDecimal(value) {
    return Number(value.toFixed(2))
}

function countYearlyBox(yearly_vial, materialVolume) {
    let { unit_per_box = 0 } = materialVolume || {}
    let box = unit_per_box ? yearly_vial / unit_per_box : 0
    return Math.ceil(box)
}

function countYearlyVolume(yearly_vial, materialVolume) {
    let { box_length = 0, box_width = 0, box_height = 0 } = materialVolume || {}
    let box = countYearlyBox(yearly_vial, materialVolume)
    let volume = ((box_length * box_width * box_height) / 1000)
    let yearly_volume = box * volume
    return formatDecimal(yearly_volume)
}


async function generateAnnualPlanningPerTemperature(data, t) {
    const keysToUpdate = ['yearly_volume_need', 'yearly_volume', 'quartal_volume', 'peak_volume_q3', 'peak_volume_q4', 'monthly_volume', 'peak_volume_augustus', 'peak_volume_november',]

    let insertData = []
    for (let key in data) {
        let newData = {
            entity_id: data[key][0].entity_id,
            year: data[key][0].year,
            range_temperature_id: data[key][0].range_temperature_id,
        }

        for (let keyIndex of keysToUpdate) newData[keyIndex] = 0

        for (let i = 0; i < data[key].length; i++) {
            let item = data[key][i]
            let { yearly_volume } = item
            let monthlyDistribution = JSON.parse(item.monthly_distribution)
            if (monthlyDistribution.length <= 0) {
                newData.yearly_volume += yearly_volume
            } else
                extractMonthlyDistribution(item, newData, yearly_volume)
        }

        newData.yearly_volume_need = formatDecimal(newData.yearly_volume_need + newData.yearly_volume)
        newData.yearly_volume = formatDecimal(newData.yearly_volume)
        newData.quartal_volume = formatDecimal((newData.yearly_volume / 4))
        newData.peak_volume_q3 = formatDecimal(newData.peak_volume_q3 + newData.quartal_volume)
        newData.peak_volume_q4 = formatDecimal(newData.peak_volume_q4 + newData.quartal_volume)
        newData.monthly_volume = formatDecimal(newData.yearly_volume / 12)
        newData.peak_volume_augustus = formatDecimal(newData.peak_volume_augustus + newData.monthly_volume)
        newData.peak_volume_november = formatDecimal(newData.peak_volume_november + newData.monthly_volume)

        insertData.push(newData)
    }

    await models.ColdstorageAnnualPlanningTemperature.bulkCreate(insertData, {
        ignoreDuplicates: true,
        updateOnDuplicate: keysToUpdate,
        transaction: t
    })
}

function collectDataByEntityTemperature(key1, key2, newDataTemperature, item) {
    if (newDataTemperature[`${key1}-${key2}`]) {
        newDataTemperature[`${key1}-${key2}`].push({ ...item, entity_id: key1, range_temperature_id: key2 })
    } else newDataTemperature[`${key1}-${key2}`] = [{ ...item, entity_id: key1, range_temperature_id: key2 }]
}

export async function generateAnnualPlanning(entity_regency_id, year) {
    const t = await models.sequelize.transaction()
    const keysToUpdate = ['yearly_volume_need', 'yearly_volume', 'quartal_volume', 'peak_volume_q3', 'peak_volume_q4', 'monthly_volume', 'peak_volume_augustus', 'peak_volume_november',]
    try {
        const yearlyPlan = await models.YearlyPlan.findOne({
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

        if (!yearlyPlan) {
            return {
                status: 422,
                message: 'Data yearly plan tidak tersedia'
            }
        }

        let yearlyChildResults = await models.YearlyChildResult.findAll({
            include: [{
                association: 'yearly_child',
                where: {
                    yearly_plan_id: yearlyPlan.id
                },
                required: true
            },
            {
                association: 'master_material',
                attributes: ['id', 'name', 'is_vaccine', 'range_temperature_id'],
                where: { is_vaccine: 1, range_temperature_id: { [Op.gt]: 0 } },
                required: true
            }
            ],
            raw: true
        })

        if (yearlyChildResults.length <= 0)
            return {
                status: 422,
                message: 'Data yearly child result tidak tersedia'
            }

        let data = _.groupBy(yearlyChildResults, 'yearly_child.entity_id')
        let materialIds = _.keys(_.groupBy(yearlyChildResults, 'master_material_id'))
        let materialVolumes = await models.MasterVolumeMaterialManufacture.findAll({
            where: { master_material_id: materialIds }
        })

        let entityIds = _.keys(data)

        entityIds.push(entity_regency_id)

        const coldstorages = await models.Coldstorage.findAll({
            where: { entity_id: entityIds }
        })

        const csGroupByEntity = _.groupBy(coldstorages, 'entity_id')
        const entityCapacityNett = {}

        for (let key in csGroupByEntity) {
            entityCapacityNett[key] = csGroupByEntity[key][0].volume_asset
        }

        let results = []

        let newDataTemperature = {}

        let newDataBigEntity = {
            year,
            entity_id: entity_regency_id,
            yearly_volume_need: 0,
            yearly_volume: 0,
            quartal_volume: 0,
            peak_volume_q3: 0,
            peak_volume_q4: 0,
            monthly_volume: 0,
            peak_volume_augustus: 0,
            peak_volume_november: 0,
            yearly_child_id: null,
            yearly_volume_need_percent: 0,
            yearly_volume_percent: 0,
            quartal_volume_percent: 0,
            peak_volume_q3_percent: 0,
            peak_volume_q4_percent: 0,
            monthly_volume_percent: 0,
            peak_volume_augustus_percent: 0,
            peak_volume_november_percent: 0,
        }

        for (let key in data) {
            let newData = {
                year,
                entity_id: Number(key),
                yearly_volume_need: 0,
                yearly_volume: 0,
                quartal_volume: 0,
                peak_volume_q3: 0,
                peak_volume_q4: 0,
                monthly_volume: 0,
                peak_volume_augustus: 0,
                peak_volume_november: 0,
                yearly_child_id: null,
                yearly_volume_need_percent: 0,
                yearly_volume_percent: 0,
                quartal_volume_percent: 0,
                peak_volume_q3_percent: 0,
                peak_volume_q4_percent: 0,
                monthly_volume_percent: 0,
                peak_volume_augustus_percent: 0,
                peak_volume_november_percent: 0
            }

            for (let item of data[key]) {
                const { master_material_id } = item
                let monthlyDistribution = JSON.parse(item.monthly_distribution)
                let materialVolume = materialVolumes.filter(it => it.master_material_id === master_material_id)
                materialVolume = materialVolume.length > 0 ? materialVolume[0] : {}
                let yearly_volume = countYearlyVolume(item.yearly_vial, materialVolume)

                if (monthlyDistribution.length <= 0) {
                    newData.yearly_volume += yearly_volume
                } else
                    extractMonthlyDistribution(item, newData, yearly_volume)

                newData.yearly_child_id = item.yearly_child_id

                collectDataByEntityTemperature(key, item['master_material.range_temperature_id'], newDataTemperature, { ...item, yearly_volume, year })
                collectDataByEntityTemperature(entity_regency_id, item['master_material.range_temperature_id'], newDataTemperature, { ...item, yearly_volume, year })
            }
            newData.yearly_volume_need += newData.yearly_volume

            newData.yearly_volume_need = formatDecimal(newData.yearly_volume_need)
            newData.yearly_volume = formatDecimal(newData.yearly_volume)
            newData.quartal_volume = formatDecimal((newData.yearly_volume / 4))
            newData.peak_volume_q3 = formatDecimal(newData.peak_volume_q3 + newData.quartal_volume)
            newData.peak_volume_q4 = formatDecimal(newData.peak_volume_q4 + newData.quartal_volume)
            newData.monthly_volume = formatDecimal(newData.yearly_volume / 12)
            newData.peak_volume_augustus = formatDecimal(newData.peak_volume_augustus + newData.monthly_volume)
            newData.peak_volume_november = formatDecimal(newData.peak_volume_november + newData.monthly_volume)

            let capacityNett = entityCapacityNett[newData.entity_id] ?? 0
            let capacityNettBig = entityCapacityNett[entity_regency_id] ?? 0

            for (let keyIndex of keysToUpdate) {
                let percentageValue = capacityNett ? (newData[keyIndex] / capacityNett) * 100 : 0
                newData[`${keyIndex}_percent`] = formatDecimal(percentageValue)

                newDataBigEntity[keyIndex] += formatDecimal(newData[keyIndex])
                newDataBigEntity[keyIndex] = formatDecimal(newDataBigEntity[keyIndex])

                let percentageValueBig = capacityNettBig ? (newDataBigEntity[keyIndex] / capacityNettBig) * 100 : 0
                newDataBigEntity[`${keyIndex}_percent`] = formatDecimal(percentageValueBig)
            }

            results.push(newData)
        }



        results.push(newDataBigEntity)

        let columnToUpdate = [...keysToUpdate]
        for (let key of keysToUpdate) columnToUpdate.push(key + '_percent')

        await models.ColdstorageAnnualPlanning.bulkCreate(results, {
            ignoreDuplicates: true,
            updateOnDuplicate: columnToUpdate,
            transaction: t
        })

        await generateAnnualPlanningPerTemperature(newDataTemperature, t)

        await t.commit()

        return {
            status: 200,
            message: results.length + ' data berhasil disimpan',
            data: results,
        }
    } catch (err) {
        console.log(err)
        await t.rollback()
        return { status: 400, message: 'Gagal menyimpan coldstorage annual planning' }
    }
}

export async function generateAnnualPlanningByUrl(req, res, next) {
    const { entity_regency_id, year } = req.body

    const result = await generateAnnualPlanning(entity_regency_id, year)
    const status = result?.status
    delete result.status

    return res.status(status).json(result)
}


async function getListAnnualPlanMaterialsDinkes(entity_regency_id, year, req) {
    const yearlyPlan = await models.YearlyPlan.findOne({
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

    if (!yearlyPlan) return []

    const yearlyChilds = await models.YearlyChild.findAll({
        where: { yearly_plan_id: yearlyPlan.id }
    })

    if (yearlyChilds.length <= 0) return []

    const yearlyChildIds = _.keys(_.groupBy(yearlyChilds, 'id'))

    const materials = await getListAnnualPlanMaterials(yearlyChildIds, req)

    if (materials.length <= 0) return []

    const dataGrouping = _.groupBy(materials, (item) => [item.material.id, item.month])

    const annual_materials = []

    const keysToUpdate = [
        'yearly_need',
        'yearly_vial',
        'yearly_volume_need',
        'yearly_volume',
        'quartal_volume',
        'peak_volume_q3',
        'peak_volume_q4',
        'monthly_volume',
        'peak_volume_augustus',
        'peak_volume_november'
    ]

    for (const key in dataGrouping) {
        let newData = dataGrouping[key][0]
        for (let i = 1; i < dataGrouping[key].length; i++) {
            const item = dataGrouping[key][i]

            for (let keyIndex of keysToUpdate) {
                newData[keyIndex] += item[keyIndex]
                newData[keyIndex] = formatDecimal(newData[keyIndex])
            }
        }

        newData['yearly_box'] = countYearlyBox(newData['yearly_vial'], { unit_per_box: newData?.unit_per_box || 0 })

        annual_materials.push(newData)
    }

    return annual_materials
}

async function getListAnnualPlanMaterials(yearly_child_id, req) {
    const yearlyResults = await models.YearlyChildResult.findAll({
        include: [
            {
                association: 'master_material',
                where: { is_vaccine: 1, range_temperature_id: { [Op.gt]: 0 } },
                required: true
            },
            {
                association: 'activity',
                attributes: ['id', 'name', 'is_ordered_sales', 'is_ordered_purchase']
            }
        ],
        where: { yearly_child_id }
    })

    const materials = []

    const materialIds = _.keys(_.groupBy(yearlyResults, 'master_material_id'))

    let materialVolumes = await models.MasterVolumeMaterialManufacture.findAll({
        where: { master_material_id: materialIds }
    })

    for (let item of yearlyResults) {
        const { master_material_id, material_id, yearly_need, yearly_vial, master_material, activity } = item
        let newData = {
            material_id: material_id,
            master_material_id: master_material_id,
            month: 0,
            month_name: req.__('all'),
            yearly_need: yearly_need,
            yearly_vial: yearly_vial,
            yearly_box: 0,
            yearly_volume_need: 0,
            yearly_volume: 0,
            quartal_volume: 0,
            peak_volume_q3: 0,
            peak_volume_q4: 0,
            monthly_volume: 0,
            peak_volume_augustus: 0,
            peak_volume_november: 0,
            material: master_material,
            activity: activity,
            unit_per_box: 0
        }

        let monthlyDistribution = JSON.parse(item.monthly_distribution)
        let materialVolume = materialVolumes.filter(it => it.master_material_id === master_material_id)
        materialVolume = materialVolume.length > 0 ? materialVolume[0] : {}
        let yearly_box = countYearlyBox(item.yearly_vial, materialVolume)
        let yearly_volume = countYearlyVolume(item.yearly_vial, materialVolume)

        newData.yearly_box = yearly_box
        newData.yearly_volume_need = yearly_volume
        newData.unit_per_box = materialVolume?.unit_per_box ?? 0

        if (monthlyDistribution.length > 0) {
            for (let monthlyDist of monthlyDistribution) {
                if (monthlyDist.month == 8) {
                    newData.month = 8
                    newData.month_name = req.__('months.8')
                    newData.peak_volume_q3 = yearly_volume
                    newData.peak_volume_augustus = yearly_volume

                    materials.push(newData)
                } else if (monthlyDist.month == 11) {
                    newData.month = 11
                    newData.month_name = req.__('months.11')
                    newData.peak_volume_q4 = yearly_volume
                    newData.peak_volume_november = yearly_volume
                    materials.push(newData)
                }
            }
        } else {
            newData.yearly_volume = yearly_volume
            newData.quartal_volume = formatDecimal(yearly_volume / 4)
            newData.monthly_volume = formatDecimal(yearly_volume / 12)

            materials.push(newData)
        }
    }

    return _.sortBy(materials, 'material.month')
}


function mappingColdstorageByAssets(data) {
    let { entity, volume_asset } = data.dataValues
    let { assets } = entity.dataValues

    let groupByType = _.groupBy(assets, 'type_id')

    let dataAssets = []
    for (let typeId in groupByType) {
        let newData = groupByType[typeId][0]?.asset_type?.dataValues
        newData.assets = []
        for (let item of groupByType[typeId]) {
            delete item.dataValues.asset_type
            newData.assets.push(item)
        }
        dataAssets.push(newData)
    }

    delete data.dataValues.entity
    data.dataValues.capacity_nett = volume_asset
    return {
        ...data.dataValues,
        asset_type: dataAssets
    }
}


async function getColdstorageData(entity_id) {
    let data = await models.Coldstorage.findOne({
        where: { entity_id },
        include: [
            {
                association: 'entity',
                attributes: models.Entity.getBasicAttribute(),
                include: [
                    {
                        association: 'assets',
                        attributes: ['id', 'name', 'type_id', 'serial_number', 'status', 'other_capacity_nett', 'other_capacity_gross'],
                        include: [
                            {
                                association: 'asset_model',
                                attributes: ['id', 'name', 'capacity_gross', 'capacity_nett']
                            },
                            {
                                association: 'asset_type',
                                attributes: ['id', 'name', 'min_temp', 'max_temp', 'is_coldstorage'],
                                where: { is_coldstorage: 1 },
                                required: true
                            },
                            {
                                association: 'asset_status',
                                attributes: ['id', 'name', 'is_coldstorage'],
                                where: { is_coldstorage: 1 },
                                required: true
                            }
                        ],

                        where: { status: 1 },
                        required: false
                    }
                ]
            }
        ]
    })

    return data ? mappingColdstorageByAssets(data) : null
}

async function getAnnualPlanTemperature(entity_id, year, coldstorage) {
    const keysToUpdate = ['yearly_volume_need', 'yearly_volume', 'quartal_volume', 'peak_volume_q3', 'peak_volume_q4', 'monthly_volume', 'peak_volume_augustus', 'peak_volume_november']

    const items = await models.ColdstorageAnnualPlanningTemperature.findAll({
        include: {
            association: 'range_temperature'
        },
        where: { entity_id, year }
    })

    const coldstorage_temperature = await models.ColdstoragePerTemperature.findAll({
        where: { coldstorage_id: coldstorage?.id || 0 }
    })

    const getNetCapacity = function (range_temperature_id) {
        let net_capacity = 0
        let selected = coldstorage_temperature.filter(it => it.range_temperature_id === range_temperature_id)
        if (selected.length > 0) net_capacity = selected[0].volume_asset
        return net_capacity
    }

    for (let item of items) {
        const { range_temperature_id } = item

        const netCapacity = getNetCapacity(range_temperature_id)

        for (let key of keysToUpdate) item.dataValues[`${key}_percent`] = netCapacity ? formatDecimal(item[key] / netCapacity * 100) : 0

        item.dataValues.capacity_nett = netCapacity || 0
    }

    return items
}

export async function detail(req, res, next) {
    const { entity_id, year } = req.params

    const coldStoragePlanning = await models.ColdstorageAnnualPlanning.findOne({
        where: { entity_id, year },
        include: {
            association: 'entity',
            attributes: ['id', 'name', 'province_id', 'regency_id', 'type']
        }
    })

    if (!coldStoragePlanning)
        return res.status(204).json({ message: req.__('204') })

    const { yearly_child_id } = coldStoragePlanning

    const materials = yearly_child_id ? await getListAnnualPlanMaterials(yearly_child_id, req) : await getListAnnualPlanMaterialsDinkes(entity_id, year, req)
    const coldstorage = await getColdstorageData(entity_id)

    const annual_planning_temperature = await getAnnualPlanTemperature(entity_id, year, coldstorage)

    const data = {
        annual_planning: coldStoragePlanning.dataValues,
        annual_planning_temperature,
        annual_planning_materials: materials,
        coldstorage
    }

    const path = req.path

    if (path.includes('xls')) {
        const workbook = await annualPlanningDetailXLS(data)
        const filename = `Detail Coldstorage Annual Planning ${Date()}`

        const arrayBuffer = await workbook.xlsx.writeBuffer()
        const readStream = new stream.PassThrough()
        readStream.end(arrayBuffer)
        res.writeHead(200, {
            'Content-Length': arrayBuffer.length,
            'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
            'Access-Control-Expose-Headers': 'Filename',
            Filename: `${filename}.xlsx`,
        })

        return readStream.pipe(res)
    }

    return res.status(200).json(data)
}