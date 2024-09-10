import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../app/app'
// import models from '../app/models'
// import { authToken, customerToken, customerID, vendorID, invalidField, generateToken } from './config'
import { seederOrderCovidTest } from './seeder'
// import { USER_ROLE } from '../app/helpers/constants'

chai.use(chaiHttp)
chai.should()

const orderCovidCreate = seederOrderCovidTest.dataCreated
const orderCovidNonBatch = seederOrderCovidTest.dataNonBatchCreated

describe('Order Covid', () => {
  describe('POST /order/covid', () => {
    it('POST Order Covid Create complete', (done) => {
      seederOrderCovidTest.seed().then(({ token }) => {
        chai.request(app)
          .post('/order/covid')
          .set('Authorization', `Bearer ${token}`)
          .send(orderCovidCreate)
          .end((err, res) => {
            res.should.have.status(201)
            res.body.should.have.a('object')
            done()
          })
      })
    })

    it('POST Order Covid Create non-Batch complete', (done) => {
      seederOrderCovidTest.seed().then(({ token }) => {
        chai.request(app)
          .post('/order/covid')
          .set('Authorization', `Bearer ${token}`)
          .send(orderCovidNonBatch)
          .end((err, res) => {
            res.should.have.status(201)
            res.body.should.have.a('object')
            done()
          })
      })
    })

    it('POST Order Covid customer code not exists', (done) => {
      seederOrderCovidTest.seed().then(({ token }) => {
        chai.request(app)
          .post('/order/covid')
          .set('Authorization', `Bearer ${token}`)
          .send({
            customer_code: 'test'
          })
          .end((err, res) => {
            res.should.have.status(422)
            expect(res.body.message).to.equal('Unprocessable Entity')
            expect(res.body.errors).to.be.an('object')
            expect(res.body.errors).to.have.property('customer_code')
            expect(res.body.errors.customer_code).include('Customer Code is not exist')
            done()
          })
      })
    })

    it('POST Order Covid material code is not exists', (done) => {
      seederOrderCovidTest.seed().then(({ token }) => {
        chai.request(app)
          .post('/order/covid')
          .set('Authorization', `Bearer ${token}`)
          .send({
            order_items: [
              {
                material_code: 'okok'
              }
            ]
          })
          .end((err, res) => {
            res.should.have.status(422)
            expect(res.body.message).to.equal('Unprocessable Entity')
            expect(res.body.errors).to.be.an('object')
            expect(res.body.errors).to.have.property('order_items[0].material_code')
            expect(res.body.errors['order_items[0].material_code']).include('Material Code on Order Item is not exist')
            done()
          })
      })
    })
  })
})