import models from './app/models'

const { Transaction } = models

let interval = 1
async function intervalConnection() {
  await Transaction.findOne()
  console.log(`interval ${interval}`)
  interval++
}

setInterval(intervalConnection, 60000)
