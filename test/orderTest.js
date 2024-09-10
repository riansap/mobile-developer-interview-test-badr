import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../app/app'
import { customerID, vendorID, invalidField } from './config'
import { seederOrderTest, seederStock, getUser, seederMaterial } from './seeder'
import { USER_ROLE } from '../app/helpers/constants'
import moment from 'moment'

chai.use(chaiHttp)
chai.should()

let authToken = null
let customerToken = null
let orderCreate = {
  'customer_id': customerID,
  'vendor_id': vendorID,
  'status': 1,
  'type': 1,
  'required_date': moment().format('YYYY-MM-DD'),
  'estimated_date': moment().format('YYYY-MM-DD'),
  'purchase_ref': '#PURCHASEREF',
  'sales_ref': '#SREF',
  'order_items': [
    {
      'material_id': 1,
      'ordered_qty': 100,
      'reason_id': 1,
      'other_reason': 'Text'
    }
  ],
  'order_tags': [],
  'order_comment': [
    {
      'comment': 'Put your comment here'
    }
  ]
}

let insertOrderItem = {
  material_id: 2,
  ordered_qty: 100
}
before(function(done){
  getUser.findByRoleEntity(USER_ROLE.OPERATOR, vendorID).then(({token}) => {
    authToken = 'Bearer '+token
    getUser.findByRoleEntity(USER_ROLE.OPERATOR, customerID).then(({token}) => {
      customerToken = 'Bearer '+token
      seederMaterial.findByName('BCG').then(({data}) => {
        orderCreate.order_items[0].material_id = data.id
        done()
      })
    })
  })
})

let orderFulfillID = null
let orderCancelID = null
let orderItem = []
let allocate = []
let updateOrder = {}
describe('Order', () => {
  let invalidCreateSchema = [
    {field: 'customer_id', schema: ['empty', 'not int', 'not exists']},
    {field: 'vendor_id', schema: ['empty', 'not int', 'not exists']},
    {field: 'type', schema: ['empty', 'not exists']},
    {field: 'required_date', schema: ['date', 'expired date']},
    {field: 'estimated_date', schema: ['date']},
    {field: 'order_items', schema: ['empty']},
    {field: 'order_tags', schema: ['empty']}
  ]
  describe('POST /order', () => {
    invalidCreateSchema.forEach(schema => {
      schema.schema.forEach(itemSchema => {
        it(schema.field+' '+itemSchema+' validate', (done) => {
          let invalidSchema = JSON.parse(JSON.stringify(orderCreate))
          invalidSchema[schema.field] = invalidField[itemSchema]
          chai.request(app)
            .post('/order')
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

    it('POST Order Create customer not belongs to vendor', (done) => {
      chai.request(app)
        .post('/order')
        .set('Authorization', authToken)
        .send({ vendor_id: vendorID, customer_id: vendorID })
        .end((err, res) => {
          res.should.have.status(422)
          expect(res.body.message).to.equal('Unprocessable Entity')
          expect(res.body.errors).to.be.an('object')
          expect(res.body.errors).to.have.property('customer_id')
          console.log(res.body.errors)
          expect(res.body.errors['customer_id']).include('Customer not belongs to vendor')
          done()
        })
    })

    it('POST Order Create complete', (done) => {
      chai.request(app)
        .post('/order')
        .set('Authorization', authToken)
        .send(orderCreate)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.have.a('object')
          orderFulfillID = res.body.id
          Object.keys(orderCreate).map(function(item){
            if(item != 'order_comment') expect(res.body).to.have.deep.property(item)
          })
          done()
        })
    })

    it('POST Order Create for Cancel complete', (done) => {
      chai.request(app)
        .post('/order')
        .set('Authorization', authToken)
        .send(orderCreate)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.have.a('object')
          orderCancelID = res.body.id
          Object.keys(orderCreate).map(function(item){
            if(item != 'order_comment') expect(res.body).to.have.deep.property(item)
          })
          updateOrder = JSON.parse(JSON.stringify(res.body))
          updateOrder.required_date = moment().format('YYYY-MM-DD')
          updateOrder.order_items[0].ordered_qty = 120
          done()
        })
    })
  })

  describe('PUT /order/{id}', () => {
    it('Update order complete', done => {
      seederOrderTest.seed().then(({ token }) => {
        chai.request(app)
          .put('/order/'+orderCancelID)
          .set('Authorization', `Bearer ${token}`)
          .send(updateOrder)
          .end((err, res) => {
            res.should.have.status(200)
            expect(res.body).to.have.property('order_items')
            expect(res.body.order_items).to.be.an('array')
            expect(res.body.order_items[0]).to.have.property('id')
            expect(res.body.order_items[0]).to.have.property('qty')
            expect(res.body.order_items[0].qty).to.equal(120)
            done()
          })
      })
    })
  })

  let orderComment = {
    comment: 'Comment Baru_'+Date('now')
  }
  describe('POST /order/{id}/comment', () => {
    it('Create order comment complete', done => {
      chai.request(app)
        .post('/order/'+orderFulfillID+'/comment')
        .set('Authorization', authToken)
        .send(orderComment)
        .end((err, res) => {
          res.should.have.status(201)
          expect(res.body).to.have.property('comment')
          expect(res.body.comment).to.equal(orderComment.comment)
          done()
        })
    })
  })

  describe('GET /order', () => {
    it('GET Order Detail complete', (done) => {
      chai.request(app)
        .get('/order/'+orderFulfillID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          Object.keys(orderCreate).map(function(item){
            if(item != 'order_comment') expect(res.body).to.have.deep.property(item)
          })
          done()
        })
    })
  })

  let orderStatus = {
    'comment': 'Alasan atau Komentar'
  }
  describe('PUT /order/{id}/confirm', () => {
    it('PUT Order Confirm complete', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/confirm')
        .set('Authorization', authToken)
        .send(orderStatus)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body.user_confirmed_by).to.have.deep.property('id')
          done()
        })
    })

    it('PUT Order Confirm Failed', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/confirm')
        .set('Authorization', authToken)
        .send(orderStatus)
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.have.a('object')
          expect(res.body).to.have.deep.property('message')
          expect(res.body.errors.general[0]).to.equal('Order status cannot changed to same status')
          done()
        })
    })
  })

  describe('PUT /order/{id}/pending', () => {
    it('PUT Order Pending complete', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/pending')
        .set('Authorization', authToken)
        .send(orderStatus)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body.user_created_by).to.have.deep.property('id')
          done()
        })
    })

    it('PUT Order Pending Failed', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/pending')
        .set('Authorization', authToken)
        .send(orderStatus)
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.have.a('object')
          expect(res.body).to.have.deep.property('message')
          expect(res.body.errors.general[0]).to.equal('Order status cannot changed to same status')
          done()
        })
    })

    it('PUT Order Confirm Again complete', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/confirm')
        .set('Authorization', authToken)
        .send(orderStatus)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body.user_confirmed_by).to.have.deep.property('id')
          done()
        })
    })
  })

  describe('GET order/{id}/order-items', () => {
    it('GET Order Items complete', (done) => {
      chai.request(app)
        .get('/order/'+orderFulfillID+'/order-items')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          expect(res.body).to.be.an('array')
          expect(res.body[0]).to.have.deep.property('id')
          expect(res.body[0]).to.have.deep.property('order_id')
          expect(res.body[0]).to.have.deep.property('material_id')
          expect(res.body[0]).to.have.deep.property('qty')
          res.body.forEach(element => {
            // findStockAvailable()
            seederStock.findByMaterialID(element.material_id, vendorID, element.qty).then(({ stock }) => {
              console.log(stock)
              let allocateField = {
                'status': 1,
                'order_item_id': element.id,
                'allocated_stock_id': stock.id,
                'allocated_qty': element.qty
              }
              allocate.push(allocateField)
            })
          })
          done()
        })
    })
  })

  describe('PUT /order/{id}/order-items', () => {
    const invalidSchemaInsertOrderItems = [
      {
        field: 'order_items',
        messages: ['Order Items must be array format'],
        send: { order_items: 'test error' },
        title: 'Insert order item must be array',
        route: '/order/3/order-items'
      },
      {
        field: 'order_items[0].material_id',
        messages: ['Material cannot be empty', 'Material must be number'],
        send: { order_items: [{}] },
        title: 'Insert order item material id must be a number and cannot be empty',
        route: '/order/3/order-items'
      },
      {
        field: 'order_items[0].material_id',
        messages: ['Material is not exist'],
        send: { order_items: [{ material_id: 99999 }] },
        title: 'Insert order item material id not exists',
        route: '/order/3/order-items'
      },
      {
        field: 'order_items[0].ordered_qty',
        messages: ['Order Quantity cannot be empty', 'Order Quantity must be number'],
        send: { order_items: [{ ordered_qty: ''}] },
        title: 'Insert order item ordered qty not empty and must be a number',
        route: '/order/3/order-items'
      },
      {
        field: 'order_items[0].material_id',
        messages: ['Ordered qty it is not in multiples with pieces per unit material'],
        send: { order_items: [{ ordered_qty: 1, material_id: 2}] },
        title: 'Insert order item ordered qty not multiples pieces of unit',
        route: '/order/3/order-items'
      },
    ]

    invalidSchemaInsertOrderItems.forEach(item => {
      return it(item.title, done => {
        seederOrderTest.seed().then(({ token }) => {
          chai.request(app)
            .put('/order/'+orderCancelID+'/order-items')
            .set('Authorization', `Bearer ${token}`)
            .send(item.send)
            .end((err, res) => {
              res.should.have.status(422)
              expect(res.body.message).to.equal('Unprocessable Entity')
              expect(res.body.errors).to.be.an('object')
              expect(res.body.errors).to.have.property(item.field)
              expect(res.body.errors[item.field]).include(...item.messages)
              done()
            })
        })
      })
    })
    it('Insert order item complete', done => {
      seederOrderTest.seed().then(({ token, material }) => {
        insertOrderItem.material_id = material.id
        chai.request(app)
          .put('/order/'+orderCancelID+'/order-items')
          .set('Authorization', `Bearer ${token}`)
          .send({
            order_items: [
              insertOrderItem
            ]
          })
          .end((err, res) => {
            res.should.have.status(200)
            expect(res.body).to.have.property('order_items')
            expect(res.body.order_items).to.be.an('array')
            expect(res.body.order_items[0]).to.have.property('id')
            const { order_items } = res.body
            const orderItem = order_items.find(item => item.material_id === insertOrderItem.material_id)
            expect(orderItem).to.have.property('qty')
            const { qty } = orderItem
            expect(qty).to.equal(insertOrderItem.ordered_qty)
            done()
          })
      })
    })
  })

  let invalidAllocateSchema = [
    {field: 'id', schema: ['not int']},
    {field: 'order_item_id', schema: ['empty', 'not int', 'not_exists']},
    {field: 'allocated_stock_id', schema: ['empty', 'not int', 'not_exists']},
    {field: 'allocated_qty', schema: ['empty', 'not int', 'not_exists']}
  ]
  describe('PUT /order/{id}/allocate', () => {
    invalidAllocateSchema.forEach(schema => {
      schema.schema.forEach(itemSchema => {
        it(schema.field+' '+itemSchema+' validate', (done) => {
          let invalidSchema = JSON.parse(JSON.stringify(allocate))
          invalidSchema[0][schema.field] = invalidField[itemSchema]
          chai.request(app)
            .put('/order/'+ orderFulfillID +'/allocate')
            .set('Authorization', authToken)
            .send(invalidSchema)
            .end((err, res) => {
              res.should.have.status(422)
              expect(res.body).to.have.deep.property('message')
              expect(res.body).to.have.deep.property('errors')
              expect(res.body.errors).to.have.deep.property('[0].'+schema.field)
              done()
            })
        })
      })
      it('Stock invalid validate', (done) => {
        let invalidSchema = JSON.parse(JSON.stringify(allocate))
        invalidSchema[0]['allocated_stock_id'] = 1
        chai.request(app)
          .put('/order/'+ orderFulfillID +'/allocate')
          .set('Authorization', authToken)
          .send(invalidSchema)
          .end((err, res) => {
            res.should.have.status(422)
            expect(res.body).to.have.deep.property('message')
            expect(res.body).to.have.deep.property('errors')
            done()
          })
      })
    })

    it('PUT Order Allocate Empty', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/allocate')
        .set('Authorization', authToken)
        .send([])
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.have.a('object')
          done()
        })
    })

    it('PUT Order Allocate not Array', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/allocate')
        .set('Authorization', authToken)
        .send({test: 'Aaabbb'})
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.have.a('object')
          done()
        })
    })

    it('PUT Order Allocate complete to pending', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/allocate')
        .set('Authorization', authToken)
        .send(allocate)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body).to.have.property('order_items')
          done()
        })
    })

    it('PUT Order Allocate pending', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/pending')
        .set('Authorization', authToken)
        .send(orderStatus)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })

    it('PUT Order Allocate confirm', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/confirm')
        .set('Authorization', authToken)
        .send(orderStatus)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })

    it('PUT Order Allocate expired batch', (done) => {
      let expiredBatch = JSON.parse(JSON.stringify(allocate))
      expiredBatch[0].allocated_stock_id = '500'
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/allocate')
        .set('Authorization', authToken)
        .send(expiredBatch)
        .end((err, res) => {
          res.should.have.status(422)
          expect(res.body).to.have.deep.property('errors')
          expect(res.body.errors).to.have.deep.property('[0]')
          expect(res.body.errors['[0]']).to.deep.equal(['Batch expired'])
          done()
        })
    })

    it('PUT Order Allocate complete', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/allocate')
        .set('Authorization', authToken)
        .send(allocate)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body).to.have.property('order_items')
          res.body.order_items.forEach(element => {
            expect(element).to.have.property('id')
            expect(element).to.have.property('material_id')
            expect(element).to.have.property('qty')
            let { id, material_id, qty } = element
            let orderStock = []
            element.order_stocks.forEach(stock => {
              orderStock.push({
                id: stock.id,
                stock_id: stock.stock_id,
                status: stock.status,
                received_qty: element.qty
              })
            })
            orderItem.push({ id: id, material_id: material_id, order_stocks: orderStock, qty: qty })
          })
          expect(orderItem).to.not.empty
          done()
        })
    })
  })

  let ship = JSON.parse(JSON.stringify(orderStatus))
  ship.estimated_date = moment().format('YYYY-MM-DD')
  ship.sales_ref = '#ffffa'
  // ship.track_device = {
  //   id: 1,
  //   nopol: 'UNDP02'
  // }
  let invalidShip = []
  invalidShip['estimated_date format'] = JSON.parse(JSON.stringify(ship))
  invalidShip['estimated_date format'].estimated_date = 'INVALID DATE'
  invalidShip['estimated_date less than'] = JSON.parse(JSON.stringify(ship))
  invalidShip['estimated_date less than'].estimated_date = '2019-03-30'

  describe('PUT /order/{id}/ship', () => {
    for (const key in invalidShip) {
      it(key+' validate', (done) => {
        chai.request(app)
          .put('/order/'+ orderFulfillID +'/ship')
          .set('Authorization', authToken)
          .send(invalidShip[key])
          .end((err, res) => {
            res.should.have.status(422)
            expect(res.body).to.have.deep.property('message')
            done()
          })
      })
    }

    it('PUT Order Ship Success', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/ship')
        .set('Authorization', authToken)
        .send(ship)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body.user_shipped_by).to.have.deep.property('id')
          done()
        })
    })

    it('PUT Order Ship Fail', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/ship')
        .set('Authorization', authToken)
        .send(ship)
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.have.a('object')
          expect(res.body).to.have.deep.property('message')
          expect(res.body.errors.general[0]).to.equal('Order status cannot changed to same status')
          done()
        })
    })

    it('PUT Order Pending after ship Failed', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/pending')
        .set('Authorization', authToken)
        .send(orderStatus)
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.have.a('object')
          expect(res.body).to.have.deep.property('message')
          expect(res.body.errors.general[0]).to.equal('Order status cannot changed to previous state')
          done()
        })
    })
  })

  // fulfill with other user
  let fulfill = JSON.parse(JSON.stringify(orderStatus))
  fulfill.fulfilled_at = moment().format('YYYY-MM-DD')
  fulfill.comment = 'Comment Fulfilled success'
  fulfill.order_items = orderItem

  let invalidFulfillSchema = [
    {field: 'fulfilled_at', schema: ['empty', 'date']},
    {field: 'order_items', schema: ['empty']}
  ]
  describe('PUT /order/{id}/fulfilled', () => {
    invalidFulfillSchema.forEach(schema => {
      schema.schema.forEach(itemSchema => {
        it(schema.field+' '+itemSchema+' validate', (done) => {
          let invalidSchema = JSON.parse(JSON.stringify(fulfill))
          invalidSchema[schema.field] = invalidField[itemSchema]
          chai.request(app)
            .put('/order/'+ orderFulfillID +'/fulfilled')
            .set('Authorization', authToken)
            .send(invalidSchema)
            .end((err, res) => {
              res.should.have.status(422)
              expect(res.body).to.have.deep.property('message')
              expect(res.body.errors).to.have.deep.property(schema.field)
              done()
            })
        })
      })
    })

    it('PUT Order Fulfilled Unauthorized', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/fulfilled')
        .set('Authorization', authToken)
        .send(fulfill)
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.have.a('object')
          expect(res.body.errors.general[0]).to.equal('Order status cannot changed with this user')
          done()
        })
    })

    it('PUT Order Fulfilled Success', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/fulfilled')
        .set('Authorization', customerToken)
        .send(fulfill)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body.user_fulfilled_by).to.have.deep.property('id')
          done()
        })
    })

    it('PUT Order Fulfilled Fail', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/fulfilled')
        .set('Authorization', customerToken)
        .send(fulfill)
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.have.a('object')
          expect(res.body).to.have.deep.property('message')
          expect(res.body.errors.general[0]).to.equal('Order status cannot changed to same status')
          done()
        })
    })
  })

  let invalidCancelSchema = [
    {field: 'cancel_reason', schema: ['not exists', 'not int']}
  ]
  describe('PUT /order/{id}/cancel', () => {
    invalidCancelSchema.forEach(schema => {
      schema.schema.forEach(itemSchema => {
        it(schema.field+' '+itemSchema+' validate', (done) => {
          let invalidSchema = JSON.parse(JSON.stringify(fulfill))
          invalidSchema[schema.field] = invalidField[itemSchema]
          chai.request(app)
            .put('/order/'+ orderCancelID +'/cancel')
            .set('Authorization', authToken)
            .send(invalidSchema)
            .end((err, res) => {
              res.should.have.status(422)
              expect(res.body).to.have.deep.property('message')
              expect(res.body.errors).to.have.deep.property(schema.field)
              done()
            })
        })
      })
    })
    orderStatus.other_reason = 'Other Reason'
    it('PUT Order Cancel Success', (done) => {
      chai.request(app)
        .put('/order/'+ orderCancelID +'/cancel')
        .set('Authorization', authToken)
        .send(orderStatus)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body.user_cancelled_by).to.have.deep.property('id')
          done()
        })
    })

    it('PUT Order Cancel Fail already Fulfill', (done) => {
      chai.request(app)
        .put('/order/'+ orderFulfillID +'/cancel')
        .set('Authorization', authToken)
        .send(orderStatus)
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.have.a('object')
          expect(res.body).to.have.deep.property('message')
          expect(res.body.errors.general[0]).to.equal('Order status cannot changed, order has fulfilled')
          done()
        })
    })
  })

  describe('GET /orders', () => {
    it('GET Order List Success', (done) => {
      chai.request(app)
        .get('/orders')
        .query({purpose: 'sales'})
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  let queryFilter = [
    {type: 2},
    {type: 1},
    {purpose: 'purchase'},
    {purpose: 'sales'},
    {vendorId: '1'},
    {customerId: '1'},
    {ordered_number: '1'},
    {purchase_ref: '#SREF'},
    {sales_ref: '#SREF'},
    {from_date: '2020-01-01'},
    {to_date: '2020-12-12'},
    {tags: '[1,2]'},
  ]

  describe('GET /orders/status', () => {
    queryFilter.forEach(query => {
      it('GET Order Status List by ' + JSON.stringify(query) + ' complete', (done) => {
        chai.request(app)
          .get('/orders/status')
          .query(query)
          .set('Authorization', authToken)
          .end((err, res) => {
            res.should.have.status(200)
            res.body.should.have.a('object')
            done()
          })
      })
    })

    it('GET Order Status List Success', (done) => {
      chai.request(app)
        .get('/orders/status')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  describe('GET order/{id}/order-histories', () => {
    it('GET Order Histories complete', (done) => {
      chai.request(app)
        .get('/order/'+orderFulfillID+'/histories')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          done()
        })
    })
  })
})
