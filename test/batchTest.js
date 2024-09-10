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
  getUser.findByRoleEntity(USER_ROLE.OPERATOR, vendorID).then(({token}) => {
    authToken = 'Bearer '+token
    done()
  })
})

let batchProp = [
  'id', 
  'code', 
  'expired_date', 
  'production_date', 
  'manufacture_id', 
  'manufacture_name'
]

let nestedBatchProp = [
]

describe('Batch', () => {
  describe('GET /batches', () => {
    it('Get batches complete', (done) => {
      chai.request(app)
        .get('/batches')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          batchProp.forEach(element => {
            expect(res.body.list[0]).to.have.deep.property(element)
          })
          nestedBatchProp.forEach(element => {
            expect(res.body.list[0]).to.have.deep.nested.property(element)
          })
          done()
        })
    })

    it('Get batches by keyword complete', (done) => {
      chai.request(app)
        .get('/batches')
        .query({keyword: 'AABB'})
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })
})
