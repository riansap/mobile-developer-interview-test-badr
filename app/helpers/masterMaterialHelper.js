import models from '../models'

export async function getMaterialIDFromMasterMaterialAndActivity({ master_material_id, activity_id}) {
  let material = await models.Material.findOne({ where: [{
    master_material_id,
    master_activity_id: activity_id,
  }]})
  return material?.id || null
}
