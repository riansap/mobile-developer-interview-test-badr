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

describe('Transaction Type', () => {
  let transactionTypeID = 0
  let createTransactionType = {
    'title': 'Test Type_'+Date.now()
  }

  let titleEmpty = JSON.parse(JSON.stringify(createTransactionType))
  titleEmpty.title = null

  const invalidSchema = {
    'title empty': titleEmpty,
  }
  describe('POST /transaction-type', () => {
    for (const key in invalidSchema) {
      it(key+' validate', (done) => {
        chai.request(app)
          .post('/transaction-type')
          .set('Authorization', authToken)
          .send([invalidSchema[key]])
          .end((err, res) => {
            res.should.have.status(422)
            expect(res.body).to.have.deep.property('message')
            done()
          })
      })
    }
    
    it('Create Transaction complete', (done) => {
      chai.request(app)
        .post('/transaction-type')
        .set('Authorization', authToken)
        .send(createTransactionType)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.have.a('object')
          expect(res.body).to.have.property('id')
          transactionTypeID = res.body.id
          expect(res.body).to.deep.include(createTransactionType)
          done()
        })
    })
  })

  describe('GET /transaction-types', () => {
    it('Get Transaction Type complete', (done) => {
      chai.request(app)
        .get('/transaction-types')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  describe('GET /transaction-type/{id}', () => {
    it('Get transaction type complete', (done) => {
      chai.request(app)
        .get('/transaction-type/'+transactionTypeID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body).to.deep.include(createTransactionType)
          done()
        })
    })

    it('Get transaction type reason list complete', (done) => {
      chai.request(app)
        .get('/transaction-type/'+transactionTypeID+'/transaction_reasons')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          expect(res.body).to.be.an('array')
          done()
        })
    })
  })

  describe('PUT /transaction-type', () => {
    it('Update transaction type ID Null', (done) => {
      chai.request(app)
        .put('/transaction-type')
        .set('Authorization', authToken)
        .send(createTransactionType)
        .end((err, res) => {
          res.should.have.status(404)
          done()
        })
    })

    it('Update transaction type ID Invalid', (done) => {
      chai.request(app)
        .put('/transaction-type/ID')
        .set('Authorization', authToken)
        .send(createTransactionType)
        .end((err, res) => {
          res.should.have.status(422)
          done()
        })
    })

    createTransactionType.title = createTransactionType.title + '_update'
    it('Update transaction type complete', (done) => {
      chai.request(app)
        .put('/transaction-type/'+transactionTypeID)
        .set('Authorization', authToken)
        .send(createTransactionType)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body.title).to.equal(createTransactionType.title)
          expect(res.body).to.deep.include(createTransactionType)
          done()
        })
    })
  })

  describe('DELETE /transaction-type', () => {
    it('Delete transaction type complete', (done) => {
      chai.request(app)
        .delete('/transaction-type/'+transactionTypeID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })
})
