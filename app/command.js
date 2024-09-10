const { checkBiofarmaOrder, checkDeleteBiofarma } = require('./controllers/biofarmaOrderController')
const { expiredNotification } = require('./controllers/batchController')
const { recapEntityNotification } = require('./controllers/jobController')
const { cronBPOMHourly, sendTransactionBPOM } = require('./controllers/bpom/bpomController')
const { adjustStock, adjustStockPerEntity } = require('./controllers/v2/stock/adjustStockActivity')

const { createDinOrder } = require('./controllers/dinOrderController')
const { generateYearlyPlanMinMax } = require('./controllers/v2/yearlyPlan/yearlyMinMaxController')

const { createGreatLessStockNotif, createEdStockNotif, createOrderNotifNotReceive, createNotifRabiesVaccine } = require('./controllers/cronNotificationController')

const { createBiofarmaSMDVOrders } = require('./controllers/biofarmaOrderController')
const { startCronOrderItemsKfa } = require('./controllers/cronOrderItemsKfaController')
const { startFillingEntityMaterialTemplateStock } = require('./helpers/scirpts/entityMaterialStockTemplateScript')

module.exports = {
  checkBiofarmaOrder,
  expiredNotification,
  recapEntityNotification,
  checkDeleteBiofarma,
  cronBPOMHourly,
  sendTransactionBPOM,
  adjustStock,
  adjustStockPerEntity,
  createDinOrder,
  generateYearlyPlanMinMax,
  createGreatLessStockNotif,
  createBiofarmaSMDVOrders,
  createEdStockNotif,
  createOrderNotifNotReceive,
  createNotifRabiesVaccine,
  startCronOrderItemsKfa,
  startFillingEntityMaterialTemplateStock
}

require('make-runnable')
