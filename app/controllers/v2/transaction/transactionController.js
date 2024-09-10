import models from '../../../models'
// import { publishWorker } from '../../helpers/services/rabbitmqHelper'
// import { formatUpdateTransactionPayload } from '../../helpers/integrations/covidIntegrationHelper'
import { generateMaterialNotification } from '../../../helpers/notifications/notificationService'
import {
  TRANSACTION_TYPE, DEVICE_TYPE, USER_ROLE, isTrxUseOpenVial, ENTITY_TYPE,
} from '../../../helpers/constants'
import { publishWorker } from '../../../helpers/services/rabbitmqHelper'
import axios from 'axios'
import e from 'express'
import moment from 'moment'
import { Op, QueryTypes } from 'sequelize'
import { createColdStorage } from '../../coldstorageController'
import { doEncrypt } from '../../../helpers/common'

const SMILE_URL = process.env.SMILE_URL
const sequelize = models.sequelize

async function getEntityMasterMaterial(master_material_id, entity_id) {
  return await models.EntityMasterMaterial.findOne({
    where: {
      master_material_id,
      entity_id,
    },
    include: {
      association: 'material',
    },
  })
}

async function getTransactionType(id) {
  return await models.TransactionType.findOne({
    where: { id },
  })
}

async function getOpenStock({
  transaction, entity_has_material_id, t
}) {
  let condition = null

  if (transaction.stock_id) {
    condition = { id: transaction.stock_id }
  } else {
    if (transaction.batch) {
      let batchExist = await models.Batch.findOne({
        where: { code: transaction.batch.code },
        transaction: t,
      })
      if (batchExist) {
        condition = [{ batch_id: batchExist.id }, { entity_has_material_id }, { activity_id: transaction.activity_id }]
      }
    }
  }

  if (condition === null) return null
  return await models.Stock.findOne({
    where: condition,
    lock: true,
    transaction: t,
  })
}

function setNegative(qty) {
  return -Math.abs(qty)
}

function getChangeQty({ transactionType, changeQty, currentQty = 0 }) {
  const changeVal = transactionType.can_remove ? setNegative(changeQty) : changeQty
  const newVal = transactionType.can_restock ? changeQty : currentQty + changeVal

  return {
    new: newVal,
    change: changeVal,
  }
}


async function createPatient(transaction_patient, t) {
  const { patient_id, transaction_type_id, identity_type, vaccine_sequence, transaction_date, entityID } = transaction_patient
  const nik = doEncrypt(patient_id)
  let patient = await models.Patient.findOne({ where: { nik } })
  if (!patient) {
    const newDataPatient = {
      nik: nik,
      vaccine_sequence: null,
      last_vaccine_at: null,
      entity_id: entityID,
      identity_type,
      preexposure_sequence: null,
      last_preexposure_at: null
    }
    if (vaccine_sequence >= 1 && vaccine_sequence <= 5) {
      newDataPatient.vaccine_sequence = vaccine_sequence
      newDataPatient.last_vaccine_at = transaction_date
    } else {
      newDataPatient.preexposure_sequence = vaccine_sequence
      newDataPatient.last_preexposure_at = transaction_date
    }
    patient = await models.Patient.create(newDataPatient, { transaction: t })

  } else {
    if (vaccine_sequence) {
      let patientData = {}
      if (vaccine_sequence >= 1 && vaccine_sequence <= 5) {
        patientData = {
          vaccine_sequence,
          last_vaccine_at: transaction_date,
          entity_id: entityID
        }
      } else {
        patientData = {
          preexposure_sequence: vaccine_sequence,
          last_preexposure_at: transaction_date
        }
      }
      await patient.update(patientData, { transaction: t })

    }
  }

  return patient
}

async function handleTransactionPatientReturn(transaction_id, transaction_patient, t) {
  const { patient_id, vaccine_sequence, transaction_date } = transaction_patient
  const nik = doEncrypt(patient_id)
  let patient = await models.Patient.findOne({ where: { nik } })
  const transactionPatient = await models.TransactionPatient.findOne({ where: { patient_id: patient?.id, vaccine_sequence } })
  const transactionPatients = await models.TransactionPatient.findAll({ where: { transaction_id: transactionPatient?.transaction_id } })
  const transactionPatientData = []
  for (let item of transactionPatients) {
    transactionPatientData.push({
      transaction_id,
      patient_id: item.patient_id,
      vaccine_sequence: item.vaccine_sequence,
      transaction_type_id: TRANSACTION_TYPE.RETURN,
      transaction_date
    })

    const prevTransaction = await models.TransactionPatient.findOne({
      where: { patient_id: item.patient_id, vaccine_sequence: vaccine_sequence - 1 }
    })
    let last_vaccine_at = null
    let entity_id = null
    if (prevTransaction) {
      last_vaccine_at = prevTransaction.transaction_date
      entity_id = prevTransaction.entity_id
    }
    if (vaccine_sequence >= 1 && vaccine_sequence <= 5)
      await patient.update({ vaccine_sequence: vaccine_sequence - 1 ?? null, last_vaccine_at, entity_id }, { transaction: t })
    else
      await patient.update({
        preexposure_sequence: vaccine_sequence === 6 ? null : 6,
        last_preexposure_at: vaccine_sequence === 6 ? null : last_vaccine_at
      }, { transaction: t })

  }

  await models.TransactionPatient.bulkCreate(transactionPatientData, {
    ignoreDuplicates: true,
    transaction: t
  })
}

async function handleTransactionPatient(transaction_id, transaction, entityID, transaction_patients, t) {
  if (transaction.transaction_type_id === TRANSACTION_TYPE.RETURN && transaction_patients.length > 0) {
    await handleTransactionPatientReturn(transaction_id, transaction_patients[0], t)
  } else {
    const transactionPatientOthers = []
    for (let transPatient of transaction_patients) {
      let patient = await createPatient({ ...transPatient, entityID }, t)
      transPatient.transaction_id = transaction_id
      transPatient.patient_id = patient?.id

      const { other_sequences = [] } = transPatient
      for (let otherSeq of other_sequences) {
        transactionPatientOthers.push({
          ...transaction,
          change_qty: 0,
          actual_transaction_date: otherSeq.date,
          transaction_patients: [{
            ...transPatient,
            vaccine_sequence: otherSeq.sequence,
            transaction_date: otherSeq.date
          }]
        })
      }

    }

    if (transactionPatientOthers.length > 0)
      await models.Transaction.bulkCreate(transactionPatientOthers, {
        include: [{
          association: 'transaction_patients'
        }],
        ignoreDuplicates: true,
        transaction: t
      })

    if (transaction_patients.length > 0)
      await models.TransactionPatient.bulkCreate(transaction_patients, {
        ignoreDuplicates: true,
        transaction: t
      })
  }
}

export async function submit(req, res, next) {
  try {
    let { entityID, user, body: transactions } = req
    const deviceID = req.headers['device-type']
    // const transactionCovid = []
    const notifMaterialEntities = []

    for (let index = 0; index < transactions.length; index++) {
      const transaction = transactions[index]
      let {
        material_id,
        transaction_type_id,
        activity_id,
        year = null,
        price = null,
        total_price = null,
        transaction_patients = []
      } = transaction
      if (user.role === USER_ROLE.SUPERADMIN || user.role === USER_ROLE.ADMIN || user.role === USER_ROLE.ASIK) {
        entityID = transaction.entity_id
      }


      /* check material condition if add or remove stock */
      if (transaction_type_id == TRANSACTION_TYPE.ADD_STOCK || transaction_type_id == TRANSACTION_TYPE.REMOVE_STOCK) {
        const checkRoles = await models.MasterMaterialCondition.findAll({
          where: {
            master_material_id: material_id,
            type: 7
          }
        })

        if (checkRoles) {
          /* get conditions by roles*/
          const selected1 = checkRoles.filter(it => it.value == user.role && it.key == 'roles')

          /* get conditions by entity_type */
          const selected2 = checkRoles.filter(it => (it.value == ENTITY_TYPE.PROVINSI || it.value == ENTITY_TYPE.KOTA) && it.key == 'entity_types')
          if (selected1.length <= 0 && selected2.length <= 0) {
            throw {
              status: 403,
              message: req.__('material_forbidden')
            }
          }
        }
      }

      const isOpenVial = await models.MasterMaterial.count({ where: [{ id: material_id }, { is_openvial: 1 }] })
      const materialEntity = await getEntityMasterMaterial(material_id, entityID)
      const transactionType = await getTransactionType(transaction_type_id)
      let isUseOpenVial = isTrxUseOpenVial(transaction_type_id, isOpenVial ? true : false)
      const materialEntityActivity = await models.EntityMasterMaterialActivities.findOne({
        attributes: ['id', 'stock_on_hand'],
        where: {
          entity_master_material_id: materialEntity.id,
          activity_id: activity_id
        }
      })

      // Begin input
      let oldBatch = null
      if (transaction.batch) {
        oldBatch = await models.Batch.findOne({ where: { code: transaction.batch.code } })
      }
      let entity = await models.Entity.findOne({ where: { id: entityID } })
      let activityBian = await models.MasterActivity.findOne({ where: { name: { [models.Sequelize.Op.like]: '%BIAN%' } } })

      const t = await models.sequelize.transaction()

      // find stock & lock
      let openingStock = 0
      let stock = await getOpenStock({
        transaction, entity_has_material_id: materialEntity.id, t
      })

      if (isUseOpenVial) {
        transaction.change_qty = transaction.close_vial
        transaction.broken_qty = transaction.broken_close_vial
      }
      const { new: newQty, change: changeQty } = getChangeQty({
        transactionType,
        changeQty: transaction.change_qty,
        currentQty: stock?.qty || 0,
      })

      const { new: newOpenVial, change: changeOpenVial } = getChangeQty({
        transactionType,
        changeQty: transaction.open_vial,
        currentQty: stock?.open_vial || 0,
      })

      let { new: newCloseVial, change: changeCloseVial } = getChangeQty({
        transactionType,
        changeQty: transaction.close_vial,
        currentQty: stock?.close_vial || 0,
      })

      const stockField = {
        qty: newQty,
        status: transaction.status_id,
        updated_by: user.id,
      }

      const transactionReason = await models.TransactionReason.findOne({
        where: { id: transaction.transaction_reason_id, is_purchase: 1 },
        transaction: t,
      })

      if (transaction.transaction_type_id === TRANSACTION_TYPE.ADD_STOCK && transactionReason && (price && total_price) && year && transaction.source_material_id) {
        stockField.price = price
        stockField.total_price = total_price
        stockField.year = year
        stockField.budget_source = transaction.source_material_id
      }

      let createdBy = user.id, updatedBy = user.id
      if (transaction.ayosehat_id) {
        const sehat = await models.IntegrationAyoSehat.findByPk(transaction.ayosehat_id, { transaction: t })
        createdBy = sehat.created_by, updatedBy = sehat.created_by
      }

      if (transaction.transaction_type_id === TRANSACTION_TYPE.DISCARDS || transaction.transaction_type_id === TRANSACTION_TYPE.RETURN) {
        let payload = {
          stock_id: stock.id,
          transaction_reason_id: transaction.transaction_reason_id
        }
        let stockExtermination = await models.StockExtermination.findOne({
          where: { ...payload }
        }, { transaction: t })

        let discardQty = transaction.transaction_type_id === TRANSACTION_TYPE.DISCARDS ? transaction.change_qty : transaction.broken_qty
        if (!stockExtermination) {
          payload = {
            ...payload,
            extermination_discard_qty: discardQty > 0 ? discardQty : 0,
            created_by: user.id,
            updated_by: user.id
          }
          await models.StockExtermination.create(payload, { transaction: t })
        } else {
          stockExtermination.extermination_discard_qty += discardQty
          await stockExtermination.save({ transaction: t, logging: true })
        }
      }


      let transactionDiscardId = []

      // Cancel discards
      if (transaction.transaction_type_id === TRANSACTION_TYPE.CANCEL_DISCARD) {
        for (let idx = 0; idx < transaction.transaction_id.length; idx++) {
          let transaction_id = transaction.transaction_id[idx]
          transactionDiscardId.push(transaction_id)

          const transactionDiscard = await models.Transaction.findByPk(transaction_id, { transaction: t })

          let payload = {
            stock_id: stock.id,
            transaction_reason_id: transactionDiscard.transaction_reason_id
          }
          let stockExtermination = await models.StockExtermination.findOne({
            where: { ...payload }
          }, { transaction: t })


          stockExtermination.extermination_discard_qty -= transactionDiscard.change_qty
          await stockExtermination.save({ transaction: t, logging: true })
        }

        delete transaction.transaction_id
      }

      if (isUseOpenVial) {
        stockField.open_vial = newOpenVial
      }

      try {
        let batch = null
        // update stock
        if (stock) {
          if (transactionType.can_remove && transaction.change_qty > stock.qty) {
            throw {
              status: 422,
              message: (req.__('validator.lesser_or_equal', {
                field1: `${req.__('field.transaction.change_qty')} (${transaction.change_qty})`,
                field2: `${req.__('field.stock.qty')} (${stock.qty || 0})`,
              })),
            }
          }
          // Update Stock by transaction type
          openingStock = stock.qty
          await stock.update(stockField, { transaction: t })
        } else {
          // Stock not found, create a new one
          // Stock in same batch as previous data
          if (transaction.batch && transaction.is_batches) {
            if (!oldBatch) {
              batch = await models.Batch.create(transaction.batch, { transaction: t })
            } else {
              batch = oldBatch
            }
          }
          stockField.batch_id = batch ? batch.id : null
          stockField.created_by = createdBy
          stockField.entity_has_material_id = materialEntity.id
          stockField.activity_id = transaction.activity_id

          stock = await models.Stock.create(stockField, { transaction: t })
        }

        // create transaction
        transaction.master_material_id = transaction.material_id
        transaction.stock_id = stock.id
        transaction.entity_id = entityID
        transaction.opening_qty = openingStock
        transaction.device_type = DEVICE_TYPE[deviceID]
        transaction.created_by = createdBy
        transaction.updated_by = updatedBy
        transaction.change_qty = changeQty
        transaction.status = transaction.status_id
        // set actual transaction date null if transaction type is not issues or return
        if (transaction.transaction_type_id !== TRANSACTION_TYPE.ISSUES && transaction.transaction_type_id !== TRANSACTION_TYPE.RETURN) {
          transaction.actual_transaction_date = null
        }
        /* set transaction_purchase */
        let transaction_purchase = {}
        if (transaction.transaction_type_id === TRANSACTION_TYPE.ADD_STOCK) {
          transaction_purchase = {
            transaction_id: null,
            source_material_id: transaction.source_material_id,
            year: transaction.year,
            price: transaction.price,
            pieces_purchase_id: transaction.pieces_purchase_id,
          }

          if (transaction.price) transaction_purchase.total_price = transaction.price * transaction.change_qty
        }

        delete transaction.source_material_id
        delete transaction.year
        delete transaction.price
        delete transaction.pieces_purchase
        delete transaction.identity_type
        /* end set transaction_purchase */

        delete transaction.material_id
        if (isUseOpenVial) {
          transaction.open_vial = changeOpenVial
          transaction.close_vial = changeQty
        }
        if (transaction.transaction_type_id === TRANSACTION_TYPE.RETURN) {
          transaction.transaction_broken_reason = transaction.transaction_reason_id
          transaction.transaction_reason_id = null
        }

        const result = await models.Transaction.create(transaction, { transaction: t })

        /* insert to transaction patients */
        await handleTransactionPatient(result?.id, transaction, entityID, transaction_patients, t)

        if (transaction.transaction_type_id === TRANSACTION_TYPE.CANCEL_DISCARD) {

          for (let transDiscID of transactionDiscardId) {
            const cancelDiscardData = {
              transaction_discard_id: transDiscID,
              transaction_cancel_discard_id: result.id
            }
            await models.MappingCancelDiscard.create(cancelDiscardData, { transaction: t })
          }
        }

        if (transaction_purchase.source_material_id || transaction_purchase.year || transaction_purchase.price || transaction_purchase.pieces_purchase_id) {
          transaction_purchase.transaction_id = result.id

          await models.TransactionPurchase.create(transaction_purchase, { transaction: t })
        }


        if (transaction.transaction_type_id === TRANSACTION_TYPE.ISSUES && !transaction.ayosehat_id) {
          let injectionData = {}
          injectionData.dose_1 = transaction.dose_1
          injectionData.dose_2 = transaction.dose_2
          injectionData.dose_booster = transaction.booster
          injectionData.dose_routine = transaction.dose_routine
          injectionData.transaction_id = result.id
          await models.TransactionInjection.create(injectionData, { transaction: t })
        }

        if (transaction.transaction_type_id === TRANSACTION_TYPE.ISSUES && (entity.is_ayosehat && transaction.activity_id == activityBian.id) && !transaction.ayosehat_id) {
          // Create ayosehat tables
          let transactionBatch = batch || oldBatch
          sendIntegrationAyoSehat(req, { entityID, transaction, batch: transactionBatch, changeQty, changeOpenVial, changeCloseVial, stock, t, createdTransaction: result })
        }

        // if (transaction.transaction_type_id === TRANSACTION_TYPE.ISSUES
        // || transaction.transaction_type_id === TRANSACTION_TYPE.DISCARDS) {
        //   transactionCovid.push({
        //     id: result.id,
        //     entity_id: req.entityID,
        //     ...transaction,
        //   })
        // }

        if (transaction.transaction_type_id === TRANSACTION_TYPE.RETURN && (transaction.broken_qty || transaction.broken_open_vial)) {
          // create broken qty transaction.broken_qty
          // remove stock by broken
          const finalQty = newQty - transaction.broken_qty
          const stockBroken = {
            qty: finalQty,
            updated_by: req.user.id,
          }
          if (isUseOpenVial) {
            stockBroken.open_vial = newOpenVial - transaction.broken_open_vial
          }
          await stock.update(stockBroken, { transaction: t })
          const transactionBroken = {
            ...transaction,
            opening_qty: newQty,
            change_qty: transaction.broken_qty ? -Math.abs(transaction.broken_qty) : 0,
            open_vial: transaction.broken_open_vial ? -Math.abs(transaction.broken_open_vial) : 0,
            close_vial: transaction.broken_qty ? -Math.abs(transaction.broken_qty) : 0,
            transaction_type_id: TRANSACTION_TYPE.DISCARDS,
            transaction_reason_id: transaction.transaction_broken_reason,
          }
          const resId = await models.Transaction.create(transactionBroken, { transaction: t })

          // transactionCovid.push({
          //   id: resId.id,
          //   entity_id: req.entityID,
          //   ...transactionBroken,
          // })
        }

        if (transaction.ayosehat_id) {
          updateAyoSehat(transaction.ayosehat_id, result, t)
        }

        models.ColdstorageTransactionLog.create({ entity_id: entityID, master_material_id: material_id, status: 0 })

        if (materialEntityActivity)
          notifMaterialEntities.push({ id: materialEntity.id, oldStock: materialEntityActivity.stock_on_hand, activityId: activity_id })


        createColdStorage(entityID, material_id, req)

        await t.commit()
      } catch (error) {
        await t.rollback()
        throw error
      }
    }

    // get users from entity
    const dataUsers = await models.User.findAll({
      attributes: ['id'],
      where: {
        role: { [Op.in]: [USER_ROLE.ADMIN, USER_ROLE.SUPERADMIN, USER_ROLE.MANAGER, USER_ROLE.OPERATOR] },
        entity_id: entityID
      }
    })

    let userIds = []

    for (let userId of dataUsers) {
      userIds.push(userId.id)
    }

    if (notifMaterialEntities.length > 0) {
      await generateMaterialNotification(req.timezone, [user.id], notifMaterialEntities)
    }
    // send data to kpcpen
    // const payloadUpdate = await formatUpdateTransactionPayload(transactionCovid)
    // if (payloadUpdate.length && req.user.role === USER_ROLE.OPERATOR_COVID) {
    //   payloadUpdate.forEach((payload) => {
    //     console.log(JSON.stringify(payloadUpdate))
    //     publishWorker('covid-api-update', payload)
    //   })
    // }

    return res.status(200).json({ message: req.__('201') + (req.warningMessage ? '. ' + req.warningMessage : '') })
  } catch (err) {
    console.log(err)
    return next(err)
  }
}

export function submitDummy(req, res, next) {
  try {
    return res.status(200).json({ message: 'MASUK DUMMY' })
  } catch (error) {
    next(error)
  }
}

async function sendIntegrationAyoSehat(req, transactionData) {
  transactionData.changeCloseVial = !transactionData.changeCloseVial && !transactionData.changeOpenVial ? transactionData.changeQty : transactionData.changeCloseVial
  let data = {
    vendor_id: transactionData.entityID,
    customer_id: transactionData.transaction.customer_id,
    activity_id: transactionData.transaction.activity_id,
    material_id: transactionData.transaction.master_material_id,
    stock_id: transactionData.transaction.stock_id,
    batch_id: transactionData.batch?.id,
    status_vvm: transactionData.status_id,
    consumed_qty: transactionData.changeQty,
    consumed_qty_openvial: transactionData.changeOpenVial,
    consumed_qty_closevial: transactionData.changeCloseVial,
    integration_status: TRANSACTION_TYPE.ISSUES,
    transaction_id_consumed: transactionData.createdTransaction.id,
    created_at_consumed_smile: moment()
  }
  const url = SMILE_URL + '/integration/ayo-sehat/consumption/' + data.customer_id
  const payload = {
    url: url,
    data: data,
    headers: { timezone: 'Asia/Jakarta', Authorization: req.headers.authorization },
    method: 'POST'
  }

  try {
    await axios(payload)
    return true
  } catch (error) {
    return error.response?.data
  }
  // publishWorker('http-worker', payload)
}

export async function getTransactionsData(queryParam, is_count = false) {
  let { filter } = generateFilter(queryParam)
  const limit = Number(queryParam.paginate)
  const offset = (Number(queryParam.page) - 1) * Number(queryParam.paginate)

  let attributes = ''
  if (is_count) {
    attributes = 'count(*) as total'
  } else {
    attributes = `
      \`Transaction\`.\`id\`, 
      \`Transaction\`.\`material_id\`, 
      \`Transaction\`.\`customer_id\`, 
      \`Transaction\`.\`entity_id\`, 
      \`Transaction\`.\`vendor_id\`, 
      \`Transaction\`.\`stock_id\`, 
      \`Transaction\`.\`opening_qty\`, 
      \`Transaction\`.\`change_qty\`, 
      \`Transaction\`.\`transaction_type_id\`, 
      \`Transaction\`.\`transaction_reason_id\`, 
      \`Transaction\`.\`created_by\`, 
      \`Transaction\`.\`updated_by\`, 
      \`Transaction\`.\`device_type\`, 
      \`Transaction\`.\`createdAt\`, 
      \`Transaction\`.\`updatedAt\`, 
      \`Transaction\`.\`deleted_at\`, 
      \`Transaction\`.\`order_id\`, 
      \`Transaction\`.\`other_reason\`, 
      \`Transaction\`.\`dose_1\`, 
      \`Transaction\`.\`dose_2\`, 
      \`Transaction\`.\`booster\`, 
      \`Transaction\`.\`master_material_id\`, 
      \`Transaction\`.\`open_vial\`, 
      \`Transaction\`.\`close_vial\`, 
      \`Transaction\`.\`activity_id\`, 
      \`stock\`.\`id\` AS \`stock.id\`, 
      \`stock\`.\`entity_has_material_id\` AS \`stock.entity_has_material_id\`, 
      \`stock\`.\`batch_id\` AS \`stock.batch_id\`, 
      \`stock\`.\`status\` AS \`stock.status\`, 
      \`stock\`.\`qty\` AS \`stock.qty\`, 
      \`stock\`.\`created_by\` AS \`stock.created_by\`, 
      \`stock\`.\`updated_by\` AS \`stock.updated_by\`, 
      \`stock\`.\`updatedAt\` AS \`stock.updatedAt\`, 
      \`stock\`.\`createdAt\` AS \`stock.createdAt\`, 
      \`stock\`.\`allocated\` AS \`stock.allocated\`, 
      \`stock\`.\`activity_id\` AS \`stock.activity_id\`, 
      \`stock\`.\`open_vial\` AS \`stock.open_vial\`, 
      \`stock->batch\`.\`id\` AS \`stock.batch.id\`, 
      \`stock->batch\`.\`code\` AS \`stock.batch.code\`, 
      \`stock->batch\`.\`expired_date\` AS \`stock.batch.expired_date\`, 
      \`stock->batch\`.\`production_date\` AS \`stock.batch.production_date\`, 
      \`stock->batch\`.\`manufacture_id\` AS \`stock.batch.manufacture_id\`, 
      \`stock->batch->manufacture\`.\`id\` AS \`stock.batch.manufacture.id\`, 
      \`stock->batch->manufacture\`.\`name\` AS \`stock.batch.manufacture.name\`, 
      \`stock->batch->manufacture\`.\`address\` AS \`stock.batch.manufacture.address\`, 
      \`stock->entity_master_material\`.\`id\` AS \`stock.entity_master_material.id\`, 
      \`stock->entity_master_material\`.\`master_material_id\` AS \`stock.entity_master_material.master_material_id\`, 
      \`stock->entity_master_material\`.\`entity_id\` AS \`stock.entity_master_material.entity_id\`, 
      \`stock->entity_master_material\`.\`min\` AS \`stock.entity_master_material.min\`, 
      \`stock->entity_master_material\`.\`max\` AS \`stock.entity_master_material.max\`, 
      \`stock->entity_master_material\`.\`allocated_stock\` AS \`stock.entity_master_material.allocated_stock\`, 
      \`stock->entity_master_material\`.\`on_hand_stock\` AS \`stock.entity_master_material.on_hand_stock\`, 
      \`stock->entity_master_material\`.\`stock_last_update\` AS \`stock.entity_master_material.stock_last_update\`, 
      \`stock->entity_master_material\`.\`total_open_vial\` AS \`stock.entity_master_material.total_open_vial\`, 
      \`stock->entity_master_material\`.\`updated_at\` AS \`stock.entity_master_material.updated_at\`, 
      \`stock->activity\`.\`id\` AS \`stock.activity.id\`, 
      \`stock->activity\`.\`name\` AS \`stock.activity.name\`, 
      \`entity\`.\`id\` AS \`entity.id\`, 
      \`entity\`.\`name\` AS \`entity.name\`, 
      \`entity\`.\`address\` AS \`entity.address\`, 
      \`entity->entity_tags\`.\`id\` AS \`entity.entity_tags.id\`, 
      \`master_material\`.\`id\` AS \`master_material.id\`, 
      \`master_material\`.\`name\` AS \`master_material.name\`, 
      \`master_material\`.\`is_vaccine\` AS \`master_material.is_vaccine\`, 
      \`master_material\`.\`is_openvial\` AS \`master_material.is_openvial\`, 
      \`master_material\`.\`managed_in_batch\` AS \`master_material.managed_in_batch\`, 
      \`activity\`.\`id\` AS \`activity.id\`, 
      \`activity\`.\`name\` AS \`activity.name\`, 
      \`customer\`.\`id\` AS \`customer.id\`, 
      \`customer\`.\`name\` AS \`customer.name\`, 
      \`vendor\`.\`id\` AS \`vendor.id\`, 
      \`vendor\`.\`name\` AS \`vendor.name\`, 
      \`transaction_type\`.\`id\` AS \`transaction_type.id\`, 
      \`transaction_type\`.\`title\` AS \`transaction_type.title\`, 
      \`transaction_type\`.\`chg_type\` AS \`transaction_type.chg_type\`, 
      \`transaction_reason\`.\`id\` AS \`transaction_reason.id\`, 
      \`transaction_reason\`.\`title\` AS \`transaction_reason.title\`, 
      \`transaction_reason\`.\`is_other\` AS \`transaction_reason.is_other\`, 
      \`transaction_reason\`.\`is_purchase\` AS \`transaction_reason.is_purchase\`, 
      \`user_created\`.\`id\` AS \`user_created.id\`, 
      \`user_created\`.\`username\` AS \`user_created.username\`, 
      \`user_created\`.\`firstname\` AS \`user_created.firstname\`, 
      \`user_created\`.\`lastname\` AS \`user_created.lastname\`, 
      \`user_updated\`.\`id\` AS \`user_updated.id\`, 
      \`user_updated\`.\`username\` AS \`user_updated.username\`, 
      \`user_updated\`.\`firstname\` AS \`user_updated.firstname\`, 
      \`user_updated\`.\`lastname\` AS \`user_updated.lastname\`, 
      \`order\`.\`id\` AS \`order.id\`, 
      \`order\`.\`type\` AS \`order.type\`, 
      \`order\`.\`status\` AS \`order.status\`, 
      \`injection\`.\`id\` AS \`injection.id\`, 
      \`injection\`.\`dose_1\` AS \`injection.dose_1\`, 
      \`injection\`.\`dose_2\` AS \`injection.dose_2\`, 
      \`injection\`.\`dose_booster\` AS \`injection.dose_booster\`, 
      \`injection\`.\`dose_routine\` AS \`injection.dose_routine\`, 
      \`transaction_purchase\`.\`id\` AS \`transaction_purchase.id\`, 
      \`transaction_purchase\`.\`source_material_id\` AS \`transaction_purchase.source_material_id\`, 
      \`transaction_purchase\`.\`year\` AS \`transaction_purchase.year\`, 
      \`transaction_purchase\`.\`price\` AS \`transaction_purchase.price\`, 
      \`transaction_purchase\`.\`pieces_purchase_id\` AS \`transaction_purchase.pieces_purchase_id\`, 
      \`transaction_purchase->source_material\`.\`id\` AS \`transaction_purchase.source_material.id\`, 
      \`transaction_purchase->source_material\`.\`name\` AS \`transaction_purchase.source_material.name\`, 
      \`transaction_purchase->pieces_purchase\`.\`id\` AS \`transaction_purchase.pieces_purchase.id\`, 
      \`transaction_purchase->pieces_purchase\`.\`name\` AS \`transaction_purchase.pieces_purchase.name\``
  }

  let rawQuery = `
    SELECT 
      ${attributes}
    FROM 
    \`transactions\` AS \`Transaction\` 
    LEFT OUTER JOIN \`stocks\` AS \`stock\` ON \`Transaction\`.\`stock_id\` = \`stock\`.\`id\` 
    LEFT OUTER JOIN \`batches\` AS \`stock->batch\` ON \`stock\`.\`batch_id\` = \`stock->batch\`.\`id\` 
    AND (
      \`stock->batch\`.\`deleted_at\` IS NULL
    ) 
    LEFT OUTER JOIN \`manufactures\` AS \`stock->batch->manufacture\` ON \`stock->batch\`.\`manufacture_id\` = \`stock->batch->manufacture\`.\`id\` 
    AND (
      \`stock->batch->manufacture\`.\`deleted_at\` IS NULL
    ) 
    LEFT OUTER JOIN \`entity_has_master_materials\` AS \`stock->entity_master_material\` ON \`stock\`.\`entity_has_material_id\` = \`stock->entity_master_material\`.\`id\` 
    AND (
      \`stock->entity_master_material\`.\`deleted_at\` IS NULL
    ) 
    LEFT OUTER JOIN \`master_activities\` AS \`stock->activity\` ON \`stock\`.\`activity_id\` = \`stock->activity\`.\`id\` 
    LEFT OUTER JOIN \`smile\`.\`entities\` AS \`entity\` ON \`Transaction\`.\`entity_id\` = \`entity\`.\`id\` 
    LEFT OUTER JOIN (
      \`smile\`.\`entity_entity_tags\` AS \`entity->entity_tags->entity_entity_tags\` 
      INNER JOIN \`smile\`.\`entity_tags\` AS \`entity->entity_tags\` ON \`entity->entity_tags\`.\`id\` = \`entity->entity_tags->entity_entity_tags\`.\`entity_tag_id\`
    ) ON \`entity\`.\`id\` = \`entity->entity_tags->entity_entity_tags\`.\`entity_id\` 
    AND (
      \`entity->entity_tags\`.\`deleted_at\` IS NULL
    ) 
    INNER JOIN \`master_materials\` AS \`master_material\` ON \`Transaction\`.\`master_material_id\` = \`master_material\`.\`id\` 
    AND (
      \`master_material\`.\`deleted_at\` IS NULL
    ) 
    LEFT OUTER JOIN \`master_activities\` AS \`activity\` ON \`Transaction\`.\`activity_id\` = \`activity\`.\`id\` 
    LEFT OUTER JOIN \`smile\`.\`entities\` AS \`customer\` ON \`Transaction\`.\`customer_id\` = \`customer\`.\`id\` 
    AND (\`customer\`.\`deleted_at\` IS NULL) 
    LEFT OUTER JOIN \`smile\`.\`entities\` AS \`vendor\` ON \`Transaction\`.\`vendor_id\` = \`vendor\`.\`id\` 
    AND (\`vendor\`.\`deleted_at\` IS NULL) 
    LEFT OUTER JOIN \`transaction_types\` AS \`transaction_type\` ON \`Transaction\`.\`transaction_type_id\` = \`transaction_type\`.\`id\` 
    AND (
      \`transaction_type\`.\`deletedAt\` IS NULL
    ) 
    LEFT OUTER JOIN \`transaction_reasons\` AS \`transaction_reason\` ON \`Transaction\`.\`transaction_reason_id\` = \`transaction_reason\`.\`id\` 
    AND (
      \`transaction_reason\`.\`deletedAt\` IS NULL
    ) 
    LEFT OUTER JOIN \`smile\`.\`users\` AS \`user_created\` ON \`Transaction\`.\`created_by\` = \`user_created\`.\`id\` 
    LEFT OUTER JOIN \`smile\`.\`users\` AS \`user_updated\` ON \`Transaction\`.\`updated_by\` = \`user_updated\`.\`id\` 
    LEFT OUTER JOIN \`orders\` AS \`order\` ON \`Transaction\`.\`order_id\` = \`order\`.\`id\` 
    AND (\`order\`.\`deleted_at\` IS NULL) 
    LEFT OUTER JOIN \`transaction_injections\` AS \`injection\` ON \`Transaction\`.\`id\` = \`injection\`.\`transaction_id\` 
    LEFT OUTER JOIN \`transaction_purchase\` AS \`transaction_purchase\` ON \`Transaction\`.\`id\` = \`transaction_purchase\`.\`transaction_id\` 
    AND (
      \`transaction_purchase\`.\`deleted_at\` IS NULL
    ) 
    LEFT OUTER JOIN \`source_materials\` AS \`transaction_purchase->source_material\` ON \`transaction_purchase\`.\`source_material_id\` = \`transaction_purchase->source_material\`.\`id\` 
    LEFT OUTER JOIN \`pieces_purchase\` AS \`transaction_purchase->pieces_purchase\` ON \`transaction_purchase\`.\`pieces_purchase_id\` = \`transaction_purchase->pieces_purchase\`.\`id\` 
  WHERE 
    (
      ${queryParam.is_deleted ? '`Transaction`.`deleted_at` IS NOT NULL' : '`Transaction`.`deleted_at` IS NULL'} 
      AND (
        (
          \`Transaction\`.\`createdAt\` >= :start_date 
          AND \`Transaction\`.\`createdAt\` <= :end_date
          ${filter}
        )
      )
    ) 
  ORDER BY 
    \`Transaction\`.\`id\` DESC 
  ${is_count ? '' : `LIMIT ${offset}, ${limit}`};`

  let transactions = await sequelize.query(rawQuery, {
    nest: true,
    type: QueryTypes.SELECT,
    plain: false,
    replacements: queryParam
  })

  return transactions
}

function generateFilter(queryParam) {
  let filter = ''
  if (queryParam.province_id) filter += ' entity.province_id = :province_id'
  if (queryParam.regency_id) filter += ' and entity.regency_id = :regency_id'
  if (queryParam.sub_district_id) filter += ' and entity.sub_district_id = :sub_district_id'
  if (queryParam.material_id) filter += ' and Transaction.master_material_id = :material_id'
  if (queryParam.transaction_type_id) filter += ' and Transaction.transaction_type_id = (:transaction_type_id)'
  if (queryParam.transaction_reason_id) filter += ' and Transaction.transaction_reason_id = :transaction_reason_id'
  if (queryParam.vendor_id) filter += ' and Transaction.vendor_id = :vendor_id'
  if (queryParam.customer_id) filter += ' and Transaction.customer_id = :customer_id'
  if (queryParam.entity_id) filter += ' and Transaction.entity_id = :entity_id'
  if (queryParam.activity_id) filter += ' and Transaction.activity_id = :activity_id'
  if (queryParam.start_deleted_date && queryParam.end_deleted_date) filter += ' and Transaction.deleted_at between :start_deleted_date and :end_deleted_date'
  if (queryParam.order_id === '1') {
    filter += ' and Transaction.order_id is not null'
  } else if (queryParam.order_id === '0') {
    filter += ' and Transaction.order_id is null'
  }
  if (queryParam.entity_tag_id) filter += ' and `entity->entity_tags`.`id` = :entity_tag_id'
  if (queryParam.customer_tag_id) filter += ' and `customer->entity_tags`.`id` = :customer_tag_id'
  if (queryParam.is_vaccine) filter += ' and master_material.is_vaccine = :is_vaccine'

  return { filter }
}

async function updateAyoSehat(ayoSehatId, transaction, t) {
  const data = await models.IntegrationAyoSehat.findByPk(ayoSehatId, { transaction: t })
  if (!data) return

  let updateData = {}
  switch (data.integration_status) {
    case TRANSACTION_TYPE.ISSUES:
      updateData = {
        transaction_id_consumed: transaction.id,
        created_at_consumed_smile: transaction.created_at,
        integration_status: TRANSACTION_TYPE.RECEIPTS
      }
      await data.update(updateData, { transaction: t })
      break
    case TRANSACTION_TYPE.RECEIPTS:
      updateData = {
        transaction_id_return: transaction.id,
        integration_status: TRANSACTION_TYPE.RETURN,
        created_at_return_vaccination: transaction.created_at,
        updated_at_return_vaccination: transaction.updated_at,
      }
      if (data.injection_qty !== null) {
        updateData.transaction_id_injection = data.transaction_id_consumed
      }
      await data.update(updateData, { transaction: t })
      break
  }

  return
}

export async function cancelDiscard(req, res, next) {
  const t = await models.sequelize.transaction()

  try {
    var {
      transaction_id,
      entity_id,
      master_material_id,
      batch_id,
      qty,
      date,
      transaction_reason_id,
      change_qty
    } = req.body

    var transaction = null

    if (transaction_id) {
      transaction = await models.Transaction.findByPk(transaction_id, {
        attributes: ['id', 'entity_id', 'change_qty', 'master_material_id', 'transaction_reason_id', 'stock_id']
      })
    } else {
      const condition = {
        entity_id,
        master_material_id,
        change_qty: qty * -1,
        transaction_reason_id,
        transaction_type_id: 4,
        createdAt: {
          [Op.between]: [
            `${date} 00:00:00`,
            `${date} 23:59:59`
          ]
        }
      }
      transaction = await models.Transaction.findOne({
        where: condition,
        attributes: ['id', 'entity_id', 'change_qty', 'master_material_id', 'transaction_reason_id', 'stock_id'],
        include: [
          {
            association: 'stock',
            attributes: ['id', 'batch_id'],
            where: { batch_id: batch_id },
            required: true
          }
        ],
        order: [['id', 'desc']]
      })
    }

    if (!transaction) {
      throw { status: 404, message: 'Transaction data not found' }
    }

    transaction_id = transaction.id
    qty = Math.abs(transaction.change_qty)
    transaction_reason_id = transaction.transaction_reason_id
    var stock_id = transaction.stock_id

    const stockExtermination = await models.StockExtermination.findOne({
      where: { stock_id, transaction_reason_id }
    })

    var { extermination_discard_qty } = stockExtermination

    if (extermination_discard_qty < qty) {
      throw { status: 404, message: 'Stock extermination not found' }
    }

    if (change_qty && qty != change_qty) {
      qty = qty - Math.abs(change_qty)
      change_qty = Math.abs(change_qty) * -1
      transaction.update({ change_qty: change_qty }, { transaction: t })
    } else
      await transaction.destroy({ transaction: t })

    await stockExtermination.update({ extermination_discard_qty: extermination_discard_qty - qty }, { transaction: t })

    const transactionAfter = await models.Transaction.findAll({
      where: { stock_id: stock_id, id: { [Op.gt]: transaction_id } }
    })

    if (transactionAfter.length > 0) {
      await models.Transaction.increment('opening_qty', { by: qty, where: { stock_id: stock_id, id: { [Op.gt]: transaction_id } }, transaction: t })
    }

    const stock = await models.Stock.findByPk(stock_id)
    if (stock)
      await stock.increment('qty', { by: qty, transaction: t })

    await t.commit()

    return res.json({ message: change_qty ? 'Changing discard qty is successful' : 'Cancel discard data is successful' })

  } catch (error) {
    await t.rollback()
    next(error)
  }
}
