import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../app/app'
import { invalidField, vendorID } from './config'
import { getUser, seederMaterial } from './seeder'
import { USER_ROLE } from '../app/helpers/constants'
import { create } from 'lodash'

chai.use(chaiHttp)
chai.should()

let authToken = null
let material = {}
let materialEntityID = 0
let createMaterialEntity = {
  'material_id': material.id,
  'entity_id': vendorID,
  'pieces_per_unit': 10,
  'consumption_rate': 10,
  'retailer_price': 10000,
  'tax': 1000,
  'min': 20,
  'max': 200
}
let updateMaterialEntity = JSON.parse(JSON.stringify(createMaterialEntity))
before(function(done){
  getUser.findByRoleEntity(USER_ROLE.SUPERADMIN, null).then(({token}) => {
    authToken = 'Bearer '+token
    seederMaterial.findByName('BCG Diluent').then(({data}) => {
      createMaterialEntity.material_id = data.id
      updateMaterialEntity.pieces_per_unit = 50
      updateMaterialEntity.material_id = data.id
      done()
    })
  })
})

describe('Material Entity', () => {
  let invalidCreateSchema = [
    {field: 'material_id', schema: ['empty', 'not exists']},
    {field: 'entity_id', schema: ['empty', 'not exists']},
    {field: 'consumption_rate', schema: ['empty', 'not int']},
    {field: 'retailer_price', schema: ['empty', 'not int']},
    {field: 'tax', schema: ['empty', 'not int']},
    {field: 'min', schema: ['empty', 'not int']},
    {field: 'max', schema: ['empty', 'not int']},
  ]
  describe('POST /material-entity', () => {
    invalidCreateSchema.forEach(schema => {
      schema.schema.forEach(itemSchema => {
        it(schema.field+' '+itemSchema+' validate', (done) => {
          let invalidSchema = JSON.parse(JSON.stringify(createMaterialEntity))
          invalidSchema[schema.field] = invalidField[itemSchema]
          chai.request(app)
            .post('/material-entity')
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

    it('Create Material Entity complete', (done) => {
      chai.request(app)
        .post('/material-entity')
        .set('Authorization', authToken)
        .send(createMaterialEntity)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.have.a('object')
          expect(res.body).to.have.property('id')
          materialEntityID = res.body.id
          done()
        })
    })
  })

  describe('GET /material-entities', () => {
    it('Get Material Entity complete', (done) => {
      chai.request(app)
        .get('/material-entities')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  describe('GET /material-entity/{id}', () => {
    it('Get material entity complete', (done) => {
      chai.request(app)
        .get('/material-entity/'+materialEntityID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  describe('PUT /material-entity', () => {
    it('Update material entity ID NULL', (done) => {
      chai.request(app)
        .put('/material-entity/')
        .set('Authorization', authToken)
        .send(updateMaterialEntity)
        .end((err, res) => {
          res.should.have.status(404)
          res.body.should.have.a('object')
          done()
        })
    })

    it('Update material entity ID Invalid', (done) => {
      chai.request(app)
        .put('/material-entity/ID')
        .set('Authorization', authToken)
        .send(updateMaterialEntity)
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.have.a('object')
          done()
        })
    })

    it('Update material entity complete', (done) => {
      chai.request(app)
        .put('/material-entity/'+materialEntityID)
        .set('Authorization', authToken)
        .send(updateMaterialEntity)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          // expect(res.body.pieces_per_unit).to.equal(updateMaterialEntity.pieces_per_unit)
          expect(res.body.consumption_rate).to.equal(updateMaterialEntity.consumption_rate)
          expect(res.body.retailer_price).to.equal(updateMaterialEntity.retailer_price)
          done()
        })
    })
  })

  describe('DELETE /material-entity', () => {
    it('Delete material entity complete', (done) => {
      chai.request(app)
        .delete('/material-entity/'+materialEntityID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })

    const materialEntityFailID = 4
    it('Delete material entity fail has order active', (done) => {
      chai.request(app)
        .delete('/material-entity/'+materialEntityFailID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(422)
          res.body.should.have.a('object')
          done()
        })
    })
  })
})
