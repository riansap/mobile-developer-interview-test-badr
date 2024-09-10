import _ from 'lodash'
import { Op } from 'sequelize'
import stream from 'stream'
import parser from 'yargs-parser'

import models from '../../models'
import { KFA_LEVEL_ID } from '../constants'

const {
  EntityMasterMaterial,
  MasterMaterial
} = models
const { sequelize } = models

const args = parser(process.argv)

/**
 * Example on how to use args
 * npm run cmd:fill-entity-material-template-stock -- --maxIteration=1 --lastEhmmId=8413054
 */

const MAX_ITERATION = args?.maxIteration || 1
const BATCH_SIZE = args?.batchSize || 100
const LAST_EHMM_ID = args?.lastEhmmId || 0
const LOG = args?.log || false

const processChunk = async (readable) => {
  let i = 1
  for await (const chunk of readable) {
    const trx = await sequelize.transaction()
    try {
      console.time(`Batch ${i} processed`)

      const templateEhmmEntityIds = chunk.map((item) => item.entity_id).filter((value, index, array) => array.indexOf(value) === index)
      
      const templateEhmmMaterialIds = chunk.map((item) => item.master_material_id).filter((value, index, array) => array.indexOf(value) === index)
          
      const variantEntityMaterials = await EntityMasterMaterial.findAll({
        where: [
          {
            entity_id: {
              [Op.in]: templateEhmmEntityIds
            }
          }, 
          { 
            '$material.parent_id$': { 
              [Op.in]: templateEhmmMaterialIds 
            } 
          }
        ],
        include: [
          {
            association: 'material',
            attributes: models.MasterMaterial.getBasicAttribute(),
            required: true,
            where: {
              kfa_level_id: KFA_LEVEL_ID.VARIANT
            }
          },
          {
            association: 'stocks',
            attributes: [...models.Stock.getBasicAttributeV2()],
            where: [
              {
                [Op.or]: [
                  { batch_id: null },
                  { '$batch.status$': 1 }
                ]
              }
            ],
            include: [
              {
                association: 'batch',
                attributes: models.Batch.getBasicAttribute()
              },
            ],
            separate: true
          },
        ],
        transaction: trx
      })

      const chunkTemplateEntityMaterials = chunk.map((templateEntityMaterial) => {
        const childrenEhmm = variantEntityMaterials
          .map((variantEntityMaterialInstance) => {
            const variantEntityMaterial = variantEntityMaterialInstance.get({ plain: true })

            const on_hand_stock = _.sumBy(variantEntityMaterial.stocks, 'qty')
            const allocated_stock = _.sumBy(variantEntityMaterial.stocks, 'allocated')

            return {
              ...variantEntityMaterial,
              on_hand_stock,
              allocated_stock,
            }
          })
          .filter((variantEntityMaterial) => variantEntityMaterial.entity_id === templateEntityMaterial.entity_id && variantEntityMaterial.material.parent_id === templateEntityMaterial.master_material_id)

        const on_hand_stock = _.sumBy(childrenEhmm, 'on_hand_stock')
        const allocated_stock = _.sumBy(childrenEhmm, 'allocated_stock')

        return {
          entity_id: templateEntityMaterial.entity_id,
          master_material_id: templateEntityMaterial.master_material_id,
          on_hand_stock,
          allocated_stock
        }
      })

      const insert = await EntityMasterMaterial.bulkCreate(chunkTemplateEntityMaterials, {
        ignoreDuplicates: true,
        updateOnDuplicate: [
          'on_hand_stock',
          'allocated_stock'
        ],
        transaction: trx,
      })

      await trx.commit()

      if (LOG) {
        console.log(insert)
      }

      if (insert) {
        console.log(`Chunk of size ${chunkTemplateEntityMaterials.length} processed`)
        console.timeEnd(`Batch ${i} processed`)
        i += 1
      }

    } catch (error) {
      await trx.rollback()
      console.log('Stream Error!!!', error.message)
    }
  }
}

export const startFillingEntityMaterialTemplateStock = async () => {
  try {
    console.time('execution time')

    const masterMaterials = await MasterMaterial.findAll({
      where: {
        kfa_level_id: KFA_LEVEL_ID.TEMPLATE
      }
    })
    
    const masterMaterialIds = masterMaterials.map((masterMaterial) => masterMaterial.id)
    
    let i = 1
    let lastEhmmId = LAST_EHMM_ID
    const fetchReadableStream = new stream.Readable({
      objectMode: true,
      async read(size) {
        const templateEntityMaterials = await EntityMasterMaterial.findAll({
          where: {
            master_material_id: {
              [Op.in]: masterMaterialIds
            },
            id: {
              [Op.gt]: lastEhmmId
            }
          },
          raw: true,
          order: [['id', 'ASC']],
          limit: Number(BATCH_SIZE),
        })

        lastEhmmId = templateEntityMaterials[templateEntityMaterials.length - 1]
          ? templateEntityMaterials[templateEntityMaterials.length - 1].id
          : lastEhmmId
        console.log('lastEhmmId', lastEhmmId)

        i += 1
        if (i > MAX_ITERATION || templateEntityMaterials.length < 1) {
          this.push(null)
        } else {
          this.push(templateEntityMaterials)
        }
      }
    })
    
    processChunk(fetchReadableStream)

    fetchReadableStream.on('end', () => {
      console.log('End fetchStream')
      console.timeEnd('execution time')

      process.exit()
    })
  } catch (error) {
    console.log('Script Failed!', error)
    return new Error(error)
  }
}