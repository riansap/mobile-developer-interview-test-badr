const dotenv = require('dotenv')

dotenv.config()

export function userCreatedTemplate(user, locale) {
  const userCreated = {}
  const frontendURL = process.env.FE_URL ?? 'http://dev.badr.co.id:6003'
  const url = `${frontendURL}/${locale}/login`
  const btnStyle = 'color: #fff;padding: .5rem 1rem;border-radius: .25rem; background-color: #3ad3f1; border:none; text-decoration: none;'
  userCreated.id = `
    <body>
      <p>Halo ${user.firstname} ${user.lastname ?? ''},</p>
      <p>Anda telah terdaftar di SMILE Indonesia dengan kredensial berikut:</p>
      <p>Username : ${user.username}</p>
      <a href="${url}" style="${btnStyle}" target="_blank">
        Login
      </a>
      <p>Demi meningkatkan keamanan akun Anda, segera ubah password akun anda pada fitur Ubah Kata Sandi di menu Pengaturan > Akun Saya</p>
    </body>
  `
  userCreated.en = `
    <body>
      <p>Hello ${user.firstname} ${user.lastname ?? ''},</p>
      <p>You have registered with SMILE Indonesia with credentials:</p>
      <p>Username :  ${user.username}</p>
      <a href="${url}" style="${btnStyle}" target="_blank">
        Login
      </a>
      <p>To protect your account, we strongly recommend change your account password in the menu Settings > My Account</p>
    </body>
  `
  return userCreated[locale]
}
