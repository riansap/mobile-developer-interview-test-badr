import moment from 'moment'
import { Op } from 'sequelize'
import Excel from 'exceljs'

import models from '../../../models'

const viewsOptions = [
  {
    x: 0, y: 0, width: 10000, height: 20000,
    firstSheet: 0, activeTab: 1, visibility: 'visible'
  }
]

export async function formatStockXLSQuery(req, res, next) {
  try {
    const {
      expired_start_date, expired_end_date, province_id, regency_id, sub_district_id, entity_tag_id, batch_ids, is_vaccine, activity_id
    } = req.query
    let materialEntityCondition = {}
    let whereIsVaccine = {}

    if (req.condition) {
      materialEntityCondition = req.condition
      req.condition = {}
    }

    if (is_vaccine) {
      whereIsVaccine = { is_vaccine: is_vaccine }
    }

    req.customOptions = {
      distinct: 'EntityMasterMaterial.id',
    }

    req.attributes = null

    req.order = []

    const batchCondition = []
    if (expired_start_date && expired_end_date) {
      batchCondition.push({
        expired_date: {
          [Op.between]: [
            moment(expired_start_date).add(1, 'days'),
            moment(expired_end_date).add(1, 'days'),
          ],
        },
      })
    }
    if (batch_ids) {
      const batchIdArray = batch_ids.split(',')
      batchCondition.push({ id: { [Op.in]: batchIdArray } })
    }

    req.include = [
      {
        association: 'entity_master_material',
        where: materialEntityCondition,
        include: [
          {
            association: 'entity',
            attributes: models.Entity.getBasicAttribute(),
            required: true,
            include: [
              {
                association: 'province',
                attributes: ['name'],
              },
              {
                association: 'regency',
                attributes: ['name'],
              },
              {
                association: 'sub_district',
                attributes: ['name'],
              },
              {
                association: 'entity_tags',
                attributes: ['id'],
              },
            ],
          },
          {
            association: 'material',
            attributes: ['id', 'name'],
            where: whereIsVaccine,
          },
        ],
      },
      {
        association: 'batch',
        attributes: models.Batch.getBasicAttribute(),
      },
      {
        association: 'activity',
        attributes: ['id', 'name'],
        paranoid : false
      },
      {
        association : 'source_material'
      }
    ]
    if (batchCondition.length > 0) {
      req.include[1].where = batchCondition
      req.include[1].required = true
    }

    if(activity_id){
      req.include[2].required = true
      req.include[2].where = {id : activity_id}
    }

    const materialEntityIndex = req.include.findIndex((include) => include.association === 'entity_master_material')
    const entityIndex = req.include[materialEntityIndex].include.findIndex((include) => include.association === 'entity')

    const entityCondition = []
    if (province_id) entityCondition.push({ province_id })
    if (regency_id) entityCondition.push({ regency_id })
    if (sub_district_id) entityCondition.push({ sub_district_id })

    if (entityCondition.length > 0) {
      req.include[materialEntityIndex].include[entityIndex].where = entityCondition
    }

    if (entity_tag_id) {
      const entityTagsIndex = req.include[materialEntityIndex].include[entityIndex].include.findIndex((include) => include.association === 'entity_tags')
      req.include[materialEntityIndex].include[entityIndex].include[entityTagsIndex].where = { id: entity_tag_id }
    }

    req.xlsColumns = [
      { key: 'entity_id', title: 'ID Entitas' },
      { key: 'entity_name', title: 'Nama Entitas' },
      { key: 'province_name', title: 'Provinsi' },
      { key: 'regency_name', title: 'Kab/Kota' },
      { key: 'district_name', title: 'Kecamatan' },
      { key: 'entity_type', title: 'Tipe Entitas' },
      { key: 'material_name', title: 'Nama Material' },
      { key: 'batch_code', title: 'Nomor Batch' },
      { key: 'expired_date', title: 'Tanggal Kadaluwarsa' },
      { key: 'activity_name', title: 'Kegiatan' },
      { key: 'on_hand_stock', title: 'Sisa Stock' },
      { key: 'min', title : 'Min'},
      { key: 'max', title : 'Max'},
      { key: 'price', title : 'Harga'},
      { key: 'total_price', title : 'Harga Total'},
      { key: 'budget_source', title : 'Sumber Anggaran'},
      { key: 'year', title : 'Tahun Anggaran'}
    ]

    req.mappingContents = ({ data }) => {
      let item = {}
      const { batch, entity_master_material, source_material } = data
      const { entity, material } = entity_master_material
      let province; let regency; let
        district = null

      if (entity) {
        province = entity.province
        regency = entity.regency
        district = entity.sub_district
      }

      item = {
        entity_id: entity?.id || '',
        entity_name: entity?.name || '',
        province_name: province?.name || '',
        regency_name: regency?.name || '',
        district_name: district?.name || '',
        entity_type: entity?.type_label || '',
        material_name: material?.name || '',
        batch_code: batch?.code || '',
        expired_date: batch ? moment(batch.expired_date).format('YYYY-MM-DD') : '',
        on_hand_stock: data.qty,
        activity_name: data.activity?.name || '',
        min: entity_master_material?.min || '',
        max: entity_master_material?.max || '',
        price: data.price || '',
        total_price: data.total_price || '',
        budget_source: source_material?.name || '',
        year: data.year
      }

      return item
    }

    next()
  } catch (err) {
    return next(err)
  }
}

export function getStockKfaWorkbook({ req, templateStocks, parentLessVariantStocks }) {
  const workbook = new Excel.Workbook()

  workbook.creator = 'SMILE'
  workbook.views = viewsOptions
  
  const worksheetOneTitle = req.__('field.kfa_level.template')
  const worksheetOne = workbook.addWorksheet(
    worksheetOneTitle, 
    {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: worksheetOneTitle, firstFooter: worksheetOneTitle }
    }
  )
    
  const headerOne = req.__('field.export_kfa_stocks.columns_template')
  worksheetOne.addRow(headerOne)

  const worksheetTwoTitle = req.__('field.kfa_level.variant')
  const worksheetTwo = workbook.addWorksheet(
    worksheetTwoTitle, 
    {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: worksheetTwoTitle, firstFooter: worksheetTwoTitle }
    }
  )
    
  const headerTwo = req.__('field.export_kfa_stocks.columns_variant')
  worksheetTwo.addRow(headerTwo)
  
  templateStocks.forEach(template => {
    const rowDataTemplate = [
      template.entity.id,
      template.entity.name,
      template.entity.province?.name,
      template.entity.regency?.name,
      template.entity.sub_district?.name,
      template.entity.type_label,
      template.name_kfa_product_template,
      template.code_kfa_product_template,
      template.on_hand_stock,
      template.allocated_stock,
      template.available_stock,
      template.min,
      template.max
    ]
    
    worksheetOne.addRow(rowDataTemplate)

    template.materials.forEach(variantMaterial => {
      if (variantMaterial.dataValues.stocks && variantMaterial.dataValues.stocks.length > 0) {
        variantMaterial.dataValues.stocks.forEach(variantStock => {
          const rowDataVariant = [
            template.entity.id,
            template.entity.name,
            template.entity.province?.name,
            template.entity.regency?.name,
            template.entity.sub_district?.name,
            template.entity.type_label,
            variantMaterial.name,
            variantMaterial.kfa_code,
            variantStock.batch?.code,
            variantStock.batch?.expired_date,
            variantStock.activity.name,
            variantStock.qty,
            variantMaterial.min,
            variantMaterial.max,
            variantStock.price,
            variantStock.total_price,
            variantStock.source_material?.name,
            variantStock.year,
          ]
                
          worksheetTwo.addRow(rowDataVariant)
        })
      } 
    })
  })
  
  const worksheetThreeTitle = req.__('field.kfa_level.variant') + ' ' + req.__('field.export_kfa_stocks.parentless') 
  const worksheetThree = workbook.addWorksheet(
    worksheetThreeTitle, 
    {
      properties: { tabColor: { argb: 'FFC0000' } },
      headerFooter: { firstHeader: worksheetThreeTitle, firstFooter: worksheetThreeTitle }
    }
  )
    
  const headerThree = req.__('field.export_kfa_stocks.columns_variant')
  worksheetThree.addRow(headerThree)

  parentLessVariantStocks.forEach(parentLessVariantStock  => {
    parentLessVariantStock.stocks.forEach((stock) => {
      const rowData = [
        parentLessVariantStock.entity.id,
        parentLessVariantStock.entity.name,
        parentLessVariantStock.entity.province?.name,
        parentLessVariantStock.entity.regency?.name,
        parentLessVariantStock.entity.sub_district?.name,
        parentLessVariantStock.entity.type_label,
        parentLessVariantStock.name,
        parentLessVariantStock.kfa_code,
        stock.batch?.code,
        stock.batch?.expired_date,
        stock.activity.name,
        stock.qty,
        parentLessVariantStock.min,
        parentLessVariantStock.max,
        stock.price,
        stock.total_price,
        stock.source_material?.name,
        stock.year,
      ]

      worksheetThree.addRow(rowData)
    })
  
  })

  return workbook 
}