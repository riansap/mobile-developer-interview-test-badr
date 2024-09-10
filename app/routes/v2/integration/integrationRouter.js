import express from 'express'

import emonevRouter from './emonevRouter'

const integrationRouter = express.Router()

integrationRouter.use('/emonev', emonevRouter)

export default integrationRouter
