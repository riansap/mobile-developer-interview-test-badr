const TYPES = {
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  STRING: 'string',
}

export const CONFIGURATIONS = {
  FREEZE_TRANSACTION_ACCESS: {
    cacheKey: 'config:FREEZE_TRANSACTION_ACCESS',
    dbKey: 'FREEZE_TRANSACTION_ACCESS',
    type: TYPES.BOOLEAN,
  },
}

export const parseConfigValue = (value, type) => {
  if (value === null || value === undefined) return value

  switch (type) {
  case TYPES.BOOLEAN:
    return value === 'true' || value === true || value === 1 || value === '1'
  case TYPES.NUMBER:
    return Number(value)
  case TYPES.STRING:
    return value
  default:
    return value
  }
}
