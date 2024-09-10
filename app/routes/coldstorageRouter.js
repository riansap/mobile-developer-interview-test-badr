import express from 'express'
import * as coldstorageController from '../controllers/coldstorageController'
import * as coldstorageAnnualPlanController from '../controllers/coldstorageAnnualPlanController'
import {hasRole} from '../middlewares/authMiddleware'

const coldstorageRouter = express.Router()

//get coldstorage data based on entity
coldstorageRouter.get('/entity/:id', 
  hasRole(['SUPERADMIN', 'ADMIN', 'MANAGER', 'OPERATOR']), coldstorageController.detail)

coldstorageRouter.get('/annual-planning/:entity_id/:year', coldstorageAnnualPlanController.detail)
coldstorageRouter.get('/annual-planning/:entity_id/:year/xls', coldstorageAnnualPlanController.detail)

coldstorageRouter.get('/:id', coldstorageController.detail)
coldstorageRouter.get('/:id/xls', coldstorageController.detail)



coldstorageRouter.post('/transaction', coldstorageController.updateFromTransaction)
coldstorageRouter.post('/process-stuck-data', coldstorageController.processPreviousData)

coldstorageRouter.post('/annual-planning', coldstorageAnnualPlanController.generateAnnualPlanningByUrl)


export default coldstorageRouter
