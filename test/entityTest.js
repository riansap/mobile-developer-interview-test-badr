import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../app/app'
import { vendorID, customerID } from './config'
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

describe('Entity', () => {
  let entityID = 0
  let createEntity = {
    'name': 'Testing Entity',
    'address': 'Testing Entity Address',
    'code': 'DELTEDENTITY99',
    'type': 2
  }
  let nameEmpty = JSON.parse(JSON.stringify(createEntity))
  nameEmpty.name = null

  let addressEmpty = JSON.parse(JSON.stringify(createEntity))
  addressEmpty.address = null

  let typeInvalid = JSON.parse(JSON.stringify(createEntity))
  typeInvalid.type = 9999

  let typeEmpty = JSON.parse(JSON.stringify(createEntity))
  typeEmpty.type = null

  const invalidSchema = {
    'name empty': nameEmpty,
    'address empty': addressEmpty,
    'invalid type': typeInvalid,
    'type empty': typeEmpty
  }

  describe('POST /entity', () => {
    it('Create user complete', (done) => {
      chai.request(app)
        .post('/entity')
        .set('Authorization', authToken)
        .send(createEntity)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.have.a('object')
          expect(res.body).to.have.property('id')
          expect(res.body).to.deep.include(createEntity)
          entityID = res.body.id
          done()
        })
    })

    for (const key in invalidSchema) {
      it(key+' validate', (done) => {
        chai.request(app)
          .post('/entity')
          .set('Authorization', authToken)
          .send([invalidSchema[key]])
          .end((err, res) => {
            res.should.have.status(422)
            expect(res.body).to.have.deep.property('message')
            done()
          })
      })
    }
  })

  let queryFilter = [
    {keyword: 'Entit'},
  ]
  describe('GET /entities', () => {
    it('Get Entity complete', (done) => {
      chai.request(app)
        .get('/entities')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })

    queryFilter.forEach(query => {
      it('Get entities by ' + JSON.stringify(query) + ' complete', (done) => {
        chai.request(app)
          .get('/entities')
          .query(query)
          .set('Authorization', authToken)
          .end((err, res) => {
            res.should.have.status(200)
            res.body.should.have.a('object')
            done()
          })
      })
    })
  })

  describe('GET /entity/{id}', () => {
    it('Get entity complete', (done) => {
      chai.request(app)
        .get('/entity/'+entityID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body).to.deep.include(createEntity)
          done()
        })
    })
  })

  let entityCustomer = {
    'customer_id': [
      customerID
    ]
  }

  describe('PUT vendor-customers', () => {
    it('PUT entity customer complete', (done) => {
      chai.request(app)
        .put('/entity/'+vendorID+'/customers')
        .set('Authorization', authToken)
        .send(entityCustomer)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  describe('PUT /entity/customers', () => {
    it('PUT entity customer complete', (done) => {
      chai.request(app)
        .put('/entity/'+entityID+'/customers')
        .set('Authorization', authToken)
        .send(entityCustomer)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  describe('GET /entity/customers', () => {
    it('Get entity customer complete', (done) => {
      chai.request(app)
        .get('/entity/'+entityID+'/customers')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })

    it('Get entity customer by name complete', (done) => {
      chai.request(app)
        .get('/entity/'+entityID+'/customers')
        .query({keyword: 'Entit'})
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  describe('GET /entity/vendors', () => {
    it('Get entity vendors complete', (done) => {
      chai.request(app)
        .get('/entity/'+customerID+'/vendors')
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })

    it('Get entity vendors by name complete', (done) => {
      chai.request(app)
        .get('/entity/'+customerID+'/vendors')
        .query({keyword: createEntity.name})
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })

  createEntity.name = createEntity.name + ' update'
  createEntity.address = createEntity.address + ' update'
  describe('PUT /entity', () => {
    it('Update entity complete', (done) => {
      chai.request(app)
        .put('/entity/'+entityID)
        .set('Authorization', authToken)
        .send(createEntity)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body.name).to.equal(createEntity.name)
          expect(res.body).to.deep.include(createEntity)
          done()
        })
    })

    it('Update entity NULL ID', (done) => {
      chai.request(app)
        .put('/entity/')
        .set('Authorization', authToken)
        .send(createEntity)
        .end((err, res) => {
          res.should.have.status(404)
          done()
        })
    })

    it('Update entity False ID', (done) => {
      chai.request(app)
        .put('/entity/'+'ID')
        .set('Authorization', authToken)
        .send(createEntity)
        .end((err, res) => {
          res.should.have.status(422)
          done()
        })
    })

    for (const key in invalidSchema) {
      it('PUT entity '+key+' validate', (done) => {
        chai.request(app)
          .put('/entity/'+entityID)
          .set('Authorization', authToken)
          .send([invalidSchema[key]])
          .end((err, res) => {
            res.should.have.status(422)
            expect(res.body).to.have.deep.property('message')
            done()
          })
      })
    }
  })

  describe('DELETE /entity', () => {
    it('Delete entity complete', (done) => {
      chai.request(app)
        .delete('/entity/'+entityID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })
})
