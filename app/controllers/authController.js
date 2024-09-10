import jwt from 'jsonwebtoken'
import models from '../models'
import errorResponse from '../helpers/errorResponse'
import { checkHash, getHash } from '../helpers/password'

const { User } = models

export async function register(req, res) {
  try {
    let data = req.body
    data.password = getHash(req.body.password)

    const user = await User.create(data)
    const userData = user.dataValues
    delete userData.password

    res.status(201).json(userData)
  } catch (err) {
    console.log(err)
    res.status(500).json(errorResponse('Internal Server Error'))
  }
}

export async function login(req, res) {
  try {
    const data = req.body
    const user = await User.findOne({
      where: {
        email: data.email
      }
    })

    if (!user || !checkHash(data.password, user.password)) {
      res.status(400).json(errorResponse('Email atau password Anda tidak ditemukan'))
      return
    }

    let userData = user.dataValues
    const payload = {
      id: userData.id,
      email: userData.email
    }

    const token = jwt.sign(payload, process.env.SECRET, { expiresIn: '7d' })
    userData.token = token

    res.status(200).json(userData)
  } catch (err) {
    console.log(err)
    res.status(500).json(errorResponse('Internal Server Error'))
  }
}