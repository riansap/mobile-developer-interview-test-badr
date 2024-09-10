-- CLEANSING
CREATE TABLE villages_backup_2024_01_08 AS
SELECT * FROM villages;

CREATE TABLE regencies_backup_2024_01_08 AS
SELECT * FROM regencies;

CREATE TABLE sub_districts_backup_2024_01_08 AS
SELECT * FROM sub_districts;

SELECT * FROM villages_backup_2024_01_08 vl
WHERE vl.created_at = '0000-00-00 00:00:00'

UPDATE regencies_backup_2024_01_08
SET created_at = '2021-01-01 00:00:00'
WHERE created_at = '0000-00-00 00:00:00'

UPDATE villages
SET created_at = '2021-01-01 00:00:00'
WHERE created_at = '0000-00-00 00:00:00'

UPDATE regencies
SET created_at = '2021-01-01 00:00:00'
WHERE created_at = '0000-00-00 00:00:00'

UPDATE sub_districts
SET created_at = '2021-01-01 00:00:00'
WHERE created_at = '0000-00-00 00:00:00'

INSERT INTO provinces
VALUES 
	(93, 'PROV. PAPUA SELATAN', NULL, NULL, '7', '2020-12-02 09:43:31', '2020-12-02 09:43:31', NULL),
	(95, 'PROV. PAPUA PEGUNUNGAN', NULL, NULL, '7', '2024-01-15 15:01:00', '2024-01-15 15:01:00', NULL),
	(96, 'PROV. PAPUA BARAT DAYA', NULL, NULL, '7', '2024-01-15 15:01:00', '2024-01-15 15:01:00', NULL);

UPDATE provinces
SET 
	name = 'PROV. PAPUA TENGAH',
	zoom = '7'
WHERE id = '94';

-- MANUALLY UPDATE OLD ID ALL REGION
UPDATE provinces
SET
	provinces.province_id_old = provinces.id 
	
UPDATE regencies
SET
	regencies.regency_id_old = regencies.id,
	regencies.province_id_old = regencies.province_id
	
UPDATE sub_districts sd
SET
	sd.sub_district_id_old = sd.id,
	sd.regency_id_old = sd.regency_id
	
UPDATE villages vl
SET
	vl.village_id_old = vl.id,
	vl.sub_district_id_old = vl.sub_district_id

-- MAP NEW ID PROVINCES FROM IMPORTED EXCEL (master_kode_wilayah) TO NEW COLUMN PROVINCE_ID_NEW
UPDATE provinces, master_kode_wilayah 
SET 
	provinces.province_id_new = master_kode_wilayah.code
WHERE 
	provinces.province_id_old = master_kode_wilayah.kode_lama
	and master_kode_wilayah.level = 1;
	
	
-- MAP NEW ID REGENCIES FROM IMPORTED EXCEL (master_kode_wilayah) TO NEW COLUMN REGENCIES_ID_NEW
UPDATE regencies, master_kode_wilayah
SET 
	regencies.regency_id_new = master_kode_wilayah.code,
	regencies.province_id_new = SUBSTRING(master_kode_wilayah.parent, 1, 2)
WHERE 
	regencies.regency_id_old = master_kode_wilayah.kode_lama
	and master_kode_wilayah.level = 2;

-- MAP NEW ID SUBDISTRICTS FROM IMPORTED EXCEL (master_kode_wilayah) TO NEW COLUMN SUBDISTRICTS_ID_NEW
SELECT id FROM regencies r
WHERE r.province_id in (91, 92, 93, 94, 95, 96)

UPDATE sub_districts, master_kode_wilayah
SET 
	sub_districts.sub_district_id_new = master_kode_wilayah.code,
	sub_districts.regency_id_new = SUBSTRING(master_kode_wilayah.parent, 1, 4)
WHERE 
	sub_districts.sub_district_id_old = master_kode_wilayah.kode_lama
	and master_kode_wilayah.level = 3
	and sub_districts.regency_id_old in (9101, 9102, 9103, 9104, 9105, 9106, 9107, 9108, 9109, 9110,
  		9111, 9112, 9113, 9114, 9115, 9116, 9117, 9118, 9119, 9120,
  		9121, 9122, 9123, 9124, 9125, 9126, 9127, 9128, 9171, 9201,
	  	9202, 9203, 9204, 9205, 9206, 9207, 9208, 9209, 9210, 9211,
  		9212, 9271, 9471);

-- MAP NEW ID VILLAGES FROM IMPORTED EXCEL (master_kode_wilayah) TO NEW COLUMN VILLAGES_ID_NEW
select id
FROM sub_districts sd
WHERE sd.regency_id in (9101, 9102, 9103, 9104, 9105, 9106, 9107, 9108, 9109, 9110,
  		9111, 9112, 9113, 9114, 9115, 9116, 9117, 9118, 9119, 9120,
  		9121, 9122, 9123, 9124, 9125, 9126, 9127, 9128, 9171, 9201,
	  	9202, 9203, 9204, 9205, 9206, 9207, 9208, 9209, 9210, 9211,
  		9212, 9271, 9471)
  		
UPDATE villages, master_kode_wilayah, sub_districts
SET 
	villages.village_id_new = master_kode_wilayah.code,
	villages.sub_district_id_new = SUBSTRING(master_kode_wilayah.parent, 1, 6)
WHERE 
	villages.village_id_old = master_kode_wilayah.kode_lama 
	and villages.sub_district_id = sub_districts.id 
	and master_kode_wilayah.`level` = 4
	and sub_districts.regency_id in (9101, 9102, 9103, 9104, 9105, 9106, 9107, 9108, 9109, 9110,
  		9111, 9112, 9113, 9114, 9115, 9116, 9117, 9118, 9119, 9120,
  		9121, 9122, 9123, 9124, 9125, 9126, 9127, 9128, 9171, 9201,
	  	9202, 9203, 9204, 9205, 9206, 9207, 9208, 9209, 9210, 9211,
  		9212, 9271, 9471)

select count(*) from villages
WHERE 
	villages.village_id_new is null
	and villages.sub_district_id_new is null

-- MONITORING
SHOW FULL PROCESSLIST;

show open tables where in_use>0;

SHOW ENGINE INNODB STATUS;

SELECT count(*)
FROM villages 
WHERE villages.village_id_new is null
and villages.sub_district_id_new is null;

-- UPDATE MASTER WILAYAH
-- PROVINCE
UPDATE provinces p
SET p.id = COALESCE(p.province_id_new, p.id)

SET FOREIGN_KEY_CHECKS=0;

-- REGENCY
UPDATE regencies r
SET 
	r.id = COALESCE(r.regency_id_new, r.id),
	r.province_id = COALESCE(r.province_id_new, r.province_id)
WHERE 
	r.regency_id_old != r.regency_id_new

-- SUB DISTRICT
UPDATE sub_districts sd
SET 
	sd.id = COALESCE(sd.sub_district_id_new, sd.id),
	sd.regency_id = COALESCE(sd.regency_id_new, sd.regency_id)
WHERE 
	sd.sub_district_id_old != sd.sub_district_id_new
	
-- VILLAGE
UPDATE villages vl
SET 
	vl.id = COALESCE(vl.village_id_new, vl.id),
	vl.sub_district_id = COALESCE(vl.sub_district_id_new, vl.sub_district_id)
WHERE 
	vl.village_id_old != vl.village_id_new
	
SET FOREIGN_KEY_CHECKS=1

-- NEW QUERY
ALTER TABLE `provinces` ADD `province_id_old` VARCHAR(255) DEFAULT id