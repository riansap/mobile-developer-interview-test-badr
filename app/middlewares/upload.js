import multer from 'multer'
import path from 'path'

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../resources/uploads/'))
  },
  filename: (req, file, cb) => {
    console.log(file.originalname)
    cb(null, `${Date.now()}-${file.originalname}`)
  },
})

const uploadFile = multer({
  storage,
  limits: {
    fileSize: 800000000, // Compliant: 800MB
  },
  onError(err, next) {
    console.log('error', err)
    next(err)
  },
})
module.exports = uploadFile
