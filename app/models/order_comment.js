import { Model } from 'sequelize'
import sequelizePaginate from 'sequelize-paginate'

export default (sequelize, DataTypes) => {
  class OrderComment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.User, { as: 'user' })
      const userAttributes = ['id', 'username', 'email', 'firstname', 'lastname']
      const userFields = ['created_by', 'updated_by', 'deleted_by']
      userFields.forEach(item => {
        this.belongsTo(models.User, { as: `user_${item}`, foreignKey: item })
      })

      this.addHook('beforeFind', (options) => {
        let modelInclude = []
        if (Array.isArray(options.include)) modelInclude = [...options.include]
        else if (typeof options.include === 'object' && options.include !== null) {
          modelInclude = [options.include]
        }

        options.include = [
          ...modelInclude,
          ...userFields.map(item => ({
            model: models.User,
            as: `user_${item}`,
            attributes: userAttributes
          }))
        ]
        if (options.attributes === undefined) {
          options.attributes = [
            'id',
            'comment',
            'order_status',
          ]
        }
      })
    }
  }
  OrderComment.init({
    user_id: DataTypes.BIGINT,
    order_id: DataTypes.BIGINT,
    comment: DataTypes.TEXT,
    order_status: DataTypes.TINYINT,
    created_by: DataTypes.BIGINT,
    updated_by: DataTypes.BIGINT,
    deleted_by: DataTypes.BIGINT
  }, {
    sequelize,
    modelName: 'OrderComment',
    underscored: true,
    paranoid: true,
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    deletedAt: 'deleted_at'
  })

  sequelizePaginate.paginate(OrderComment)

  return OrderComment
}