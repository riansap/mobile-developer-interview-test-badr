import axios from 'axios'
import https from 'https'
import models from '../../models'

import { publishWorker } from '../services/rabbitmqHelper'

import moment from 'moment'

const SSL_BASE_URL = process.env.SSL_BASE_URL
const SSL_SERVER = process.env.SSL_SERVER

axios = axios.create({
    baseURL: SSL_BASE_URL,
    timeout: 5000000,
    httpsAgent: new https.Agent({
        rejectUnauthorized: false
    })
})


async function login() {
    try {
        let data = {
            client_id: process.env.SSL_CLIENT_ID,
            client_secret: process.env.SSL_CLIENT_SECRET
        }
        let auth_url = '/oauth2/v1/accesstoken?grant_type=client_credentials'
        let dataForm = new URLSearchParams()
        dataForm.append('client_id', data.client_id)
        dataForm.append('client_secret', data.client_secret)
        const response = await axios.post(auth_url, dataForm)
        return response.data.access_token
    } catch (error) {
        console.error(error)
        return null
    }
}

export async function changeStatusSSL(orderID, status) {
    try {
        const dinOrder = await models.DinOrder.findOne({ where: { exist_smile: orderID } })
        const orderData = await models.Order.findByPk(orderID)

        if (dinOrder) {
            const token = await login()
            
            let statusName = ''
            let tanggalTerima = ''
            if (status == 5){
                statusName = 'receive'
                tanggalTerima = moment(orderData?.fulfilled_at).format('YYYY-MM-DD HH:mm:ss')
            }else if (status == 6) statusName = 'cancel'
            else statusName = dinOrder.status
            const dinOrderItems = await models.DinOrderItem.findAll({ where: { din_order_id: dinOrder.id } })

            const sslPayload = {
                "biaya_transport": dinOrder.biaya_transport,
                "carrier": dinOrder.carrier,
                "carrier_ref": dinOrder.carrier_ref,
                "code": dinOrder.din_type,
                "created_at": moment(dinOrder.created_at).format('YYYY-MM-DD HH:mm:ss'),
                "created_by": "DIN Admin",
                "data": [],
                "doc_num": dinOrder.no_po,
                "is_backorder": false,
                "key": dinOrder.key_ssl,
                "line": dinOrder.line,
                "line_ref": dinOrder.line_ref,
                "note": dinOrder.notes,
                "tanggal_terima" : tanggalTerima,
                "penerima": {
                    "alamat": dinOrder.alamat,
                    "kabkota": dinOrder.kabkota_penerima,
                    "kabkota_code": (dinOrder.kabkota_id_penerima || '').toString(),
                    "kecamatan": dinOrder.kecamatan_penerima,
                    "kecamatan_code": (dinOrder.kecamatan_id_penerima || '').toString(),
                    "kelurahan": dinOrder.kelurahan_penerima,
                    "kelurahan_code": (dinOrder.kelurahan_id_penerima || '').toString(), 
                    "kode": (dinOrder.kode_penerima || '').toString(),
                    "kodepos": (dinOrder.kodepos_penerima || '').toString(),
                    "nama": dinOrder.tujuan,
                    "provinsi": dinOrder.provinsi_penerima,
                    "provinsi_code": (dinOrder.provinsi_id_penerima || '').toString(),
                    "type": dinOrder.type_penerima || ''
                },
                "pengirim": {
                    "alamat": dinOrder.alamat_pengirim,
                    "kabkota": dinOrder.kabkota_pengirim,
                    "kabkota_code": (dinOrder.kabkota_id_pengirim || '').toString(),
                    "kecamatan": dinOrder.kecamatan_pengirim,
                    "kecamatan_code": (dinOrder.kecamatan_id_pengirim || '').toString(),
                    "kelurahan": dinOrder.kelurahan_pengirim,
                    "kelurahan_code": (dinOrder.kelurahan_id_pengirim || '').toString(),
                    "kode": (dinOrder.kode_pengirim || '').toString(),
                    "kodepos": (dinOrder.kodepos_pengirim || '').toString(),
                    "nama": dinOrder.nama_pengirim,
                    "provinsi": dinOrder.provinsi_pengirim,
                    "provinsi_code": (dinOrder.provinsi_id_pengirim || '').toString(),
                    "type": dinOrder.type_pengirim || ''
                },
                "ref_num": dinOrder.no_do,
                "status": statusName,
                "sumber_dana": dinOrder.sumber_dana,
                "total_transaksi": dinOrder.total_transaksi,
                "updated_at": moment().format('YYYY-MM-DD HH:mm:ss'),
                "updated_by": "DIN Admin"
            }

            for (let item of dinOrderItems) {
                sslPayload.data.push({
                    lot_no: item.lot_no,
                    tgl_kadaluarsa: item.expired_date,
                    tgl_produksi: item.production_date,
                    product_name: item.produk,
                    kfa_code: item.kfa_code,
                    qty: item.jm_dosis,
                    total_price: item.total_price,
                    unit: item.unit,
                    unit_price: item.unit_price,
                    note: item.note
                })
            }

            const headers = {
                Authorization: `Bearer ${token}`
            }

            const url = `${SSL_BASE_URL}/ssl/v1/ssl/ifp/picking/status?server=${SSL_SERVER}`
            const payload = {
                url,
                method: 'POST',
                headers: headers,
                data: sslPayload,
            }

            publishWorker('http-worker', payload)
        }
    } catch (err) {
        console.err(err)
    }
}
