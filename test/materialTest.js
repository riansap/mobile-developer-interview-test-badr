import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../app/app'
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

describe('Material', () => {
  describe('GET /materials', () => {
    it('Get Material Entity complete', (done) => {
      chai.request(app)
        .get('/materials')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  let materialID = 0
  let createMaterial = {
    'name': 'TM_'+Date.now(),
    'description': 'Testing Description Material '+Date.now(),
    'pieces_per_unit': 10,
    'unit': 'pieces',
    'temperature_sensitive': 0,
    'temperature_min': 10,
    'temperature_max': 30,
    'manufactures': [1],
    'managed_in_batch': 0,
    'material_tags': [4]
  }

  let nameEmpty = JSON.parse(JSON.stringify(createMaterial))
  delete nameEmpty.name
  let nameNotString = JSON.parse(JSON.stringify(createMaterial))
  nameNotString.name = 123
  let descriptionEmpty = JSON.parse(JSON.stringify(createMaterial))
  delete descriptionEmpty.description
  let piecePerUnitEmpty = JSON.parse(JSON.stringify(createMaterial))
  delete piecePerUnitEmpty.pieces_per_unit
  let piecePerUnitNotInt = JSON.parse(JSON.stringify(createMaterial))
  piecePerUnitNotInt.pieces_per_unit = 'AABBCC'
  let unitEmpty = JSON.parse(JSON.stringify(createMaterial))
  delete unitEmpty.unit
  let temperatureEmpty = JSON.parse(JSON.stringify(createMaterial))
  delete temperatureEmpty.temperature_sensitive
  let temperatureNotInt = JSON.parse(JSON.stringify(createMaterial))
  temperatureNotInt.temperature_sensitive = 'AAASSS'
  let minEmpty = JSON.parse(JSON.stringify(createMaterial))
  delete minEmpty.temperature_min
  let minNotInt = JSON.parse(JSON.stringify(createMaterial))
  minNotInt.temperature_min = 'AAAA'
  let maxEmpty = JSON.parse(JSON.stringify(createMaterial))
  delete maxEmpty.temperature_max
  let maxNotInt = JSON.parse(JSON.stringify(createMaterial))
  maxNotInt.temperature_max = 'AAAAA'

  const invalidSchema = {
    'name empty': nameEmpty,
    'name not string': nameNotString,
    'description empty': descriptionEmpty,
    'pieces_per_unit empty': piecePerUnitEmpty,
    'pieces_per_unit not int': piecePerUnitNotInt,
    'unit empty': unitEmpty,
    'temperature empty': temperatureEmpty,
    'temperature not int': temperatureNotInt,
    'temp_min empty': minEmpty,
    'temp_min not int': minNotInt,
    'temp_max empty': maxEmpty,
    'temp_max not int': maxNotInt
  }

  describe('POST /material', () => {
    for (const key in invalidSchema) {
      it(key+' validate', (done) => {
        chai.request(app)
          .post('/material')
          .set('Authorization', authToken)
          .send([invalidSchema[key]])
          .end((err, res) => {
            res.should.have.status(422)
            expect(res.body).to.have.deep.property('message')
            done()
          })
      })
    }

    it('Create Material complete', (done) => {
      chai.request(app)
        .post('/material')
        .set('Authorization', authToken)
        .send(createMaterial)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.have.a('object')
          expect(res.body).to.have.property('id')
          materialID = res.body.id
          done()
        })
    })
  })

  describe('GET /material', () => {
    it('Get material complete', (done) => {
      chai.request(app)
        .get('/material/'+materialID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  describe('PUT /material', () => {
    createMaterial.name = createMaterial.name + '_update'
    it('Update material complete', (done) => {
      chai.request(app)
        .put('/material/'+materialID)
        .set('Authorization', authToken)
        .send(createMaterial)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body.name).to.equal(createMaterial.name)
          done()
        })
    })

    it('Update material ID NULL', (done) => {
      chai.request(app)
        .put('/material')
        .set('Authorization', authToken)
        .send(createMaterial)
        .end((err, res) => {
          res.should.have.status(404)
          done()
        })
    })

    it('Update material ID Invalid', (done) => {
      chai.request(app)
        .put('/material/'+'ID')
        .set('Authorization', authToken)
        .send(createMaterial)
        .end((err, res) => {
          res.should.have.status(422)
          done()
        })
    })
  })

  describe('DELETE /material', () => {
    it('Delete material complete', (done) => {
      chai.request(app)
        .delete('/material/'+materialID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })
})
