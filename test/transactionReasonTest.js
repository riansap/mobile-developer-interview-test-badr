import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../app/app'
import { vendorID } from './config'
import { getUser } from './seeder'
import { USER_ROLE } from '../app/helpers/constants'

chai.use(chaiHttp)
chai.should()

let authToken = null
before(function(done){
  getUser.findByRoleEntity(USER_ROLE.SUPERADMIN, null).then(({token}) => {
    authToken = 'Bearer '+token
    done()
  })
})

describe('Transaction Reason', () => {
  describe('GET /transaction-reasons', () => {
    it('Get Transaction Reason complete', (done) => {
      chai.request(app)
        .get('/transaction-reasons')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  let transactionReasonID = 0
  let createTransactionReason = {
    'title': 'Test Reason_'+Date.now(),
    'transaction_type_id': 1
  }

  let titleEmpty = JSON.parse(JSON.stringify(createTransactionReason))
  titleEmpty.title = null
  let transactionTypeEmpty = JSON.parse(JSON.stringify(createTransactionReason))
  transactionTypeEmpty.title = null
  let transactionTypeNotExists = JSON.parse(JSON.stringify(createTransactionReason))
  transactionTypeNotExists.title = 9999

  const invalidSchema = {
    'title empty': titleEmpty,
    'transaction_type empty': transactionTypeEmpty,
    'transaction_type not exists': transactionTypeNotExists
  }
  describe('POST /transaction-reason', () => {
    for (const key in invalidSchema) {
      it(key+' validate', (done) => {
        chai.request(app)
          .post('/transaction-reason')
          .set('Authorization', authToken)
          .send([invalidSchema[key]])
          .end((err, res) => {
            res.should.have.status(422)
            expect(res.body).to.have.deep.property('message')
            done()
          })
      })
    }

    it('Create Transaction Reason complete', (done) => {
      chai.request(app)
        .post('/transaction-reason')
        .set('Authorization', authToken)
        .send(createTransactionReason)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.have.a('object')
          expect(res.body).to.have.property('id')
          expect(res.body).to.deep.include(createTransactionReason)
          transactionReasonID = res.body.id
          done()
        })
    })
  })

  describe('GET /transaction-reason', () => {
    it('Get Transaction Reason complete', (done) => {
      chai.request(app)
        .get('/transaction-reason/'+transactionReasonID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  describe('PUT /transaction-reason', () => {
    it('Update Transaction Reason ID null', (done) => {
      chai.request(app)
        .put('/transaction-reason')
        .set('Authorization', authToken)
        .send(createTransactionReason)
        .end((err, res) => {
          res.should.have.status(404)
          done()
        })
    })

    it('Update Transaction Reason ID Invalid', (done) => {
      chai.request(app)
        .put('/transaction-reason/ID')
        .set('Authorization', authToken)
        .send(createTransactionReason)
        .end((err, res) => {
          res.should.have.status(422)
          done()
        })
    })

    createTransactionReason.title = createTransactionReason.title + '_update'
    it('Update Transaction Reason complete', (done) => {
      chai.request(app)
        .put('/transaction-reason/'+transactionReasonID)
        .set('Authorization', authToken)
        .send(createTransactionReason)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body.title).to.equal(createTransactionReason.title)
          expect(res.body).to.deep.include(createTransactionReason)
          done()
        })
    })
  })

  describe('DELETE /transaction-reason', () => {
    it('Delete Transaction Reason complete', (done) => {
      chai.request(app)
        .delete('/transaction-reason/'+transactionReasonID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })
})
