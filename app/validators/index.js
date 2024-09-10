import { validationResult } from 'express-validator'
import errorResponse from '../helpers/errorResponse'

export function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)))

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    const extractedErrors = {}
    errors.array().forEach(value => {
      if (!value.param) value.param = 'general'

      if (!extractedErrors[value.param]) extractedErrors[value.param] = [value.msg]
      else extractedErrors[value.param].push(value.msg)
    })


    res.status(422).json(errorResponse(
      'Unprocessable Entity',
      extractedErrors
    ))
  }
}