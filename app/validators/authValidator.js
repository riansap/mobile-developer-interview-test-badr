import { body } from 'express-validator'
import { checkPassword, checkPasswordConfirm, emailNotExist } from './customValidator'

export const registerValidator = [
  body('name')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.user.name') }))
    .isString().withMessage((value, { req }) => req.__('validator.string', { field: req.__('field.user.name') })),
  body('email')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.user.email') }))
    .isEmail().withMessage((value, { req }) => req.__('validator.email', { field: req.__('field.user.email') }))
    .custom(emailNotExist),
  body('password')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.user.password') }))
    .custom(checkPassword),
  body('password_confirmation')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.user.password_confirm') }))
    .custom(checkPasswordConfirm)
]

export const loginValidator = [
  body('email')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.user.email') }))
    .isEmail().withMessage((value, { req }) => req.__('validator.email', { field: req.__('field.user.email') })),
  body('password')
    .notEmpty().withMessage((value, { req }) => req.__('validator.not_empty', { field: req.__('field.user.password') }))
]