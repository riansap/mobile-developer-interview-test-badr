import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../app/app'
import { customerID, invalidField, vendorID } from './config'
import { USER_ROLE } from '../app/helpers/constants'
import { getUser, seederMaterial, transactionSeeder } from './seeder'

chai.use(chaiHttp)
chai.should()

let transactionProp = [
  'id',
  'change_qty',
  'closing_qty',
  'material_id',
  'customer_id',
  'vendor_id',
  'opening_qty',
  'transaction_type_id',
  'transaction_reason_id',
  'created_by',
  'updated_by',
  'device_type',
  'updatedAt',
  'stock',
  'entity',
  'material',
  'customer',
  'transaction_type',
  'transaction_reason',
  'user_created',
  'other_reason',
]

let nestedTransactionProp = [
  'stock.id',
  'stock.batch_id',
  'stock.batch',
  'stock.status',
  'entity.id',
  'entity.name',
  'entity.address',
  'material.id',
  'material.name',
  'material.description',
  'transaction_type.id',
  'transaction_type.title',
  'user_created.id', 
  'user_created.username',
  'user_created.firstname',
  'user_created.lastname',
]
let authToken = null
let stockCount = {
  'transaction_type_id': 1,
  'transaction_reason_id': 1,
  'status_id': 1,
  'material_id': 1,
  'change_qty': 200,
  'created_at': '2020-10-01 23:50:01',
  'is_batches': true,
  'batch': {
    'code': 'AABB',
    'expired_date': '2020-12-30',
    'production_date': '2020-10-17',
    'manufacture_id': 1
  },
  'other_reason': 'Test reason'
}

let newStockCount = {
  'transaction_type_id': 1,
  'transaction_reason_id': 1,
  'status_id': 1,
  'material_id': 3,
  'change_qty': 150,
  'created_at': '2020-10-01 23:50:01',
  'is_batches': false
}
let discard, receipt, issue, returnTrans = {}
let multiTransaction = []
let invalidTransactionBiggerThanStock, emptyTransactionType, emptyMaterial, invalidBatchCode = {}
let invalidBatchCodeNotString, invalidBatchManufacture, invalidBatchManufactureNotInteger = {}
let emptyQty, invalidSchema = {}
let materialID = null
let materialTagID = null

before(function(done){
  getUser.findByRoleEntity(USER_ROLE.OPERATOR, vendorID).then(({token}) => {
    authToken = 'Bearer '+token
    transactionSeeder.seed(vendorID).then(({material, material2, materialTag}) => {
      stockCount.material_id = material.id
      newStockCount.material_id = material2.id
      materialID = material.id
      materialTagID = materialTag.id
      prepareTransactionSchema(stockCount)
      done()
    })
  })
})

function prepareTransactionSchema(stockCount) {
  discard = JSON.parse(JSON.stringify(stockCount))
  discard.transaction_type_id = 4
  discard.transaction_reason_id = 4
  discard.change_qty = 10

  receipt = JSON.parse(JSON.stringify(stockCount))
  receipt.customer_id = customerID
  receipt.vendor_id = vendorID
  receipt.transaction_type_id = 3
  receipt.transaction_reason_id = null
  receipt.change_qty = 50

  issue = JSON.parse(JSON.stringify(stockCount))
  issue.transaction_type_id = 2
  issue.transaction_reason_id = null
  issue.customer_id = customerID
  issue.change_qty = 50

  returnTrans = JSON.parse(JSON.stringify(stockCount))
  returnTrans.transaction_type_id = 5
  returnTrans.transaction_reason_id = null
  returnTrans.customer_id = customerID
  returnTrans.change_qty = 10
  returnTrans.broken_qty = 5

  multiTransaction = [
    stockCount,
    issue,
    receipt,
    discard,
    returnTrans
  ]

  invalidTransactionBiggerThanStock = JSON.parse(JSON.stringify(issue))
  invalidTransactionBiggerThanStock.change_qty = 99999

  emptyTransactionType = JSON.parse(JSON.stringify(stockCount))
  delete emptyTransactionType.transaction_type_id

  emptyMaterial = JSON.parse(JSON.stringify(stockCount))
  delete emptyMaterial.material_id

  emptyQty = JSON.parse(JSON.stringify(stockCount))
  delete emptyQty.change_qty

  invalidBatchCode = JSON.parse(JSON.stringify(stockCount))
  invalidBatchCode.batch.code = 'ZZZZ'

  invalidBatchCodeNotString = JSON.parse(JSON.stringify(stockCount))
  invalidBatchCodeNotString.batch.code = 9999

  invalidBatchManufacture = JSON.parse(JSON.stringify(stockCount))
  invalidBatchManufacture.batch.manufacture_id = 9999

  invalidBatchManufactureNotInteger = JSON.parse(JSON.stringify(stockCount))
  invalidBatchManufactureNotInteger.batch.manufacture_id = 'False'

  invalidSchema = {
    'Transaction bigger than stock (Discard) ': invalidTransactionBiggerThanStock,
    'transaction_type_id not exists': emptyTransactionType,
    'material_id not exists': emptyMaterial,
    'change_qty not exists': emptyQty,
    'batch code': invalidBatchCode,
    'batch code not string': invalidBatchCodeNotString,
    'batch manufacture': invalidBatchManufacture,
    'batch manufacture not integer': invalidBatchManufactureNotInteger
  }
}

describe('Transaction', () => {
  let invalidTransactionSchema = [
    {field: 'transaction_type_id', schema: ['empty', 'not int', 'not exists', 'not match']},
    {field: 'transaction_reason_id', schema: ['not int', 'not exists']},
    {field: 'status_id', schema: ['not int', 'not exists']},
    {field: 'material_id', schema: ['empty', 'not int', 'not exists']},
    {field: 'stock_id', schema: ['not int', 'not exists']},
    {field: 'customer_id', schema: ['not int', 'not exists']},
    {field: 'vendor_id', schema: ['not int', 'not exists']},
    {field: 'change_qty', schema: ['empty', 'not int', 'piece unit', 'minus']},
    {field: 'created_at', schema: ['not string', 'date']},
    {field: 'is_batches', schema: ['empty', 'not boolean']}
  ]
  describe('POST /transactions', () => {
    for (const key in invalidSchema) {
      it(key+' invalid', (done) => {
        chai.request(app)
          .post('/transactions')
          .set('Authorization', authToken)
          .send([invalidSchema[key]])
          .end((err, res) => {
            res.should.have.status(422)
            expect(res.body).to.have.deep.property('message')
            done()
          })
      })
    }

    invalidTransactionSchema.forEach(schema => {
      schema.schema.forEach(itemSchema => {
        it(schema.field+' '+itemSchema+' validate', (done) => {
          let invalidSchema = JSON.parse(JSON.stringify(stockCount))
          invalidSchema[schema.field] = invalidField[itemSchema]
          chai.request(app)
            .post('/transactions')
            .set('Authorization', authToken)
            .send([invalidSchema])
            .end((err, res) => {
              res.should.have.status(422)
              expect(res.body).to.have.deep.property('message')
              expect(res.body.errors).to.have.deep.property('[0].'+schema.field)
              done()
            })
        })
      })
    })

    it('Transaction Stock Count', (done) => {
      chai.request(app)
        .post('/transactions')
        .set('Authorization', authToken)
        .send([stockCount])
        .end((err, res) => {
          expect(res.body).to.have.deep.property('message')
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })

    it('Transaction New Stock Count', (done) => {
      chai.request(app)
        .post('/transactions')
        .set('Authorization', authToken)
        .send([newStockCount])
        .end((err, res) => {
          expect(res.body).to.have.deep.property('message')
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })

    it('Transaction Discard', (done) => {
      chai.request(app)
        .post('/transactions')
        .set('Authorization', authToken)
        .send([discard])
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })

    it('Transaction Issue', (done) => {
      chai.request(app)
        .post('/transactions')
        .set('Authorization', authToken)
        .send([issue])
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })

    it('Transaction Receipt', (done) => {
      chai.request(app)
        .post('/transactions')
        .set('Authorization', authToken)
        .send([receipt])
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })

    it('Transaction Return', (done) => {
      chai.request(app)
        .post('/transactions')
        .set('Authorization', authToken)
        .send([returnTrans])
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })

    it('Multi transaction Stock Count + Issue + Receipts + Discard', (done) => {
      chai.request(app)
        .post('/transactions')
        .set('Authorization', authToken)
        .send(multiTransaction)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  let queryFilter = [
    {keyword: 'BCG'},
    {material_id: materialID},
    {transaction_type_id: '1'},
    {transaction_reason_id: '1'},
    {vendor_id: vendorID},
    {start_date: '2020-01-01'},
    {end_date: '2020-12-12'},
    {material_tag_id: materialTagID},
  ]

  describe('GET /transactions', () => {
    it('Get transaction complete', (done) => {
      chai.request(app)
        .get('/transactions')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          transactionProp.forEach(element => {
            expect(res.body.list[0]).to.have.deep.property(element)
          })
          nestedTransactionProp.forEach(element => {
            expect(res.body.list[0]).to.have.deep.nested.property(element)
          })
          done()
        })
    })

    queryFilter.forEach(query => {
      it('Get transaction by ' + JSON.stringify(query) + ' complete', (done) => {
        chai.request(app)
          .get('/transactions')
          .query(query)
          .set('Authorization', authToken)
          .end((err, res) => {
            res.should.have.status(200)
            res.body.should.have.a('object')
            transactionProp.forEach(element => {
              expect(res.body.list[0]).to.have.deep.property(element)
            })
            done()
          })
      })
    })
  })
})
