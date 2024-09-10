/* Login Model. */
/**
 * @typedef Login
 * @property {string} username.required - admin - Email user
 * @property {string} password.required - password123 - Password user
 * 
 */

/**
 * This function comment is parsed by doctrine
 * @route POST /auth/login
 * @group Auth - Operations about Auth
 * @param {Login.model} data.body Login - Some Name description
 * @returns {object} 200 - {"email": "email", "name": "name", "token": "", "createdAt": "", "updatedAt": ""}
 * @returns {Error}  422 - {"message": "Unprocessable Entity","errors": {"email": ["Email must be in email format"]}}
 * @returns {Error}  400 - {"message": "Email/password tidak ditemukan"}
 * @returns {Error}  500 - {"message": "Internal Server Error"}
 * @returns {Error}  default - Unexpected error
 * @security [{"acceptLanguange": [], "deviceType":[]}]
 */

/* Forgot Password Model. */
/**
  * @typedef ForgotPassword
  * @property {string} username.required - test@example.com - Email user
  * 
  */
 
/**
  * This function comment is parsed by doctrine
  * @route POST /auth/forgot-password
  * @group Auth - Operations about Auth
  * @param {ForgotPassword.model} data.body Forgot Password - Some Name description
  * @returns {object} 200 - {"message": "Success process Forgot Password"}
  * @returns {Error}  422 - {"message": "Unprocessable Entity","errors": {"email": ["Email must be in email format"]}}
  * @returns {Error}  400 - {"message": "Email tidak ditemukan"}
  * @returns {Error}  500 - {"message": "Internal Server Error"}
  * @returns {Error}  default - Unexpected error
  * @security acceptLanguange
  */
 
/* Reset Password Model. */
/**
  * @typedef ResetPassword
  * @property {string} token - token - Token Reset Password
  * @property {string} password.required - password - New Password
  * @property {string} password_confirmation.required - password - New Password Confirmation
  * 
  */
 
/**
  * This function comment is parsed by doctrine
  * @route POST /auth/reset-password
  * @group Auth - Operations about Auth
  * @param {ResetPassword.model} data.body Reset Password - Some Name description
  * @returns {object} 200 - {"message": "Success process Reset Password"}
  * @returns {Error}  422 - {"message": "Unprocessable Entity","errors": {"password": ["string"], "password_confirmation": ["string"]}}
  * @returns {Error}  400 - {"message": "Email tidak ditemukan"}
  * @returns {Error}  500 - {"message": "Internal Server Error"}
  * @returns {Error}  default - Unexpected error
  * @security acceptLanguange
  */
 
/* Reset Password Model. */
/**
  * @typedef UpdatePassword
  * @property {string} password.required - password - current password
  * @property {string} new_password.required - password - New Password
  * @property {string} password_confirmation.required - password - New Password Confirmation
  * 
  */
 
/**
  * This function comment is parsed by doctrine
  * @route POST /auth/update-password
  * @group Auth - Operations about Auth
  * @param {UpdatePassword.model} data.body Reset Password - Some Name description
  * @returns {object} 200 - {"message": "Success process Reset Password"}
  * @returns {Error}  422 - {"message": "Unprocessable Entity","errors": {"password": ["string"], "password_confirmation": ["string"]}}
  * @returns {Error}  400 - {"message": "Email tidak ditemukan"}
  * @returns {Error}  500 - {"message": "Internal Server Error"}
  * @returns {Error}  default - Unexpected error
  * @security [{"acceptLanguange": [], "JWT":[]}]
  */