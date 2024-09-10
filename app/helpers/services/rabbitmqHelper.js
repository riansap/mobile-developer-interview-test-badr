import amqp from 'amqplib/callback_api'

const amqServer = process.env.AMQP_SERVER || 'amqp://localhost'
let connection
let channel

function connect() {
  return new Promise((resolve, reject) => {
    amqp.connect(amqServer, (err, conn) => {
      if (err) {
        reject(err)
      } else {
        connection = conn
        conn.createChannel((err, ch) => {
          if (err) {
            reject(err)
          } else {
            channel = ch
            resolve()
          }
        })
      }
    })
  })
}

/**
 * Publish message to the message queueing
 * @param {string} worker Give name for the queue
 * @param {json} payload Give json payload which want to be processed
 */
export async function publishWorker(worker, payload) {
  if (!connection || !channel) {
    await connect()
  }

  channel.assertQueue(worker, { durable: true })

  channel.sendToQueue(worker, Buffer.from(JSON.stringify(payload)))
  console.log(' [x] Sent %s', worker, payload)
}

// Ensure connection is closed gracefully on process exit
process.on('exit', () => {
  if (channel) {
    channel.close(() => {
      if (connection) {
        connection.close()
      }
    })
  }
})

/**
 * Publish message to the message queueing
 * @param {string} worker Give name for the queue
 * @param {json} payload Give json payload which want to be processed
 */
// export function publishWorker(worker, payload) {
//   amqp.connect(amqServer, function(error0, connection) {
//     if (connection) {
//       connection.createChannel(function(error1, channel) {
//         if (error1) {
//           console.warn(error1)
//         }
//         if(channel) {
//           channel.assertQueue(worker, {
//             durable: true
//           })
    
//           channel.sendToQueue(worker, Buffer.from(JSON.stringify(payload)))
//           console.log(' [x] Sent %s', worker, payload)
//         }
//       })
  
//       setTimeout(function() { 
//         connection.close()
//       }, 500)
//     }
//   })
// }

/**
 * Consume message from the message queue
 * @param {string} worker Give name for the queue
 * @param {function} callback Callback function to process when the message is been received
 */

export const consumeWorker = (worker, callback) => {
  amqp.connect(amqServer, function(error0, connection) {
    if (error0) {
      throw error0
    }
    connection.createChannel(function(error1, channel) {
      if (error1) {
        throw error1
      }
      channel.assertQueue(worker, {
        durable: true
      })

      console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', worker)
      channel.prefetch(1)
      channel.consume(worker, function(msg) {
        console.log(' [x] Received %s', msg.content.toString())
        if (msg != null) {
          const message = JSON.parse(msg.content.toString())
          callback(message)
          channel.ack(msg)
        }
      }, {
        noAck: false
      })
    })
  })
}