import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../app/app'
import { vendorID, invalidField } from './config'
import { getUser, seederMaterial } from './seeder'
import { USER_ROLE } from '../app/helpers/constants'
// import moment from 'moment'

chai.use(chaiHttp)
chai.should()

let authToken = null
let requestOrderCreate = {
  'customer_code': '31',
  'sales_ref': '#SREF',
  'buffer_tag': '1',
  'order_items': [
    {
      'material_code': 1,
      'qty': 10,
    }
  ]
}

before(function(done){
  getUser.findByRoleEntity(USER_ROLE.OPERATOR, vendorID).then(({token}) => {
    authToken = 'Bearer '+token
    seederMaterial.findByName('BCG').then(({data}) => {
      requestOrderCreate.order_items[0].material_code = data.code
      done()
    })
  })
})

describe('Request Order', () => {
  let invalidCreateSchema = [
    {field: 'customer_code', schema: ['empty', 'not int', 'not exists']},
    {field: 'buffer_tag', schema: ['empty', 'not int']},
    {field: 'order_items', schema: ['empty']},
  ]
  describe('POST /request-order', () => {
    invalidCreateSchema.forEach(schema => {
      schema.schema.forEach(itemSchema => {
        it(schema.field+' '+itemSchema+' validate', (done) => {
          let invalidSchema = JSON.parse(JSON.stringify(requestOrderCreate))
          invalidSchema[schema.field] = invalidField[itemSchema]
          chai.request(app)
            .post('/request-order')
            .set('Authorization', authToken)
            .send(invalidSchema)
            .end((err, res) => {
              res.should.have.status(422)
              expect(res.body).to.have.deep.property('message')
              done()
            })
        })
      })
    })

    it('POST Req Order Create customer not belongs to vendor', (done) => {
      chai.request(app)
        .post('/request-order')
        .set('Authorization', authToken)
        .send({ customer_code: '9999' })
        .end((err, res) => {
          res.should.have.status(422)
          expect(res.body.message).to.equal('Unprocessable Entity')
          expect(res.body.errors).to.be.an('object')
          expect(res.body.errors).to.have.property('customer_code')
          expect(res.body.errors['customer_code']).include('Customer not belongs to vendor')
          done()
        })
    })

    it('POST Req Order Create complete', (done) => {
      chai.request(app)
        .post('/request-order')
        .set('Authorization', authToken)
        .send(requestOrderCreate)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.have.a('object')
          // Object.keys(requestOrderCreate).map(function(item){
          //   expect(res.body).to.have.deep.property(item)
          // })
          done()
        })
    })
  })
})