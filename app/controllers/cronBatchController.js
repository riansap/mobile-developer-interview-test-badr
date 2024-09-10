import { QueryTypes } from 'sequelize'
import models from '../models'
import _ from 'lodash'


async function getBatchZeroStock() {
    const docs = await models.sequelize.query(`
    select s.batch_id , sum(s.qty) as total, count(b.stock_id) as not_receive FROM stocks s LEFT JOIN  (SELECT os.stock_id as stock_id, o.id as order_id 
        FROM order_stocks os , order_items oi , orders o 
        WHERE os.order_item_id = oi.id AND oi.order_id  = o.id AND o.type in (1,2,3)) b ON b.stock_id = s.id 
        JOIN batches bc ON bc.id = s.batch_id WHERE bc.status = 1
        GROUP BY s.batch_id 
        HAVING total <=0 AND not_receive = 0
    `, {
        type: QueryTypes.SELECT
    })

    return _.keys(_.groupBy(docs, 'batch_id'))
}

async function getBatchIdsToActivated() {
    const docs = await models.sequelize.query(`
    select s.batch_id , sum(s.qty) as total, count(b.stock_id) as not_receive FROM stocks s LEFT JOIN  (SELECT os.stock_id as stock_id, o.id as order_id 
        FROM order_stocks os , order_items oi , orders o 
        WHERE os.order_item_id = oi.id AND oi.order_id  = o.id AND o.type in (1,2,3)) b ON b.stock_id = s.id 
        JOIN batches bc ON bc.id = s.batch_id WHERE bc.status = 0
        GROUP BY s.batch_id 
        HAVING total > 0 OR not_receive > 0
    `, {
        type: QueryTypes.SELECT
    })

    return _.keys(_.groupBy(docs, 'batch_id'))
}

export async function changeBatchToNotActive() {
    const t = await models.sequelize.transaction()
    try {
        let batchIds = await getBatchZeroStock()

        await models.Batch.update({ status: 0 }, {
            where: { id: batchIds }
        }, { transaction: t })

        await t.commit()

        return {
            message: batchIds.length + ' batches updated to not active',
            batch_ids: batchIds
        }
    } catch (err) {
        await t.rollback()
        console.err(err)
        return err
    }
}

export async function changeBatchInactiveToActive(){
    const t = await models.sequelize.transaction()
    try {
        let batchIds = await getBatchIdsToActivated()

        await models.Batch.update({ status: 1 }, {
            where: { id: batchIds }
        }, { transaction: t })

        await t.commit()

        return {
            message: batchIds.length + ' batches updated back to active',
            batch_ids: batchIds
        }
    } catch (err) {
        await t.rollback()
        console.err(err)
        return err
    }
}