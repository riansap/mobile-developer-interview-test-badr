import { vendorID } from './config'

import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../app/app'
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

let materialDataProp = [
  'id',
  'title',
  'is_ordered_sales',
  'is_ordered_purchase'
]

let materialNestedDataProp = [
  'materials[0].id',
  'materials[0].name',
  'materials[0].description',
  'materials[0].pieces_per_unit',
  'materials[0].unit',
  'materials[0].temperature_sensitive',
  'materials[0].temperature_min',
  'materials[0].temperature_max',
  'materials[0].managed_in_batch',
  'materials[0].manufactures',
  'materials[0].available',
  'materials[0].allocated',
  'materials[0].min',
  'materials[0].max',
  'materials[0].updated_at',
  'materials[0].is_batches',
  'materials[0].batches',
  'materials[0].stock'
]

describe('Data', () => {
  describe('GET /data/app-data', () => {
    it('Download complete', (done) => {
      chai.request(app)
        .get('/data/app-data')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body).not.equal(null)
          expect(res.body).to.have.deep.property('transaction_types')
          expect(res.body).to.have.deep.property('customers')
          expect(res.body).to.have.deep.property('vendors')
          expect(res.body).to.have.deep.property('material_tags')
          expect(res.body.material_tags).to.be.an('array')
          if(res.body.material_tags[0]) {
            materialDataProp.forEach(element => {
              expect(res.body.material_tags[0]).to.have.deep.property(element)
            })
            materialNestedDataProp.forEach(element => {
              expect(res.body.material_tags[0]).to.have.deep.nested.property(element)
            })
          }
          done()
        })
    })

    it('Download unauthorized', (done) => {
      chai.request(app)
        .get('/data/app-data')
        .end((err, res) => {
          res.should.have.status(401)
          expect(res.body).to.have.deep.include({message: 'Unauthorized'})
          res.body.should.have.a('object')
          done()
        })
    })
  })
})
