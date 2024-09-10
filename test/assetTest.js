// import chai, { expect } from 'chai'
// import chaiHttp from 'chai-http'
// import app from '../app/app'
// import { vendorID } from './config'
// import { getUser, seederAssetType } from './seeder'
// import { USER_ROLE } from '../app/helpers/constants'

// chai.use(chaiHttp)
// chai.should()

// let authToken = null
// let assetType = {}
// let createAsset = {
//   'serial_number': 'XXAA',
//   'production_year': '2020',
//   'entity_id': vendorID,
//   'owners_id': 1,
//   'maintainers_id': 1,
//   'status': 1
// }
// let updateAsset = JSON.parse(JSON.stringify(createAsset))
// updateAsset.serial_number = updateAsset.serial_number + '_update'
// before(function(done){
//   getUser.findByRoleEntity(USER_ROLE.OPERATOR, vendorID).then(({token, user}) => {
//     authToken = 'Bearer '+token
//     createAsset.owners_id = user.id
//     createAsset.maintainers_id = user.id
//     updateAsset.owners_id = user.id
//     updateAsset.maintainers_id = user.id
//     seederAssetType.findByID(1).then(({data}) => { 
//       assetType = data
//       done()
//     })
//   })
// })

// let assetProp = [
//   'id',
//   'serial_number',
//   'production_year',
//   'asset_type_id',
//   'entity_id',
//   'owners_id',
//   'maintainers_id',
//   'status',
//   'created_by',
//   'updated_by',
//   'deleted_by',
//   'owner',
//   'maintainer',
//   'entity',
//   'asset_type'
// ]

// let nestedAssetProp = [
// ]

// describe('Asset', () => {
//   let assetID = 0
//   describe('POST /asset', () => {
//     it('Create Asset complete', (done) => {
//       chai.request(app)
//         .post('/asset')
//         .set('Authorization', authToken)
//         .send(createAsset)
//         .end((err, res) => {
//           res.should.have.status(201)
//           res.body.should.have.a('object')
//           expect(res.body).to.have.property('id')
//           assetID = res.body.id
//           done()
//         })
//     })

//     it('Find created Asset', (done) => {
//       chai.request(app)
//         .get('/assets')
//         .query({keyword: createAsset.serial_number}) 
//         .set('Authorization', authToken)
//         .end((err, res) => {
//           res.should.have.status(200)
//           res.body.should.have.a('object')
//           expect(res.body.list[0].serial_number).to.equal(createAsset.serial_number)
//           done()
//         })
//     })
//   })

//   describe('GET /asset', () => {
//     it('Get Asset complete', (done) => {
//       chai.request(app)
//         .get('/asset/'+assetID)
//         .set('Authorization', authToken)
//         .end((err, res) => {
//           res.should.have.status(200)
//           res.body.should.have.a('object')
//           done()
//         })
//     })
//   })

//   describe('PUT /asset', () => {
//     it('Update Asset complete', (done) => {
//       chai.request(app)
//         .put('/asset/'+assetID)
//         .set('Authorization', authToken)
//         .send(updateAsset)
//         .end((err, res) => {
//           res.should.have.status(200)
//           res.body.should.have.a('object')
//           expect(res.body.serial_number).to.equal(updateAsset.serial_number)
//           done()
//         })
//     })
//   })

//   describe('GET /assets', () => {
//     it('Get assets complete', (done) => {
//       chai.request(app)
//         .get('/assets')
//         .set('Authorization', authToken)
//         .end((err, res) => {
//           res.should.have.status(200)
//           res.body.should.have.a('object')
//           assetProp.forEach(element => {
//             expect(res.body.list[0]).to.have.deep.property(element)
//           })
//           nestedAssetProp.forEach(element => {
//             expect(res.body.list[0]).to.have.deep.nested.property(element)
//           })
//           done()
//         })
//     })

//     it('Get assets by entity complete', (done) => {
//       chai.request(app)
//         .get('/assets')
//         .query({entity_id: vendorID})
//         .set('Authorization', authToken)
//         .end((err, res) => {
//           res.should.have.status(200)
//           res.body.should.have.a('object')
//           done()
//         })
//     })
//   })

//   describe('DELETE /asset', () => {
//     it('Delete Asset complete', (done) => {
//       chai.request(app)
//         .delete('/asset/'+assetID)
//         .set('Authorization', authToken)
//         .end((err, res) => {
//           res.should.have.status(200)
//           res.body.should.have.a('object')
//           done()
//         })
//     })

//     it('Find deleted Asset', (done) => {
//       chai.request(app)
//         .get('/assets')
//         .query({keyword: updateAsset.serial_number}) 
//         .set('Authorization', authToken)
//         .end((err, res) => {
//           res.should.have.status(204)
//           done()
//         })
//     })
//   })
// })
