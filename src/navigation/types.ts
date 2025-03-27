import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

// Define the parameter list
export type RootStackParamList = {
  OrderList: undefined;
  AddOrder: undefined;
  EditOrder: {orderId: string};
  OrderDetail: {orderId: string};
};

// Define navigation prop types
export type OrderListNavigationProp = StackNavigationProp<RootStackParamList, 'OrderList'>;
export type OrderDetailNavigationProp = StackNavigationProp<RootStackParamList, 'OrderDetail'>;
export type AddOrderNavigationProp = StackNavigationProp<RootStackParamList, 'AddOrder'>;
export type EditOrderNavigationProp = StackNavigationProp<RootStackParamList, 'EditOrder'>;

// Define route prop types
export type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;
export type EditOrderRouteProp = RouteProp<RootStackParamList, 'EditOrder'>;
