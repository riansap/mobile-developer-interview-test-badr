import cron from 'node-cron'
import { recapEntityNotification } from '../controllers/jobController'
import { expiredNotification } from '../controllers/batchController'
import { createEdStockNotif, createGreatLessStockNotif, createNotifBatchPerEntity, createNotifRabiesVaccine, createOrderNotifNotReceive } from '../controllers/cronNotificationController'
import { createBiofarmaSMDVOrders } from '../controllers/biofarmaOrderController'
import {changeBatchInactiveToActive, changeBatchToNotActive} from '../controllers/cronBatchController'

export const runCronBiofarmaMSDV = ()=>{
  const cronTime = '0 7 * * *'
  console.log('runCronBiofarmaMSDV')
  cron.schedule(cronTime, async()=>{
    console.log('cron run everyday at 7am (GMT +0)')
    try{
      const result = await createBiofarmaSMDVOrders()
      if(result) console.log('Result cron BiofarmaMSDV : ', result.message)
      else console.error('Failed to insert data Biofarma MSDV')
    }catch(err){
      console.error(err, '==== ERROR CRON BIOFARMA MSDV ====')
    }
  } , {})
}

export const runCronNotifExpiredBatch = () => {
  const cronTime = '0 * * * *'
  console.log('runCronNotifExpiredBatch')
  cron.schedule(cronTime,async () => {
    console.log('cron every hours ====')
    try {
      await expiredNotification()
    } catch (err) {
      console.error(err, '==== ERROR CRON ====')
    }
  }, {})
}

export const runCronNotifRecap = () => {
  console.log('runCronNotifRecap')
  cron.schedule('0 10 * * *',async () => {
    console.log('cron every at 1 ====')
    try {
      await recapEntityNotification()
    } catch (err) {
      console.error(err, '==== ERROR CRON ====')
    }
  }, {})
}

export const runCronNotifEveryday = ()=>{
  console.log('runCronNotifEveryday')
  cron.schedule('0 1 * * *',async () => {
    console.log('cron every at 1 ====')
    try {
      await createGreatLessStockNotif()
      await createEdStockNotif()
      await createOrderNotifNotReceive()
      await createNotifRabiesVaccine()

      // create batch notif per entity
      // await createNotifBatchPerEntity()
    } catch (err) {
      console.error(err, '==== ERROR CRON ====')
    }
  }, {})
}


export const runCronInActiveBatch = ()=>{
  const cronTime = '0 7 * * *'
  console.log('runCronInActiveBatch')
  cron.schedule(cronTime, async()=>{
    console.log('cron run everyday at 7am (GMT +0)')
    try{
      const result1 = await changeBatchToNotActive()
      const result2 = await changeBatchInactiveToActive()

      if(result1) console.log('Result cron Non Active Batch : ', result1.message)
      else console.error('Failed to update batch to non active')

      if(result2) console.log('Result cron Update Non Active to Active : ', result2.message)
      else console.err('Failed to update batch non active to active')
    }catch(err){
      console.error(err, '==== ERROR CRON INACTIVE BATCH ====')
    }
  } , {})
}

// export const runBiofarmaOrder = () => {
//   console.log('runBiofarmaOrder')
//   cron.schedule('*/30 * * * *', async() => {
//     try {
//       await checkBiofarmaOrder()
//     } catch (err) {
//       console.error(err, '==== ERROR BIOFARMA ====')
//     }
//   })
// }