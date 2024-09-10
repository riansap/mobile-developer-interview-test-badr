import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../app/app'
import { USER_ROLE } from '../app/helpers/constants'
import { shipmentData } from './data/exterminationData'
import { stockSchema, successSchema } from './schema/exterminationSchema'
import { getUser } from './seeder'
import { checkBody } from './templates/templateTest'
import models from '../app/models'

chai.use(chaiHttp)
chai.should()

let vendorID = 40900, authToken = null

before(function(done){
  getUser.findByRoleEntity(USER_ROLE.SUPERADMIN, vendorID).then(({token}) => {
    authToken = 'Bearer '+token
    done()
  })
})

describe('Transaction Extermination', () => {
  describe('POST /v2/extermination/shipment', () => {
    it('Post an extermination shipment', async(done) => {
      try {
        const stockExtrmination1 = await models.StockExtermination.findOne({where: { id: shipmentData.order_items[0].stocks[0].stock_exterminations[0].stock_extermination_id }})
        await stockExtrmination1.update({extermination_discard_qty: 6})
        const stockExtrmination2 = await models.StockExtermination.findOne({where: { id: shipmentData.order_items[0].stocks[1].stock_exterminations[0].stock_extermination_id }})
        await stockExtrmination2.update({extermination_discard_qty: 6})
        console.log(stockExtrmination2);
        
        chai.request(app)
          .post('/v2/extermination/shipment')
          .set('Authorization', authToken)
          .send(shipmentData)
          .end((err, res) => {
            console.log(res.body);
            res.should.have.status(201)
            checkBody({data: res.body, rules: successSchema})
            done()
          })
      } catch (error) {
        console.error(error)
      }
    })
    it('Get a Stock Extermination', (done) => {
      chai.request(app)
        .get('/v2/stock-extermination')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          checkBody({data: res.body.list[0], rules: stockSchema})
          done()
        })
    })
  })
})
