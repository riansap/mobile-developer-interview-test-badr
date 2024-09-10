import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class ColdchainCapacityEquipmentIot extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      const userAttributes = ['id', 'username', 'email', 'firstname', 'lastname']
      const userFields = ['created_by', 'updated_by']
      userFields.forEach(item => {
        this.belongsTo(models.User, { as: `user_${item}`, foreignKey: item })
      })
      // define association here
      this.addHook('beforeFind', (options) => {
        // if (options.attributes === undefined) {
        //   options.attributes = this.getBasicAttribute()
        // }
        let modelInclude = []
        if (Array.isArray(options.include)) modelInclude = [...options.include]
        else if (typeof options.include === 'object' && options.include !== null) {
          modelInclude = [options.include]
        }
        if(!options.without_relations) {
          modelInclude = [
            ...modelInclude,
            ...userFields.map(item => ({
              association: `user_${item}`,
              attributes: userAttributes
            }))
          ]
        }
        options.include = modelInclude
      })
    }
  }

  ColdchainCapacityEquipmentIot.init({
    code_pqs: DataTypes.STRING,
    capacity_nett_at_plus_5_c: DataTypes.FLOAT,
    capacity_nett_at_minus_20_c: DataTypes.FLOAT,
    capacity_nett_at_minus_86_c: DataTypes.FLOAT,
    status: DataTypes.BOOLEAN,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
    deleted_at: DataTypes.DATE,
  }, {
    paranoid: true,
    sequelize,
    tableName: 'coldchain_capacity_equipment',
    modelName: 'ColdchainCapacityEquipmentIot',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at',
    schema: process.env.DB_IOT || 'staging_smile_iot',
  })

  sequelizePaginate.paginate(ColdchainCapacityEquipmentIot)

  ColdchainCapacityEquipmentIot.getBasicAttribute = function () {
    return [
      'code_pqs',
      'capacity_nett_at_plus_5_c',
      'capacity_nett_at_minus_20_c',
      'capacity_nett_at_minus_86_c',
      'status',
    ]
  }

  return ColdchainCapacityEquipmentIot
}