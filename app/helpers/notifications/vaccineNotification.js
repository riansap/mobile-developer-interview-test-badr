import { sendMultiNotif } from './notificationService'
import { doDecrypt } from '../common'
import moment from 'moment'

export async function generateVaccineNotification(patient, is_preexposure = false) {
  let { vaccine_sequence, last_vaccine_at, nik, entity, preexposure_sequence, id: patient_id } = patient.dataValues
  const { users } = entity

  if(is_preexposure) vaccine_sequence = preexposure_sequence

  let dataNotif = []

  const VAR_NAME = {
    1 : 'VAR I', 2 : 'VAR II', 3: 'VAR III', 4: 'Booster I', 5: 'Booster II',
    6 : 'Pencegahan I', 7: 'Pencegahan II'
  }
  
  let date = moment(last_vaccine_at).format('YYYY-MM-DD HH:mm:ss')
  const new_nik = doDecrypt(nik) //hideSomeCharacters(doDecrypt(nik))
  const payload = {
    message: `SMILE-ID Pasien dengan NIK ${new_nik} belum menerima ${VAR_NAME[vaccine_sequence + 1]} sejak terakhir vaksinasi ${VAR_NAME[vaccine_sequence]} pada ${date}.`,
    title: `Pengingat Vaksinasi ${VAR_NAME[vaccine_sequence + 1]}`,
    type: `vaccine-${vaccine_sequence + 1}`,
    action_url: null,
    media: ['fcm']
  }

  for (let user of users) {
    user.dataValues.patient_id = patient_id
    const notifPayload = {
      ...payload,
      user: user?.dataValues,
      province_id: entity?.province_id,
      regency_id: entity?.regency_id
    }
  
    dataNotif.push(notifPayload)
    await sendMultiNotif(notifPayload)
  }

  return dataNotif
}