/* eslint-disable no-restricted-syntax */
/* eslint-disable no-loop-func */
/* eslint-disable no-undef */
import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'

import app from '../../app/app'
import { invalidField } from '../config'
import { getToken } from '../helpers/helper'

chai.use(chaiHttp)
chai.should()

const token = []
let dataID = null
let data = {}

function checkArrayBodyProp({ data = {}, rules = {} }) {
  for (const childRules of rules) {
    for (const childBody of data) {
      Object.keys(childRules).map((childItem) => {
        checkBodyProp({
          data: childBody,
          property: childItem,
          rules: rules[0],
        })
      })
    }
  }
}

function checkObjectBodyProp({ data = {}, rules = {} }) {
  Object.keys(rules).map((item) => {
    checkBodyProp({
      data,
      property: item,
      rules,
    })
  })
}

function checkBodyProp({ data = {}, property = '', rules = {} }) {
  if (typeof rules[property] === 'object') {
    if (Array.isArray(rules[property])) {
      checkArrayBodyProp({
        data: data[property],
        rules: rules[property],
      })
    } else {
      checkObjectBodyProp({
        data: data[property],
        rules: rules[property],
      })
    }
  } else {
    if (process.env.DEBUG === true) {
      console.log(`Check ${property}`)
    }
    expect(data).to.have.deep.property(property)
    if (data[property] !== null) {
      expect(typeof data[property]).to.equal(rules[property])
    }
  }
}

export function checkBody({ data = {}, rules = {} }) {
  if (process.env.DEBUG === true) {
    console.log('check body', data)
  }
  Object.keys(rules).map((item) => {
    checkBodyProp({
      data,
      property: item,
      rules,
    })
  })
}

function invalidHeaderTest(invalidHeaders, {
  body, endpoint, useParam, useID, method,
}) {
  describe('Test Headers', () => {
    invalidHeaders.forEach((schema) => {
      schema.schema.forEach((itemSchema) => {
        it(`${schema.field} ${itemSchema} validate`, (done) => {
          // const additionalParam = useID ? dataID : ''
          const finalEndpoint = getFinalEndpoint({
            endpoint, useID, useParam,
          })
          chai.request(app)[method](finalEndpoint)
            .set(schema.field, invalidField[itemSchema])
            .send(body)
            .end((err, res) => {
              res.should.have.status(schema.res_code)
              expect(res.body).to.deep.property('message')
              done()
            })
        })
      })
    })
  })
}

function invalidSchemaTest(invalidSchema, {
  body, endpoint, useParam, useID, method, roleID,
}) {
  describe('Test Invalid Schema', () => {
    for (const schema of invalidSchema) {
      for (const itemSchema of schema.schema) {
        it(`${schema.field} ${JSON.stringify(itemSchema)} validate`, (done) => {
          const invalidBody = JSON.parse(JSON.stringify(body))
          invalidBody[schema.field] = itemSchema
          // const additionalParam = useID ? dataID : ''
          const finalEndpoint = getFinalEndpoint({
            endpoint, useID, useParam,
          })
          chai.request(app)[method](finalEndpoint)
            .set('Authorization', token[roleID])
            .send(invalidBody)
            .end((err, res) => {
              res.should.have.status(422)
              expect(res.body).to.deep.property('message')
              if (Array.isArray(itemSchema)) {
                // expect(res.body.errors).to.deep.property(`${schema.field}[0]`)
              } else {
                expect(res.body.errors).to.deep.property(schema.field)
              }
              done()
            })
        })
      }
    }
  })
}

function checkSuccessData(res, {
  method, successCode, isList, returnRules, isPaginate, updateData = true,
}) {
  if (process.env.DEBUG === true) {
    console.log(JSON.stringify(res.body))
  }
  res.should.have.status(successCode)
  if (method === 'get' || method === 'put' || method === 'post') {
    if (isList) {
      if (isPaginate) {
        res.body.should.have.a('object')
        expect(res.body.list).to.be.an('array')
        res.body.list.forEach((listItem) => {
          checkBody({
            data: listItem,
            rules: returnRules,
          })
        })
      } else {
        expect(res.body).to.be.an('array')
        res.body.forEach((listItem) => {
          checkBody({
            data: listItem,
            rules: returnRules,
          })
        })
      }
    } else {
      res.body.should.have.a('object')
      if (updateData) {
        dataID = res.body.id
        data = res.body
      }
      checkBody({
        data: res.body,
        rules: returnRules,
      })
    }
  }
}

export function getFinalEndpoint({ endpoint, useID, useParam }) {
  let additionalParam = ''
  let finalEndpoint = endpoint
  if (useID) {
    additionalParam = dataID
    finalEndpoint = endpoint + additionalParam
  } else if (useParam) {
    additionalParam = data[useParam]
    finalEndpoint = endpoint.replace(`:${useParam}`, additionalParam)
  }
  return finalEndpoint
}

function filterQueryTest(filterQueries, options) {
  const {
    body, endpoint, method, successCode, isList, returnRules, roleID, isPaginate, updateData,
  } = options
  if (filterQueries.length > 0) {
    describe('Test filter query', () => {
      filterQueries.forEach((query) => {
        query.querySchema.forEach((itemSchema) => {
          const queryKey = query.query
          const property = query.property ?? queryKey
          it(`${queryKey} ${itemSchema} validate`, (done) => {
            let queryValue = itemSchema
            if (typeof itemSchema === 'string' && itemSchema.includes('data_created.')) {
              const value = itemSchema.split('.')
              queryValue = data[value[1]]
            }
            const additionalQuery = `?${queryKey}=${queryValue}`
            chai.request(app)[method](endpoint + additionalQuery)
              .set('Authorization', token[roleID])
              .send(body)
              .end((err, res) => {
                expect(res.body.list).to.be.an('array')
                res.body.list.forEach((listItem) => {
                  expect(listItem[property]).to.equal(queryValue)
                })
                done()
              })
          })
        })
      })
    })
  }
}

export function crudTestSchema({
  testSchema = [],
}) {
  // testSchema.forEach((test) => {
  // eslint-disable-next-line no-restricted-syntax
  for (const test of testSchema) {
    const {
      body = {},
      endpoint,
      method,
      invalidSchema,
      invalidHeaders,
      success_code = '200',
      useID = false,
      isList = false,
      updateField,
      useParam = null,
      roleID = null,
      returnRules = {},
      isPaginate = true,
      updateData = true,
      filterQueries = [],
    } = test
    before(async () => {
      if (process.env.DEBUG === true) {
        console.log('Token login role ==', roleID)
      }
      token[roleID] = await getToken(roleID)
    })
    describe(test.title, () => {
      if (invalidHeaders) {
        invalidHeaderTest(invalidHeaders, {
          body, endpoint, useParam, method, useID,
        })
      }

      if (invalidSchema) {
        invalidSchemaTest(invalidSchema, {
          body, endpoint, useParam, method, useID, roleID,
        })
      }

      it('complete', (done) => {
        const dataBody = method === 'delete' ? {} : JSON.parse(JSON.stringify(body))
        if (updateField) {
          // eslint-disable-next-line array-callback-return
          Object.keys(updateField).map((idx) => {
            dataBody[idx] = `${updateField[idx]}${dataBody[idx]}`
          })
          if (process.env.DEBUG === true) {
            console.log('update field--------------------------------', dataBody)
          }
        }
        const finalEndpoint = getFinalEndpoint({
          endpoint, useID, useParam,
        })

        chai.request(app)[method](finalEndpoint)
          .set('Authorization', token[roleID])
          .send(dataBody)
          .end((err, res) => {
            checkSuccessData(res, {
              method, successCode: success_code, isList, returnRules, isPaginate, updateData,
            })
            done()
          })
      })

      if (filterQueries) {
        const finalEndpoint = getFinalEndpoint({
          endpoint, useID, useParam,
        })
        filterQueryTest(filterQueries, {
          body,
          endpoint: finalEndpoint,
          method,
          successCode: success_code,
          isList,
          returnRules,
          roleID,
          isPaginate,
          updateData,
        })
      }
    })
  }
}
