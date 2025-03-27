import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {RootStackParamList} from './types';

// Import screens
import OrderListScreen from '../screens/OrderListScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import AddOrderScreen from '../screens/AddOrderScreen';
import EditOrderScreen from '../screens/EditOrderScreen';
import {SafeAreaView} from 'react-native-safe-area-context';

// Create a Stack Navigator with the correct type
const Stack = createStackNavigator<RootStackParamList>();

const Navigation = () => {
  return (
    <NavigationContainer>
      {/* SafeAreaView to handle notches and status bar */}
      <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
        <Stack.Navigator
          initialRouteName="OrderList"
          screenOptions={{
            headerShown: false,
            header: () => null,
          }}>
          <Stack.Screen name="OrderList" component={OrderListScreen} />
          <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
          <Stack.Screen name="AddOrder" component={AddOrderScreen} />
          <Stack.Screen name="EditOrder" component={EditOrderScreen} />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default Navigation;
