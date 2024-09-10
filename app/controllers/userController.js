import { Op, Sequelize } from 'sequelize'
import models from '../models'

import { ENTITY_TYPE, USER_GENDER, USER_ROLE } from '../helpers/constants'
import errorResponse from '../helpers/errorResponse'

export function list(req, res, next) {
  const {
    keyword, role, status, entity_id,
  } = req.query
  const { start_date, end_date } = req.query
  const condition = []
  if (keyword) {
    condition.push({
      [Op.or]: [
        {
          fullnameQuery: Sequelize.where(Sequelize.fn('concat', Sequelize.col('firstname'), ' ', Sequelize.col('lastname')), {
            [Op.like]: `%${keyword}%`,
          }),
        },
        {
          username: { [Op.like]: `%${keyword}%` },
        },
        {
          mobile_phone: { [Op.like]: `%${keyword}%` },
        },
        {
          firstname: { [Op.like]: `%${keyword}%` },
        },
        {
          lastname: { [Op.like]: `%${keyword}%` },
        },
      ],
    })
  }

  if (role) condition.push({ role })
  if (start_date) {
    condition.push({ last_login: { [Op.gte]: start_date } })
  }
  if (end_date) {
    condition.push({ last_login: { [Op.lte]: end_date } })
  }
  if (status) condition.push({ status })
  if (entity_id) condition.push({ entity_id })

  req.condition = condition
  req.order = [['created_at', 'DESC']]
  req.include = [
    {
      association: 'entity',
      attributes: models.Entity.getBasicAttribute(),
      include: {
        association: 'entity_tags',
      },
    },
    {
      association: 'village',
      attributess: ['id', 'name'],
      include: {
        association: 'sub_district',
        attributes: ['id', 'name'],
        include: {
          association: 'regency',
          attributes: ['id', 'name'],
          include: {
            association: 'province',
            attributes: ['id', 'name'],
          },
        },
      },
    },
  ]
  req.xlsColumns = [
    { key: 'id' },
    { key: 'username' },
    { key: 'email' },
    { key: 'firstname' },
    { key: 'lastname' },
    { key: 'gender_label', title: 'gender' },
    { key: 'date_of_birth' },
    { key: 'mobile_phone' },
    { key: 'address' },
    { key: 'role_label', title: 'role' },
    { key: 'entity_name', title: 'entity' },
    { key: 'status_label', title: 'status' },
    { key: 'province_name', title: 'province' },
    { key: 'regency_name', title: 'regency' },
    { key: 'created_at' },
    { key: 'view_only' },
    { key: 'last_login_wib', title: 'last login' },
    { key: 'entity_tag_name', title: 'Entity Tag' },
  ]

  next()
}

export function detail(req, res, next) {
  req.include = [{
    association: 'entity',
    attributes: models.Entity.getBasicAttribute(),
  }, {
    association: 'village',
    include: {
      association: 'sub_district',
      include: {
        association: 'regency',
        include: {
          association: 'province',
        },
      },
    },
  }, {
    association: 'manufacture',
  }]
  next()
}

export async function faskesGenerate(req, res, next) {
  try {
    const { page = 1, paginate = 50 } = req.query

    const options = {
      paginate: Number(paginate),
      page: Number(page),
      where: {
        type: ENTITY_TYPE.FASKES,
      },
    }

    const entitiesPaginate = await models.Entity.paginate(options)
    const entities = entitiesPaginate.docs

    const data = []
    for (let indexEntity = 0; indexEntity < entities.length; indexEntity++) {
      const entity = entities[indexEntity]
      const users = await entity.getUsers()

      if (users.length === 0) {
        const insertUser = {
          email: `${entity.name.replace(/\s/g, '-').toLowerCase()}@example.com`,
          password: process.env.DEFAULT_PASS,
          firstname: 'User',
          lastname: entity.name,
          gender: USER_GENDER.FEMALE,
          mobile_phone: '0811111111',
          role: USER_ROLE.OPERATOR_COVID,
          entity_id: entity.id,
        }

        data.push({
          username: `p${entity.code}_far`,
          ...insertUser,
        })

        data.push({
          username: `p${entity.code}_imun`,
          ...insertUser,
        })
      }
    }

    await models.User.bulkCreate(data, { individualHooks: true })

    return res.status(200).json(data)
  } catch (err) {
    next(err)
  }
}

export function chgHistoryList(req, res, next) {
  const { id } = req.params
  req.condition = {
    user_id: id,
  }

  req.mappingDocs = ({ docs }) => docs.map((history) => {
    const value = history.dataValues
    value.old_values = JSON.parse(value.old_values)
    value.new_values = JSON.parse(value.new_values)
    return value
  })

  req.order = [['id', 'DESC']]

  return next()
}

export async function checkUserUpdateRole(req, res, next) {
  try {
    const { id } = req.params
    const { user } = req
    const authorizedRoles = [
      USER_ROLE.SUPERADMIN,
      USER_ROLE.ADMIN,
    ]

    if (!authorizedRoles.includes(user.role)) {
      if (user.id !== parseInt(id)) {
        res.status(403).json(errorResponse('Forbidden Access'))
      }
      req.body = {
        mobile_phone: req.body.mobile_phone,
        email: req.body.email,
      }
    }
    next()
  } catch (error) {
    next(error)
  }
}
