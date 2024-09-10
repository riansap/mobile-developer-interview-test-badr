SELECT 
	id,
	name,
	province_id_old,
	province_id_new
FROM entities et
WHERE 
	`type` = 1
	and status = 1
	and deleted_at is NULL
	and province_id_old != province_id_new;

-- PROV KABKO
SELECT
	id,
	name,
	province_id_old,
	province_id_new,
	regency_id_old,
	regency_id_new
FROM entities et
WHERE 
	`type` = 2
	and status = 1
	and deleted_at is NULL
	and regency_id_old != regency_id_new
	and province_id_new in (96, 95, 93, 94)
	
SELECT
	id,
	name,
	province_id_old,
	province_id_new,
	regency_id_old,
	regency_id_new,
	sub_district_id_old,
	sub_district_id_new
FROM entities et
WHERE 
	`type` = 3
	and status = 1
	and is_vendor = 1
	and deleted_at is NULL
	and sub_district_id_old != sub_district_id_new
	and regency_id_new in ( '9671', '9404', '9602', '9601','9603', '9604', '9605', '9301',
	  '9501', '9401', '9403', '9402',
	  '9302', '9303', '9304', '9503',
	  '9502', '9504', '9508', '9507',
	  '9505', '9506', '9405', '9406',
	  '9407', '9408')
	
SELECT
	id,
	name,
	province_id_old,
	province_id_new,
	regency_id_old,
	regency_id_new,
	sub_district_id_old,
	sub_district_id_new,
	village_id_old,
	village_id_new
FROM entities et
WHERE 
	`type` = 3
	and status = 1
	and is_vendor = 1
	and deleted_at is NULL
	and sub_district_id_old != sub_district_id_new
	
SELECT
	id,
	name,
	province_id_old,
	province_id_new,
	regency_id_old,
	regency_id_new,
	sub_district_id_old,
	sub_district_id_new,
	village_id_old,
	village_id_new
FROM entities et
WHERE 
	`type` = 3
	and status = 1
	and is_vendor = 0
	and deleted_at is NULL
	and sub_district_id_old != sub_district_id_new
	
SELECT
	id,
	name,
	province_id_old,
	province_id_new,
	regency_id_old,
	regency_id_new,
	sub_district_id_old,
	sub_district_id_new,
	village_id_old,
	village_id_new
FROM entities et
WHERE 
	`type` = 3
	and status = 1
	and is_vendor = 0
	and deleted_at is NULL
	and sub_district_id_old != sub_district_id_new
	
SELECT 
	customer_id,
	et2.name,
	et2.province_id_old,
	et2.province_id_new,
	et2.regency_id_old,
	et2.regency_id_new,
	et2.sub_district_id_old,
	et2.sub_district_id_new,
	et2.village_id_old, 
	et2.village_id_new,
	vendor_id,
	et1.name,
	et1.province_id_old,
	et1.province_id_new,
	et1.regency_id_old,
	et1.regency_id_new,
	et1.sub_district_id_old,
	et1.sub_district_id_new,
	et1.village_id_old, 
	et1.village_id_new
FROM customer_vendors cv
LEFT JOIN entities et1 ON cv.vendor_id = et1.id
LEFT JOIN entities et2 ON cv.customer_id= et2.id
WHERE
	et2.is_vendor = 0
	and cv.created_at = '2024-01-18 09:24:07'
	and et2.name LIKE '%dalam gedung%'

-- DELETE DALAAM GEDUNG YANG SALAH RELASI (HARUSNYA KE PUSKESMAS TERKAIT)
DELETE customer_vendors
FROM customer_vendors
LEFT JOIN entities et2 ON customer_vendors.customer_id= et2.id
WHERE 
	et2.is_vendor = 0
	and customer_vendors.created_at = '2024-01-18 18:26:15'
	and et2.name LIKE '%dalam gedung%'

-- QUERY MENDAPATKAN RELASI YANG SUDAH TIDAK SE-WILAYAH SESUDAH PEMEKARAN
SELECT 
	customer_id,
	et2.name,
	et2.province_id_old,
	et2.province_id_new,
	et2.regency_id_old,
	et2.regency_id_new,
	et2.sub_district_id_old,
	et2.sub_district_id_new,
	et2.village_id_old, 
	et2.village_id_new,
	vendor_id,
	et1.name,
	et1.province_id_old,
	et1.province_id_new,
	et1.regency_id_old,
	et1.regency_id_new,
	et1.sub_district_id_old,
	et1.sub_district_id_new,
	et1.village_id_old, 
	et1.village_id_new
FROM customer_vendors cv
LEFT JOIN entities et1 ON cv.vendor_id = et1.id
LEFT JOIN entities et2 ON cv.customer_id= et2.id
WHERE
	cv.created_at = '2024-01-18 17:59:14'
	and (et2.sub_district_id_new != et1.sub_district_id_new or et2.regency_id_new != et1.regency_id_new or et2.province_id_new != et1.province_id_new)

DELETE FROM customer_vendors
WHERE created_at = '2024-01-18 17:59:14'