import mysql from 'mysql2/promise'
import moment from 'moment'
import configDatabase from './config/database'

async function init() {
  let connection = null;
  try {
    const { NODE_ENV } = process.env
    const { username: user, host, password, database, port } = configDatabase[NODE_ENV]
    connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      database,
    })
    console.time('get material entity')
    const [materialEntity] = await connection.execute('select id, `min`, `max` from material_entity');
    console.timeEnd('get material entity')

    console.time('get stocks per material entity')
    for (let i = 0; i < materialEntity.length; i++) {
      const { id: material_entity_id, min, max } = materialEntity[i]
      const [stocks] = await connection.execute('select id from stocks where material_entity_id = ?', [material_entity_id]);
      if (stocks.length > 0) {
        const stockIds = stocks.map(item => item.id).toString()
        const [transactions] = await connection.execute(
          `select
                id, opening_qty, change_qty, stock_id, createdAt, transaction_type_id,
                (case when transaction_type_id = 1 then change_qty else opening_qty + change_qty end) as closing_qty
            from transactions where stock_id in (${stockIds}) 
            and deleted_at is null
            order by createdAt asc`
        );

        let prevStock = {}
        for (let j = 0; j < transactions.length; j++) {
          const {
            id: transaction_id,
            opening_qty,
            change_qty,
            closing_qty,
            stock_id,
            createdAt,
            transaction_type_id
          } = transactions[j]

          prevStock[stock_id] = closing_qty
          let currentStock = 0
          Object.keys(prevStock).forEach(key => {
            currentStock += prevStock[key]
          })
          let now = new Date()
          let [find] = await connection.execute(`
            select id from stock_intervals where transaction_id = ?
          `, [transaction_id]);

          if (find.length <= 0) {
            let statusCondition = null

            if (min === 0 && max === 0 && currentStock > 0) statusCondition = 'normal'
            else if (min > 0 && max > 0 && currentStock >= min && currentStock <= max && currentStock > 0) statusCondition = 'normal'
            else if (currentStock < min && currentStock > 0 && min > 0 && max > 0) statusCondition = 'min'
            else if (currentStock > max && currentStock > 0 && min > 0 && max > 0) statusCondition = 'max'
            else if (currentStock === 0) statusCondition = 'zero'

            let arrValue = [
              material_entity_id,
              transaction_id,
              opening_qty,
              change_qty,
              closing_qty,
              currentStock,
              createdAt,
              now,
              now,
              min,
              max,
              statusCondition
            ]
            await connection.execute(`
            insert into stock_intervals (
              material_entity_id, 
              transaction_id,
              opening_qty,
              change_qty,
              closing_qty,
              current_stock,
              date,
              created_at,
              updated_at,
              min,
              max,
              status_condition
            )
            values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, arrValue)
          }
        }
      }
      console.log(material_entity_id, '==== material_entity_id ====')
    }

    console.timeEnd('get stocks per material entity')
  } catch (err) {
    console.error(err);
  }

  if (connection) connection.close()
  process.exit();
}

init()