import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../app/app'
import { vendorID, invalidField } from './config'
import { getUser, getManufacture } from './seeder'
import { USER_ROLE } from '../app/helpers/constants'

chai.use(chaiHttp)
chai.should()

let authToken = null
let createManufacture = {
  'name': 'Manufacture_Test_'+Date.now(),
  'description': 'Description AAA',
  'reference_id': '000',
  'contact_name': 'Test',
  'phone_number': '08123123213',
  'email': 'example@email.com',
  'address': 'JL Cempaka'
}
let manufactureID = null
let updateManufacture = JSON.parse(JSON.stringify(createManufacture))
updateManufacture.name = updateManufacture.name + '_update'
let manufactureProp = [
  'id',
  'name',
  'description',
  'reference_id',
  'contact_name',
  'phone_number',
  'email',
  'address',
  'materials',
  'user_created_by',
  'user_updated_by',
  'user_deleted_by'
]
// let manufacture = {}
before(function(done){
  getUser.findByRoleEntity(USER_ROLE.SUPERADMIN, null).then(({token}) => {
    authToken = 'Bearer '+token
    getManufacture.findByName('Manufacture Test').then(({data}) => { 
      // manufacture = data
      done()
    })
  })
})

describe('Manufacture', () => {
  describe('POST /manufacture', () => {
    let invalidCreateSchema = [
      {field: 'name', schema: ['empty']},
      {field: 'phone_number', schema: ['not int']},
    ]
    invalidCreateSchema.forEach(schema => {
      schema.schema.forEach(itemSchema => {
        it(schema.field+' '+itemSchema+' validate', (done) => {
          let invalidSchema = JSON.parse(JSON.stringify(createManufacture))
          invalidSchema[schema.field] = invalidField[itemSchema]
          chai.request(app)
            .post('/material-tag')
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

    it('Create Manufacture complete', (done) => {
      chai.request(app)
        .post('/manufacture')
        .set('Authorization', authToken)
        .send(createManufacture)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.have.a('object')
          expect(res.body).to.have.property('id')
          manufactureID = res.body.id
          done()
        })
    })

    it('Find created Manufacture', (done) => {
      chai.request(app)
        .get('/manufacture/'+manufactureID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body.name).to.equal(createManufacture.name)
          done()
        })
    })
  })

  describe('GET /manufacture', () => {
    it('Get Manufacture complete', (done) => {
      chai.request(app)
        .get('/manufacture/'+manufactureID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  describe('PUT /manufacture', () => {
    it('Update Manufacture complete', (done) => {
      chai.request(app)
        .put('/manufacture/'+manufactureID)
        .set('Authorization', authToken)
        .send(updateManufacture)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body.name).to.equal(updateManufacture.name)
          done()
        })
    })
  })

  describe('GET /manufactures', () => {
    it('Get manufactures complete', (done) => {
      chai.request(app)
        .get('/manufactures')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          manufactureProp.forEach(element => {
            expect(res.body.list[0]).to.have.deep.property(element)
          })
          done()
        })
    })
  })

  describe('DELETE /manufacture', () => {
    it('Delete Manufacture complete', (done) => {
      chai.request(app)
        .delete('/manufacture/'+manufactureID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })

    it('Find deleted Manufacture', (done) => {
      chai.request(app)
        .get('/manufacture/'+manufactureID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(404)
          done()
        })
    })
  })
})
