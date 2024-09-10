import User from './user'
import Entity from './entities'
import EntityActivityDate from './entity_activity_date'
import Province from './provinces'
import Regency from './regencies'
import Region from './regions'
import SubDistrict from './sub_districts'
import Timezone from './timezones'
import Village from './villages'
import Material from './materials'
import MaterialEntity from './material_entity'
import TransactionType from './transaction_type'
import TransactionInjection from './transaction_injection'
import TransactionReason from './transaction_reason'
import TransactionItem from './transaction_item'
import Stock from './stock'
import StockExtermination from './stock_exterminations'
import Transaction from './transaction'
import MaterialTag from './material_tag'
import Batch from './batch'
import MaterialMaterialTag from './material_material_tag'
import MaterialCompanion from './material_companions'
import Manufacture from './manufacture'
import MaterialManufacture from './material_manufacture'
import Asset from './asset'
import AssetType from './asset_type'
import Order from './order'
import OrderTag from './order_tag'
import OrderOrderTag from './order_order_tag'
import OrderItem from './order_item'
import OrderItemProjectionCapacity from './order_item_projection_capacity'
import OrderStock from './order_stock'
import OrderStockExtermination from './order_stock_extermination'
import OrderComment from './order_comment'
import OrderHistory from './order_history'
import EntityTag from './entity_tags'
import UserTag from './user_tag'
import UserUserTag from './user_user_tag'
import EntityEntityTag from './entity_entity_tags'
import CustomerVendor from './customer_vendor'
import TrackDevice from './track_device'
import TrackingLog from './track_log'
import OrderReport from './order_report'
import RequestOrder from './request_order'
import RequestOrderItem from './request_order_item'
import MaterialCondition from './material_condition'
import BiofarmaOrder from './biofarma_orders'

import MasterTarget from './master_target'
import MasterIPV from './master_ipv'
import MasterTargetDistribution from './master_target_distribution'
import MasterTargetRegency from './master_target_regency'
import DummyBiofarma from './dummy_biofarma'
import DeleteBiofarma from './delete_biofarma'
import ExterminationTransaction from './extermination_transaction'
import ExterminationTransactionType from './extermination_transaction_type'
import ExterminationFlow from './extermination_flow'
import ExterminationFlowReason from './extermination_flow_reason'

// import YearlyParent from './yearly_parent'
import YearlyChild from './yearly_child'

import YearlyChildTarget from './yearly_child_target'
import YearlyParentTarget from './yearly_parent_target'
import YearlyPlan from './yearly_plan'
import YearlyChildIPV from './yearly_child_ipv'
import YearlyPlanIPV from './yearly_plan_ipv'
import YearlyChildResult from './yearly_child_result'
import UserChgHistory from './user_chg_histories'

import OpnameReason from './opname_reasons'
import OpnameAction from './opname_actions'
import OpnameStock from './opname_stocks'
import OpnameStockItem from './opname_stock_items'
import OpnameItemReasonAction from './opname_item_reason_actions'

import EventReport from './event_reports'
import EventReportReason from './event_report_reasons'
import EventReportChildReason from './event_report_child_reasons'
import EventReportItem from './event_report_items'
import EventReportHistory from './event_report_histories'
import EventReportComment from './event_report_comments'

import NewOpname from './new_opnames'
import NewOpnameItem from './new_opname_items'
import NewOpnameStock from './new_opname_stocks'

import MasterActivity from './master_activities'
import MasterMaterial from './master_materials'
import EntityMasterMaterial from './entity_master_material'
import EntityMasterMaterialActivities from './entity_master_material_activities'
import MasterMaterialCondition from './master_material_has_conditions'
import MasterMaterialCompanion from './master_material_has_companions'
import MasterMaterialActivities from './master_material_has_activities'
import EntityMasterMaterialMinMax from './entity_master_material_minmax'

import IntegrationAyoSehat from './integrationayosehat'

import Reconciliation from './reconciliation'
import ReconciliationItem from './reconciliation_items'
import ReconciliationItemReasonAction from './reconciliation_item_reason_actions'

import IntegrationEmonevProvince from './integration_emonev_province'
import IntegrationEmonevMaterial from './integration_emonev_material'
import IntegrationEmonevRegency from './integration_emonev_regency'
import YearlyStockProvince from './yearly_stock_province'
import MasterMaterialType from './master_material_type'
import SourceMaterial from './source_materials'
import PiecesPurchase from './pieces_purchase'
import TransactionPurchase from './transaction_purchase'
import UpdateStock from './update_stocks'
import DinOrder from './din_orders'
import DinOrderItem from './din_order_items'
import OrderStockPurchase from './order_stock_purchase'

import MappingMasterMaterial from './mapping_master_materials'

import MappingEntity from './mapping_entities'

import MasterVolumeMaterialManufacture from './master_volume_material_manufactures'

import Coldstorage from './coldstorage'
import ColdstorageMaterial from './coldstorage_material'
import ColdchainCapacityEquipment from './coldchain_capacity_equipment'

import ColdstorageTransactionLog from './coldstorage_transaction_log'

import MappingCancelDiscard from './mapping_cancel_discard'
import OpnamePeriod from './opname_period'
import DashboardSatusehat from './dashboard_satusehat'
import Configuration from './configuration'
import NotificationType from './notification_types'
import TransactionLast3Month from './transaction_last3months'
import Patient from './patients'

import BiofarmaSMDVOrder from './biofarma_smdv_orders'

import OrderItemKfa from './order_items_kfa'
import RangeTemperature from './range_temperature'
import ColdstoragePerTemperature from './coldstorage_per_temperature'

import ColdstorageAnnualPlanning from './coldstorage_annual_planning'
import KfaLevel from './kfa_level'
import ColdstorageAnnualPlanningTemperature from './coldstorage_annual_planning_temperature'

import RabiesVaccineRule from './rabies_vaccine_rules'
import TransactionPatient from './transaction_patients'

import StopNotificationReason from './stop_notification_reasons'

import StopNotificationHistory from './stop_notification_histories'

export default {
  ColdchainCapacityEquipment,
  User,
  Entity,
  EntityActivityDate,
  Province,
  Regency,
  Region,
  SubDistrict,
  Timezone,
  Village,
  Material,
  MaterialEntity,
  TransactionType,
  TransactionInjection,
  TransactionReason,
  Stock,
  StockExtermination,
  Transaction,
  MaterialTag,
  MaterialMaterialTag,
  Batch,
  Manufacture,
  MaterialManufacture,
  Order,
  OrderStockExtermination,
  OrderTag,
  OrderOrderTag,
  OrderItem,
  OrderItemProjectionCapacity,
  TransactionItem,
  OrderComment,
  Asset,
  AssetType,
  OrderStock,
  OrderHistory,
  EntityTag,
  UserTag,
  UserUserTag,
  EntityEntityTag,
  CustomerVendor,
  TrackDevice,
  TrackingLog,
  OrderReport,
  RequestOrder,
  RequestOrderItem,
  MaterialCondition,
  BiofarmaOrder,
  // YearlyParent,
  YearlyChild,
  MasterTarget,
  MasterIPV,
  MasterTargetDistribution,
  MasterTargetRegency,
  YearlyChildTarget,
  YearlyParentTarget,
  YearlyPlan,
  YearlyChildIPV,
  YearlyPlanIPV,
  YearlyChildResult,
  UserChgHistory,
  OpnameReason,
  OpnameAction,
  OpnameStock,
  OpnameStockItem,
  OpnameItemReasonAction,
  EventReport,
  EventReportReason,
  EventReportChildReason,
  EventReportItem,
  EventReportHistory,
  EventReportComment,
  NewOpname,
  NewOpnameItem,
  NewOpnameStock,
  DummyBiofarma,
  DeleteBiofarma,
  MaterialCompanion,
  MasterActivity,
  MasterMaterial,
  EntityMasterMaterial,
  EntityMasterMaterialActivities,
  EntityMasterMaterialMinMax,
  IntegrationAyoSehat,
  MasterMaterialCondition,
  MasterMaterialCompanion,
  MasterMaterialActivities,

  Reconciliation,
  ReconciliationItem,
  ReconciliationItemReasonAction,
  ExterminationTransaction,
  ExterminationTransactionType,
  ExterminationFlow,
  ExterminationFlowReason,
  IntegrationEmonevProvince,
  IntegrationEmonevMaterial,
  IntegrationEmonevRegency,
  YearlyStockProvince,
  MasterMaterialType,
  SourceMaterial,
  PiecesPurchase,
  TransactionPurchase,
  UpdateStock,

  DinOrder,
  DinOrderItem,

  OrderStockPurchase,

  MappingMasterMaterial,
  MappingEntity,

  MasterVolumeMaterialManufacture,

  Coldstorage,
  ColdstorageMaterial,
  ColdstorageTransactionLog,
  MappingCancelDiscard,
  OpnamePeriod,
  DashboardSatusehat,
  Configuration,
  NotificationType,
  TransactionLast3Month,
  Patient,
  BiofarmaSMDVOrder,
  OrderItemKfa,
  RangeTemperature,
  ColdstoragePerTemperature,

  ColdstorageAnnualPlanning,
  KfaLevel,
  ColdstorageAnnualPlanningTemperature,
  RabiesVaccineRule,
  TransactionPatient,
  StopNotificationReason,
  StopNotificationHistory
}
