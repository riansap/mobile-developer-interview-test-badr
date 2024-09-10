import moment from 'moment'
import sha1 from 'js-sha1'
import { ENTITY_TYPE } from '../constants'

const { BPOM_USERNAME } = process.env
const { BPOM_PASSWORD } = process.env

export function getKelompokSarana(type) {
  let bpomKelompokSarana = '1'
  switch (type) {
  case ENTITY_TYPE.PROVINSI:
    bpomKelompokSarana = '2'
    break
  case ENTITY_TYPE.KOTA:
    bpomKelompokSarana = '4'
    break
  case ENTITY_TYPE.FASKES:
    bpomKelompokSarana = '5'
    break
  case ENTITY_TYPE.BIOFARMA:
    bpomKelompokSarana = '1'
    break
  default:
    break
  }
  return bpomKelompokSarana
}

export function getBPOMHeader() {
  const date = moment().format('YYYYMMDD')
  const token = BPOM_USERNAME + BPOM_PASSWORD + date
  return {
    Unit: '02',
    Token: sha1(token),
  }
}

export function formatProvinceID(provinceID) {
  return provinceID
}

export function formatRegencyID(regencyID) {
  if (!regencyID) {
    return null
  }
  const position = 2
  const separator = '.'
  return [regencyID.slice(0, position), separator, regencyID.slice(position)].join('')
}
