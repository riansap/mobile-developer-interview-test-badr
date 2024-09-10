import moment from 'moment-timezone'

export const TRANSACTION_TYPE = {
  STOCK_COUNT: 1,
  ISSUES: 2,
  RECEIPTS: 3,
  DISCARDS: 4,
  RETURN: 5,
  RECEIPT_OPEN_VIAL: 6,
  ADD_STOCK: 7,
  REMOVE_STOCK: 8,
  CANCEL_DISCARD: 11, // id value before = 9
}

export const DEVICE_TYPE = {
  web: 1,
  mobile: 2,
}

export const VERSION_MOBILE = {
  version: process.env.VERSION_MOBILE || 13,
  version_name: process.env.VERSION_MOBILE_NAME || '1.4.1',
}

export const TRANSACTION_CHANGE_TYPE = {
  ADD: 1,
  RESTOCK: 2,
  REMOVE: 3,
}

export const USER_ROLE = {
  SUPERADMIN: 1,
  ADMIN: 2,
  MANAGER: 3,
  OPERATOR: 4,
  OPERATOR_COVID: 5,
  DISTRIBUTOR_COVID: 6,
  MANAGER_COVID: 7,
  CONTACT_CENTER: 8,
  THIRD_PARTY: 9,
  PKC: 10,
  VENDOR_IOT: 11,
  ASIK: 12,
  SATUSEHAT: 13,
  ADMIN_SO: 14,
}

export const USER_GENDER = {
  MALE: 1,
  FEMALE: 2,
}

export const ORDER_STATUS = {
  PENDING: 1,
  CONFIRMED: 2,
  ALLOCATED: 3,
  SHIPPED: 4,
  FULFILLED: 5,
  CANCELED: 6,
  INDEPENDENT_EXTERMINATION: 7,
}

export const ORDER_TYPE = {
  NORMAL: 1,
  DROPPING: 2,
  RETURN: 3,
  RUTIN_ALLOCATION: 4,
}

export const EXTERMINATION_ORDER_TYPE = {
  EXTERMINATION: 5,
  INDEPENDENT_EXTERMINATION: 6,
}

export const EXTERMINATION_TRANSACTION_TYPE = {
  SHIP: 2,
  RECEIVE: 3,
  INDEPENDENT_EXTERMINATION: 4,
}

export const STOCK_STATUS = {
  VVMA: 1,
  VVMB: 2,
  VVMC: 3,
  VVMD: 4,
}

export const ORDER_CANCEL_REASON = {
  REQUEST: 1,
  DOUBLE: 2,
  WRONG: 3,
  OTHERS: 4,
}

export const ENTITY_TYPE = {
  PROVINSI: 1,
  KOTA: 2,
  FASKES: 3,
  PKC: 4,
  BIOFARMA: 97,
}

export const MATERIAL_TAG = {
  RUTIN: 1,
  BIAS: 2,
  ORI: 3,
  KAMPANYE: 4,
  OPEN_VIAL: 5,
  COVID: 6,
}

export function getStockStatusLabel(status) {
  switch (status) {
    case STOCK_STATUS.VVMA:
      return 'VVMA'
    case STOCK_STATUS.VVMB:
      return 'VVMB'
    case STOCK_STATUS.VVMC:
      return 'VVMC'
    case STOCK_STATUS.VVMD:
      return 'VVMD'
    default:
      return '-'
  }
}

export const STATUS = {
  INACTIVE: 0,
  ACTIVE: 1,
}

export function getLabelByKey(object, value) {
  let key = ''
  key = Object.keys(object).find((idx) => object[idx] === value)
  if (key) {
    key = key.replace('_', ' ')
  }
  return key
}

export const MANUFACTURE_TYPE = {
  VAKSIN: 1,
  ASSET: 2,
  LOGGER: 3,
}

export function getOrderStatusLabel(status, lang = 'id') {
  switch (status) {
    case ORDER_STATUS.PENDING:
      return lang == 'en' ? 'Pending' : 'Ditunda'
    case ORDER_STATUS.CONFIRMED:
      return lang == 'en' ? 'Confirmed' : 'Dikonfirmasi'
    case ORDER_STATUS.ALLOCATED:
      return lang == 'en' ? 'Allocated' : 'Dialokasikan'
    case ORDER_STATUS.SHIPPED:
      return lang == 'en' ? 'Shipped' : 'Dikirim'
    case ORDER_STATUS.FULFILLED:
      return lang == 'en' ? 'Fulfilled' : 'Diterima'
    case ORDER_STATUS.CANCELED:
      return lang == 'en' ? 'Canceled' : 'Dibatalkan'
    case ORDER_STATUS.INDEPENDENT_EXTERMINATION:
      return lang == 'en' ? 'Independent Extermination' : 'Pemusnahan Mandiri'
    default:
      return '-'
  }
}

export function getOrderTypeLabel(type, lang = 'id') {
  switch (type) {
    case ORDER_TYPE.DROPPING:
      return lang == 'en' ? 'Dropping' : 'Diturunkan'
    case ORDER_TYPE.NORMAL:
      return 'Normal'
    case ORDER_TYPE.RETURN:
      return lang == 'en' ? 'Return' : 'Pengembalian'
    case ORDER_TYPE.RUTIN_ALLOCATION:
      return lang == 'en' ? 'Routine Allocation' : 'Alokasi Rutin'
    case EXTERMINATION_ORDER_TYPE.EXTERMINATION:
      return lang == 'en' ? 'Extermination' : 'Pemusnahan'
    case EXTERMINATION_ORDER_TYPE.INDEPENDENT_EXTERMINATION:
      return lang == 'en' ? 'Independent Extermination' : 'Pemusnahan Mandiri'
  }
}

export function formatDateByTimezone(
  date,
  tz = 'Asia/Jakarta',
  format = 'DD/MM/YYYY'
) {
  return moment(date).tz(tz).format(format)
}

export function validateMobilePhone(phone) {
  if (typeof phone === 'number') {
    phone = phone.toString()
  }
  if (!phone.startsWith('08') && !phone.startsWith('628')) {
    return false
  }
  return true
}

export const ORDER_SERVICE_TYPE = {
  REGULER: 1,
  BUFFER_PROV: 2,
  BUFFER_PUSAT: 3,
}

export const SUMMARY_BOX_ENTITY_TYPES = [
  {
    id: 97,
    label: 'Kemenkes RI',
  },
  {
    id: 98,
    label: 'Gudang Vaksin',
  },
  {
    id: 1,
    label: 'Dinkes Provinsi',
  },
  {
    id: 2,
    label: 'Dinkes Kab/Kota',
  },
  {
    id: 3,
    label: 'Puskesmas',
  },
  {
    id: 30,
    label: 'TNI, Polri, RS, KKP',
  },
]

export const YEARLY_NEED_MATERIAL_ID = {
  BCG: 1,
  BCG_pelarut: 2,
  Polio: 3,
  PCV_MDV: 4,
  IPV: 5,
  MR: 6,
  MR_pelarut: 7,
  HepB: 8,
  DPT_HB: 9,
  DT: 10,
  TD: 11,
  PCV: 15,
  ADS_005: 16,
  ADS_05: 17,
  ADS_5: 18,
  SB_25: 19,
  SB_5: 20,
  HPV_BIAS: 37,
  ADS_05_BIAS: 49,
  ADS_5_BIAS: 50,
  MR_BIAS: 51,
  MR_BIAS_pelarut: 52,
  SB_25_BIAS: 53,
  SB_5_BIAS: 54,
  TD_BIAS: 55,
  DT_BIAS: 67,
  Polio_dropper: 68,
  JE_5_DS: 12,
  JE_Pelarut: 13,
  Rotavac_Rotavirus: 154,
  Rotavac_Dropper: 158,
}

export const BIAS_MATERIAL = [
  YEARLY_NEED_MATERIAL_ID.DT_BIAS,
  YEARLY_NEED_MATERIAL_ID.HPV_BIAS,
  YEARLY_NEED_MATERIAL_ID.MR_BIAS,
  YEARLY_NEED_MATERIAL_ID.TD_BIAS,
  YEARLY_NEED_MATERIAL_ID.MR_BIAS_pelarut,
  YEARLY_NEED_MATERIAL_ID.ADS_05_BIAS,
  YEARLY_NEED_MATERIAL_ID.ADS_5_BIAS,
  YEARLY_NEED_MATERIAL_ID.SB_25_BIAS,
  YEARLY_NEED_MATERIAL_ID.SB_5_BIAS,
]

export const MASTER_TARGET_ID = {
  // BAYI_LAHIR_HIDUP: 1,
  // BAYI_SURVIVING_INFANT: 2,
  // ANAK_BADUTA: 3,
  // Murid Kelas 1 SD: 4,
  // Murid kelas 2 SD: 5,
  // Murid Kelas 5 SD: 6,
  // Murid Wanita Kelas 5 SD: 7,
  // Murid Wanita Kelas 6 SD: 8,
  WANITA_USIA_SUBUR: 9,
}

export const MATERIAL_CUSTOM_DISTRIBUTION = [
  { material_id: YEARLY_NEED_MATERIAL_ID.DT_BIAS, months: [11] },
  { material_id: YEARLY_NEED_MATERIAL_ID.HPV_BIAS, months: [8] },
  { material_id: YEARLY_NEED_MATERIAL_ID.MR_BIAS, months: [8] },
  { material_id: YEARLY_NEED_MATERIAL_ID.MR_BIAS_pelarut, months: [8] },
  { material_id: YEARLY_NEED_MATERIAL_ID.ADS_5_BIAS, months: [8] },
  { material_id: YEARLY_NEED_MATERIAL_ID.TD_BIAS, months: [11] },
]

export const ENTITY_TAGS = {
  PUSKESMAS: 9,
  DALAM_GEDUNG: 10,
}

export const NOTIFICATION_TYPE = {
  EXPIRED_30: 'ed-30',
  EXPIRED_14: 'ed-14',
  EXPIRED_10: 'ed-10',
  EXPIRED_3: 'ed-3',
  EXPIRED_1: 'ed-1',
  ORDER_CREATE: 'order-create',
  ORDER_CONFIRM: 'order-confirm',
  ORDER_SHIP: 'order-ship',
  ORDER_FULFILL: 'order-fulfill',
  CAPACITY_80: 'cap-80',
  OVER_STOCK: 'over-stock',
  LESS_STOCK: 'less-stock',
  ZERO_STOCK: 'zero-stock',
  VACCINE_3: 'vaccine-3',
  VACCINE_4: 'vaccine-4',
}

export const OPNAME_CATEGORY = {
  RECEIPT: 1,
  DISTRIBUTION: 2,
  CONSUMPTION: 3,
  DEFECT: 4,
  FINAL_STOCK: 5,
}

export function getOpnameCategoryLabel(key) {
  switch (parseInt(key)) {
    case OPNAME_CATEGORY.RECEIPT:
      return 'Vaccines received minus vaccines returned'
    case OPNAME_CATEGORY.DISTRIBUTION:
      return 'Vaccines allocated minus vaccines received-returned'
    case OPNAME_CATEGORY.CONSUMPTION:
      return 'Vaccines consumed minus Faskes return'
    case OPNAME_CATEGORY.DEFECT:
      return 'Discarded'
    case OPNAME_CATEGORY.FINAL_STOCK:
      return 'Remaining stock'
    default:
      return '-'
  }
}

export const EVENT_REPORT_STATUS = {
  // Dilaporkan → Dinkes
  CREATE: 1,
  // Dicek VCCM → Super Admin
  ON_CHECK_VCCM: 2,
  // Laporan Dibatalkan→ Super Admin
  CANCEL: 3,
  // Dilaporkan ke Biofarma → Super Admin
  UPDATE_BIOFARMA: 4,
  // Dilaporkan ke Provinsi → Super Admin
  UPDATE_PROVINCE: 10,
  // Dilaporkan ke Pfizer → Super Admin
  UPDATE_PFIZER: 11,
  // Hit Manual → Super Admin
  UPDATE_MANUAL: 5,
  // Dalam Pemeriksaan → Contact Center (Admin SMDV Biofarma)
  BIOFARMA_INSPECTION: 6,
  // Sudah Direvisi → Contact Center (Admin SMDV Biofarma)
  ALREADY_REVISION: 7,
  // Cek Revisi → Super Admin
  VALIDATE_REVISION: 8,
  // Selesai → Dinkes
  FINISH: 9,
}

export function getEventReportLabel(key) {
  switch (parseInt(key)) {
    case EVENT_REPORT_STATUS.CREATE:
      return 'Dilaporkan'
    case EVENT_REPORT_STATUS.ON_CHECK_VCCM:
      return 'Diverifikasi'
    case EVENT_REPORT_STATUS.CANCEL:
      return 'Laporan Dibatalkan'
    case EVENT_REPORT_STATUS.UPDATE_BIOFARMA:
      return 'Dilaporkan ke Biofarma'
    case EVENT_REPORT_STATUS.UPDATE_PROVINCE:
      return 'Dilaporkan ke Provinsi'
    case EVENT_REPORT_STATUS.UPDATE_PFIZER:
      return 'Dilaporkan ke Pfizer'
    case EVENT_REPORT_STATUS.UPDATE_MANUAL:
      return 'Hit Manual'
    case EVENT_REPORT_STATUS.BIOFARMA_INSPECTION:
      return 'Dalam Pemeriksaan Biofarma'
    case EVENT_REPORT_STATUS.ALREADY_REVISION:
      return 'Sudah Direvisi'
    case EVENT_REPORT_STATUS.VALIDATE_REVISION:
      return 'Cek Revisi'
    case EVENT_REPORT_STATUS.FINISH:
      return 'Selesai'
    default:
      return '-'
  }
}

export const CONSUMED_STATUS = {
  CANCEL: 0,
  RECEIVED: 1,
}
export const RETURN_STATUS = {
  UNRECEIVED: 0,
  RECEIVED: 1,
  REVISION: 2,
}
export const RETURN_VALIDATION = {
  CORRECTION: 1,
}

export const notCheckOpenVial = [
  TRANSACTION_TYPE.ADD_STOCK,
  TRANSACTION_TYPE.REMOVE_STOCK,
]

export function isTrxUseOpenVial(transaction_type_id, materialVial = true) {
  if (materialVial && !notCheckOpenVial.includes(transaction_type_id)) {
    return true
  }
  return false
}

export const REKONSILIASI_CATEGORY = {
  RECEIVED: 1,
  RETURN: 2,
  DISTRIBUTION: 3,
  RECEIVED_RETURN: 4,
  CONSUMED: 5,
  DEFECT: 6,
  REMAINING: 7,
}

export function getRekonCategoryString(key) {
  switch (parseInt(key)) {
    case REKONSILIASI_CATEGORY.RECEIVED:
      return 'received'
    case REKONSILIASI_CATEGORY.RETURN:
      return 'return'
    case REKONSILIASI_CATEGORY.DISTRIBUTION:
      return 'distribution'
    case REKONSILIASI_CATEGORY.RECEIVED_RETURN:
      return 'received_return'
    case REKONSILIASI_CATEGORY.CONSUMED:
      return 'consumed'
    case REKONSILIASI_CATEGORY.DEFECT:
      return 'defect'
    case REKONSILIASI_CATEGORY.REMAINING:
      return 'remaining'
    default:
      return '-'
  }
}

export function consumedStatusASIK(key) {
  switch (parseInt(key)) {
    case CONSUMED_ASIK.RECEIVED:
      return 'Diterima ASIK'
    case CONSUMED_ASIK.REJECT:
      return 'Ditolak ASIK'
    default:
      return 'Belum diterima ASIK'
  }
}

export function returnStatusASIK(key) {
  switch (parseInt(key)) {
    case RETURN_ASIK.NOTYET:
      return 'Belum diterima SMILE'
    case RETURN_ASIK.RECEIVED:
      return 'Diterima SMILE'
    case RETURN_ASIK.REVISION:
      return 'Sedang direvisi ASIK'
    default:
      return 'Belum Pengembalian'
  }
}

export const CONSUMED_ASIK = {
  RECEIVED: 1,
  REJECT: 0,
}

export const RETURN_ASIK = {
  RECEIVED: 1,
  NOTYET: 0,
  REVISION: 2,
}

export const KFA_LEVEL_ID = {
  TEMPLATE: 2,
  VARIANT: 3,
}

export const KFA_LEVEL_CODE = {
  TEMPLATE: 92,
  VARIANT: 93,
}

export const KFA_LEVEL_CODE_TO_ID = {
  92: 2,
  93: 3,
}

export const MATERIAL_KFA_TYPE_XLS = {
  OBAT_PARENT: 'OBAT-PARENT',
  OBAT: 'OBAT',
  ALKES_BMHP_PARENT: 'ALKES/BMHP-PARENT',
  ALKES_BMHP: 'ALKES/BMHP',
}

/* matrix rule rabies
   format : MATRIX_RULE_RABIES[current_sequence][next_sequence]
*/
export const MATRIX_RULE_RABIES = {
  1: {
    2: {
      can: true
    },
    3: {
      can: true,
      other_sequences: [2]
    },
    4: {
      can: true,
      other_sequences: [2, 3]
    },
    5: {
      can: true,
      other_sequences: [2, 3, 4]
    }
  },
  2: {
    1: {
      can: true, gt_exp: true,
      ignore_exp: true
    },
    3: {
      can: true
    },
    4: {
      can: true,
      other_sequences: [3],
      ignore_exp: true
    },
    5: {
      can: true,
      other_sequences: [3, 4],
      ignore_exp: true
    }
  },
  3: {
    1: {
      can: true, gt_exp: true,
      ignore_exp: true
    },
    4: {
      can: true
    },
    5: {
      can: true,
      other_sequences: [4]
    }
  },
  4: {
    5: {
      can: true
    }
  },
  5: {},
  6: {
    1: {
      can: true
    },
    2: {
      can: true,
      other_sequences: [1]
    },
    3: {
      can: true,
      other_sequences: [1, 2]
    },
    4: {
      can: true,
      other_sequences: [7]
    },
    5: {
      can: true,
      other_sequences: [7, 4]
    },
    7: {
      can: true
    }
  },
  7: {
    1: {
      can: true
    },
    2: {
      can: true,
      other_sequences: [1]
    },
    3: {
      can: true,
      other_sequences: [1, 2]
    },
    4: {
      can: true
    },
    5: {
      can: true,
      other_sequences: [4]
    }
  }
}