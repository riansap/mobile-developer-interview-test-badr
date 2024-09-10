import express from 'express'
import dashboardSatusehatController from '../../controllers/v2/dashboardSatusehatController'


const dashboardSatusehatRouter = express.Router()

/* GET opname period listing. */
/**
 * GET list opname period
 * @route GET /stock/new-opname
 * @group Opname Period - Operations about Opname Period
 * @returns {object} 200 - {}
 * @returns {Error}  default - Unexpected error
 * @security [{"JWT":[]}]
 */
dashboardSatusehatRouter.get('/', dashboardSatusehatController.list)
dashboardSatusehatRouter.get('/:uuid', dashboardSatusehatController.detail)

export default dashboardSatusehatRouter
