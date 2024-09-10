/*
* if used for list
* can use parameter
* req.order
* req.condition
* req.attributes
* */

import { Op } from 'sequelize'

export default {
  simple_keyword : function(model = ''){
    return async function (req, res, next) {
      const {keyword} = req.query
      if(keyword){
        req.condition = {
          name : {
            [Op.like] : '%' + keyword + '%'
          }
        }
      }
      req.model = model
      next()
    }
  } ,
  define: function (model = '') {
    return async function (req, res, next) {
      req.model = model
      next()
    }
  },
  custom: function (model = '', cb = false) {
    return async function (req, res, next) {
      req.model = model

      if (!cb) return next({ status: 404, message: req.__('404') })
      return cb(req, res, next)
    }
  },
  clearAndAddBody: function (body = {}) {
    return async function (req, res, next) {
      req.body = { ...req.body, ...body}
      next()
    }
  },
}