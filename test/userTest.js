import chai, { expect } from 'chai'
import chaiHttp from 'chai-http'
import app from '../app/app'
// import { vendorID } from './config'
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
describe('User', () => {
  let userID = 0
  let username = 'unittest_'+Date.now()
  let createUser = {
    'username': username,
    'email': username+'@example.com',
    'password': 'Password123*',
    'firstname': 'First Name',
    'lastname': 'Last Name',
    'gender': 1,
    'date_of_birth': '1990-01-01',
    'mobile_phone': '08129090090',
    'address': 'JL. Raya Margonda, No.1',
    'role': 4,
    'entity_id': 1,
    'view_only': 0
  }
  let updateUser = JSON.parse(JSON.stringify(createUser))

  let usernameEmpty = JSON.parse(JSON.stringify(createUser))
  delete usernameEmpty.username
  let usernameNotString = JSON.parse(JSON.stringify(createUser))
  usernameNotString.username = 123
  let emailEmpty = JSON.parse(JSON.stringify(createUser))
  delete emailEmpty.email
  let emailNotEmail = JSON.parse(JSON.stringify(createUser))
  emailNotEmail.email = 'AAAAAA'
  let emailNotString = JSON.parse(JSON.stringify(createUser))
  emailNotString.email = 1123213
  let roleEmpty = JSON.parse(JSON.stringify(createUser))
  delete roleEmpty.role
  let roleNotExists = JSON.parse(JSON.stringify(createUser))
  roleNotExists.role = 99999
  let genderNotExists = JSON.parse(JSON.stringify(createUser))
  genderNotExists.gender = 99999
  let entityEmpty = JSON.parse(JSON.stringify(createUser))
  delete entityEmpty.entity_id
  let entityNotExists = JSON.parse(JSON.stringify(createUser))
  entityNotExists.entity_id = 99999
  let villageNotExists = JSON.parse(JSON.stringify(createUser))
  villageNotExists.village_id = 9999
  let timezoneNotExists = JSON.parse(JSON.stringify(createUser))
  timezoneNotExists.timezone_id = 9999
  let mobilePhoneNotInt = JSON.parse(JSON.stringify(createUser))
  mobilePhoneNotInt.mobile_phone = 'ABCDEF'
  let dateNotDate = JSON.parse(JSON.stringify(createUser))
  dateNotDate.date_of_birth = 'NOT DATE STRING'
  let passwordEmpty = JSON.parse(JSON.stringify(createUser))
  delete passwordEmpty.passwod

  const invalidSchema = {
    'username empty': usernameEmpty,
    'username not string': usernameNotString,
    'email empty': emailEmpty,
    'email not email format': emailNotEmail,
    'email not string': emailNotString,
    'role empty': roleEmpty,
    'role not exist': roleNotExists,
    'gender not exist': genderNotExists,
    'entity empty': entityEmpty,
    'entity not exist': entityNotExists,
    'villave not exist': villageNotExists,
    'timezone not exist': timezoneNotExists,
    'mobile_phone not int': mobilePhoneNotInt,
    'date not date format': dateNotDate,
    'password empty': passwordEmpty
  }
  describe('POST /users', () => {
    for (const key in invalidSchema) {
      it(key+' validate', (done) => {
        chai.request(app)
          .post('/user')
          .set('Authorization', authToken)
          .send([invalidSchema[key]])
          .end((err, res) => {
            res.should.have.status(422)
            expect(res.body).to.have.deep.property('message')
            done()
          })
      })
    }

    it('Create user complete', (done) => {
      chai.request(app)
        .post('/user')
        .set('Authorization', authToken)
        .send(createUser)
        .end((err, res) => {
          res.should.have.status(201)
          res.body.should.have.a('object')
          expect(res.body).to.have.property('id')
          userID = res.body.id
          delete createUser.password
          delete createUser.date_of_birth
          delete createUser.address
          expect(res.body).to.deep.include(createUser)
          done()
        })
    })
  })

  describe('GET /user', () => {
    it('Get user complete', (done) => {
      chai.request(app)
        .get('/user/'+userID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          expect(res.body).to.deep.include(createUser)
          done()
        })
    })
  })

  describe('PUT /user', () => {
    it('Update user Email Exists', (done) => {
      chai.request(app)
        .put('/user/ID')
        .set('Authorization', authToken)
        .send(updateUser)
        .end((err, res) => {
          res.should.have.status(422)
          done()
        })
    })
    it('Update user ID NULL', (done) => {
      chai.request(app)
        .put('/user')
        .set('Authorization', authToken)
        .send(updateUser)
        .end((err, res) => {
          res.should.have.status(404)
          done()
        })
    })

    it('Update user ID INVALID', (done) => {
      chai.request(app)
        .put('/user/ID')
        .set('Authorization', authToken)
        .send(updateUser)
        .end((err, res) => {
          res.should.have.status(422)
          done()
        })
    })

    updateUser.username = updateUser.username+'_update'
    updateUser.email = 'update_'+updateUser.email
    it('Update user complete', (done) => {
      chai.request(app)
        .put('/user/'+userID)
        .set('Authorization', authToken)
        .send(updateUser)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          delete updateUser.password
          delete updateUser.address
          delete updateUser.date_of_birth
          expect(res.body.username).to.equal(updateUser.username)
          expect(res.body).to.deep.include(updateUser)
          done()
        })
    })
  })

  let queryFilter = [
    {keyword: 'unittest'},
    {role: 1},
    {start_date: '2020-01-01'},
    {end_date: '2020-12-12'},
    {mobile_phone: '08129090090'},
    {last_login: '2020-12-12'},
    {fullname: 'unittest'},
  ]
  describe('GET /users', () => {
    queryFilter.forEach(query => {
      it('Get /users by ' + JSON.stringify(query) + ' complete', (done) => {
        chai.request(app)
          .get('/users')
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

  describe('DELETE /user', () => {
    it('Delete user complete', (done) => {
      chai.request(app)
        .delete('/user/'+userID)
        .set('Authorization', authToken)
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.have.a('object')
          done()
        })
    })
  })
})
