'use strict';
const models = require('../../dist/models')
const dummyBiofarmaProvinsi = require('../../resources/dummy/biofarmaProvince')
const dummyBiofarmaHub = require('../../resources/dummy/biofarmaHub')

const { DeleteBiofarma, DummyBiofarma } = models.default

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const dataProvinsi = dummyBiofarmaProvinsi.map(item => ({
      no_do: item['NOMOR DO'],
      tanggal_do: item['TANGGAL DO'],
      no_po: item['NOMOR PO'],
      kode_area: item['KODE AREA'],
      pengirim: item['PENGIRIM'],
      tujuan: item['TUJUAN PENGIRIMAN'],
      alamat: item['ALAMAT'],
      produk: item['NAMA PRODUK'],
      no_batch: item['NO BATCH'],
      expired_date: item['EXPIRED_DATE'],
      jm_vial: item['JUMLAH VIAL'],
      jm_dosis: item['JUMLAH DOSIS'],
      jm_vial_diterima: item['JUMLAH VIAL DITERIMA'],
      jm_dosis_diterima: item['JUMLAH DOSIS DITERIMA'],
      status: item['STATUS'],
      tanggal_kirim: item['TANGGAL KIRIM'],
      tanggal_terima: item['TANGGAL TERIMA'],
      jenis_layanan: item['JENIS LAYANAN'],
      no_surat: item['NO SURAT'],
      tanggal_release: item['TANGGAL RELEASE'],
      keterangan: item['KETERANGAN'],
      type: 'provinsi'
    }))
    const dataHub = dummyBiofarmaHub.map(item => ({
      no_do: item['NOMOR DO'],
      tanggal_do: item['TANGGAL DO'],
      no_po: item['NOMOR PO'],
      kode_area: item['KODE AREA'],
      pengirim: item['PENGIRIM'],
      tujuan: item['TUJUAN PENGIRIMAN'],
      alamat: item['ALAMAT'],
      produk: item['NAMA PRODUK'],
      no_batch: item['NO BATCH'],
      expired_date: item['EXPIRED_DATE'],
      jm_vial: item['JUMLAH VIAL'],
      jm_dosis: item['JUMLAH DOSIS'],
      jm_vial_diterima: item['JUMLAH VIAL DITERIMA'],
      jm_dosis_diterima: item['JUMLAH DOSIS DITERIMA'],
      status: item['STATUS'],
      tanggal_kirim: item['TANGGAL KIRIM'],
      tanggal_terima: item['TANGGAL TERIMA'],
      jenis_layanan: item['JENIS LAYANAN'],
      no_surat: item['NO SURAT'],
      tanggal_release: item['TANGGAL RELEASE'],
      keterangan: item['KETERANGAN'],
      type: 'provinsi'
    }))
    console.time('bulkcreate')
    await DummyBiofarma.bulkCreate(dataProvinsi, { ignoreDuplicates: true })
    await DummyBiofarma.bulkCreate(dataHub, { ignoreDuplicates: true })
    console.timeEnd('bulkcreate')
  },

  down: async (queryInterface, Sequelize) => {
  }
}
