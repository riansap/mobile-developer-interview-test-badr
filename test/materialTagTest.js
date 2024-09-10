import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../app/app'
import { invalidField, vendorID } from './config'
import { getUser, getMaterialTag } from './seeder'
import { USER_ROLE } from '../app/helpers/constants'

chai.use(chaiHttp)
chai.should()

let authToken = null
let materialTag = {}
before(function(done){
  getUser.findByRoleEntity(USER_ROLE.SUPERADMIN, null).then(({token}) => {
    authToken = 'Bearer '+token
    getMaterialTag.findByTitle('RI Vaccine').then(({data}) => {
      materialTag = data
      done()
    })
  })
})

describe('Material Tag', () => {
  let materialTagID = 0
  let createMaterialTag = {
    'title': 'TM_'+Date.now()
  }
  let invalidCreateSchema = [
    {field: 'title', schema: ['empty']},
  ]
  describe('POST /material-tag', () => {
    invalidCreateSchema.forEach(schema => {
      schema.schema.forEach(itemSchema => {
        it(schema.field+' '+itemSchema+' validate', (done) => {
          let invalidSchema = JSON.parse(JSON.stringify(createMaterialTag))
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

    it('Create Material Tag complete', (done) => {
      chai.request(app)
        .post('/material-tag')
        .set('Authorization', authToken)
        .send(createMaterialTag)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.have.a('object')
          expect(res.body).to.have.property('id')
          materialTagID = res.body.id
          expect(res.body).to.deep.include(createMaterialTag)
          done()
        })
    })
  })

  describe('GET /material-tags', () => {
    it('Get Material Tag complete', (done) => {
      chai.request(app)
        .get('/material-tags')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  describe('GET /material-tag', () => {
    it('Get material tag complete', (done) => {
      chai.request(app)
        .get('/material-tag/'+materialTagID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body).to.have.property('id')
          expect(res.body).to.deep.include(createMaterialTag)
          done()
        })
    })
  })

  describe('PUT /material-tag', () => {
    createMaterialTag.title = createMaterialTag.title + '_update'
    it('Update material tag ID null', (done) => {
      chai.request(app)
        .put('/material-tag/')
        .set('Authorization', authToken)
        .send(createMaterialTag)
        .end((err, res) => {
          res.should.have.status(404)
          done()
        })
    })

    it('Update material tag ID Invalid', (done) => {
      chai.request(app)
        .put('/material-tag/ID')
        .set('Authorization', authToken)
        .send(createMaterialTag)
        .end((err, res) => {
          res.should.have.status(422)
          done()
        })
    })

    it('Update material tag complete', (done) => {
      chai.request(app)
        .put('/material-tag/'+materialTagID)
        .set('Authorization', authToken)
        .send(createMaterialTag)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body.name).to.equal(createMaterialTag.name)
          expect(res.body).to.deep.include(createMaterialTag)
          done()
        })
    })
  })

  describe('DELETE /material-tag', () => {
    it('Delete material tag complete', (done) => {
      chai.request(app)
        .delete('/material-tag/'+materialTagID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })
})
