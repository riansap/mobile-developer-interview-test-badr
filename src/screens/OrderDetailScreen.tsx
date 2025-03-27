import {StackNavigationProp} from '@react-navigation/stack';
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {RootStackParamList} from '../navigation/types';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import Colors from '../constants/colors';
import {ScrollView} from 'react-native-gesture-handler';
import Typography from '../constants/typography';
import {mvs} from '../utils/scaling';
import {useOrder} from '../hooks/useOrders';
import LoadingOverlay from '../components/LoadingOverlay';
import ProductList from '../components/ProductList';
import {BackIcon} from '../components/Icons';

type OrderDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'OrderDetail'
>;

type OrderDetailScreenRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;

const OrderDetailScreen: React.FC = () => {
  const navigation = useNavigation<OrderDetailScreenNavigationProp>();
  const route = useRoute<OrderDetailScreenRouteProp>();
  const {orderId} = route.params;
  const {data, isLoading, isError, error} = useOrder(orderId);

  if (isLoading) {
    return <LoadingOverlay visible={isLoading} />;
  }

  if (isError || !data) {
    return (
      <View style={styles.screen}>
        <AppHeader
          title="Detail Order"
          leftComponent={<BackIcon />}
          onLeftPress={navigation.goBack}
          showLeft
        />
        {isLoading && <LoadingOverlay visible={isLoading} />}

        {isError && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Error: {error.message}</Text>
          </View>
        )}

        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            {error?.message ?? 'Order not found'}
          </Text>
        </View>
      </View>
    );
  }

  const totalOrderPrice =
    data.products?.reduce((total, product) => {
      return total + (product?.quantity || 0) * (product?.product?.price || 0);
    }, 0) || 0;

  const valuePrice = totalOrderPrice.toLocaleString('id-ID', {
    style: 'currency',
    maximumFractionDigits: 0,
    currency: 'IDR',
  });

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Detail Order"
        leftComponent={<BackIcon />}
        onLeftPress={navigation.goBack}
        showLeft
      />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.col}>
          <Text style={styles.label}>Order ID</Text>
          <Text style={styles.orderValue}>{data.order_id}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.label}>Customer Name</Text>
          <Text style={styles.orderValue}>{data.customer_name}</Text>
        </View>
        <View
          style={{
            ...styles.col,
            paddingBottom: mvs(24),
          }}>
          <Text style={styles.label}>Total Order Price</Text>
          <Text style={styles.orderValue}>{valuePrice}</Text>
        </View>
        <Text style={styles.titleProduct}>Product Detail</Text>
        <ProductList products={data.products || []} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  col: {
    paddingBottom: mvs(16),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: mvs(8),
  },
  productList: {
    paddingTop: mvs(16),
  },
  titleProduct: {
    fontSize: Typography.fontSize.large,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray,
    textAlign: 'left',
  },
  label: {
    fontSize: Typography.fontSize.large,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryDark,
    textAlign: 'left',
  },
  labelProduct: {
    fontSize: Typography.fontSize.custom(13),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.darkGray,
    textAlign: 'left',
  },
  orderValue: {
    fontSize: Typography.fontSize.custom(20),
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryDark,
    marginTop: mvs(10),
  },
  valueProduct: {
    maxWidth: mvs(160),
    fontSize: Typography.fontSize.custom(13),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primary,
    textAlign: 'right',
  },
  divider: {
    width: mvs(328),
    height: mvs(1),
    backgroundColor: Colors.mediumGray,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.large,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.error,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: mvs(16),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray,
  },
});

export default OrderDetailScreen;
