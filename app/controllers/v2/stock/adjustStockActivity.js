import models from '../../../models'

export async function adjustStock() {
  try {
    var start = new Date().getTime()
    // SELECT DISTINCT(entity_id) FROM material_entity WHERE entity_id NOT IN (SELECT DISTINCT(entity_id) FROM entity_has_master_materials) LIMIT 500
    const entityIds = await models.sequelize.query('SELECT DISTINCT(entity_id) FROM material_entity WHERE entity_id NOT IN (SELECT DISTINCT(entity_id) FROM entity_has_master_materials) limit 5000',
      { 
        raw: true,
        type: models.sequelize.QueryTypes.SELECT,
      },
    )
    
    // // insert materialId to entity_has_material_id
    for(let entityId of entityIds) {
      await adjustStockPerEntity(entityId.entity_id)
    }

    var end = new Date().getTime()
    var time = end - start
    var min = Math.floor((time/1000/60) << 0), sec = Math.floor((time/1000) % 60)
    
    console.log(`Execution time: ${time} ms or ${min} min, ${sec} sec`)

  } catch(err) {
    console.log(err)
  }
}

export async function adjustStockPerEntity(entityId) {
  console.log('--- START ADJUST STOCK entity ', entityId)
  let isExistEntityMasterMaterial = await countEntityMasterMaterial(entityId)
  console.log(isExistEntityMasterMaterial)
  if(!isExistEntityMasterMaterial) {
    await updateEntityMasterMaterial(entityId)
    await updateStock(entityId)
  } else {
    console.log('--- stock & entity_master_material already exists ', entityId)
  }
  console.log('--- FINISH ADJUST STOCK entity ', entityId)
}

async function countEntityMasterMaterial(entityId) {
  let count = await models.sequelize.query("SELECT COUNT(*) as total FROM entity_has_master_materials WHERE entity_id = :entityId", 
    {
      replacements: { entityId },
      type: models.sequelize.QueryTypes.SELECT,
    })
  if(count[0] && count[0].total) return count[0].total
  return null
}

async function updateEntityMasterMaterial(entityId) {
  console.log('----- update EntityMasterMaterial -----', entityId)
  // insert into entity_has_master_materials
  let masterMaterial = await models.sequelize.query("INSERT INTO entity_has_master_materials (entity_id, master_material_id, created_at, updated_at) SELECT CONCAT(':entityId') AS entity_id, id AS material_id, created_at, updated_at FROM master_materials WHERE deleted_at IS NULL", 
    {
      replacements: { entityId },
    })
  console.log('----- finish added EntityMasterMaterial -----', masterMaterial)
}

async function updateStock(entityId) {
  console.log('----- update stock activity & entity_master_material_id -----', entityId)
  // get all stocks
  let queryEntityHasMaterial = "(SELECT id FROM entity_has_master_materials WHERE master_material_id = (SELECT master_material_id FROM materials WHERE id = me.material_id) AND entity_id = me.entity_id)"
  let queryActivityStock = "(SELECT master_activity_id FROM materials WHERE id = me.material_id)"
  let stocks = await models.sequelize.query(`SELECT me.id AS material_entity_id, ${queryEntityHasMaterial} AS entity_has_material_id, ${queryActivityStock} AS activity_id FROM material_entity AS me WHERE me.entity_id = :entityId`, 
    {
      replacements: { entityId },
      type: models.sequelize.QueryTypes.SELECT
    })

  // mapping stock to entity_has_master_materials
  for(let stock of stocks) {
    await models.sequelize.query("UPDATE stocks SET activity_id = :activity_id, entity_has_material_id = :entity_has_material_id WHERE material_entity_id = :material_entity_id", 
      {
        replacements: {
          material_entity_id: stock.material_entity_id,
          entity_has_material_id: stock.entity_has_material_id,
          activity_id: stock.activity_id,
        }
      })
  }
  console.log('----- finish update stock activity & entity_master_material_id -----', stocks.length)
}