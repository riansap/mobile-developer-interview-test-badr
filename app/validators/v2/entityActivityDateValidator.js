import moment from 'moment'
import models from '../../models'

/**
 * Check join and end date of activity on a particular entity. This
 * wil determine if an action can be performed based on the 
 * activity join end date and when the action is perfomed. For example:
 * when you want to perfom some action involving entity and activity 
 * at 12 January 2024 but the end date of that activity is 11 January 2024
 * then you cant perform that action, you need to update the end date first
 * 
 * @param {int} entityId - main entity actor
 * @param {int} activityId - activity which the entity want to perform the action in
 * @param {int} req - req object
 * @returns {boolean} boolean
 */
export async function entityActivityDateValidator(entityId, activityId, req) {
  const entityActivityDate = await models.EntityActivityDate.findOne({
    where: {
      activity_id: activityId,
      entity_id: entityId
    }
  })

  if (!entityActivityDate) {
    throw new Error(req.__('validator.entity_activity_date_missing', { field: req.__('field.id.transaction_id') }))
  }

  if (!entityActivityDate.join_date) {
    throw new Error(req.__('validator.entity_activity_date_missing', { field: req.__('field.id.transaction_id') }))
  }

  const currentDate = moment()
  const joinMoment = moment(entityActivityDate.join_date)
  const endMoment = moment(entityActivityDate.end_date).endOf('day')

  if (entityActivityDate.join_date && currentDate.isBefore(joinMoment)) {
    throw new Error(req.__('validator.entity_activity_date_not_yet_active', { field: req.__('field.id.transaction_id') }))
  }

  if (entityActivityDate.end_date && currentDate.isAfter(endMoment)) {
    throw new Error(req.__('validator.entity_activity_date_not_active', { field: req.__('field.id.transaction_id') }))
  }

  return true
}