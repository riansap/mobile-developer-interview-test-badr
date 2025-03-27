import React, {useState} from 'react';
import {View, StyleSheet, FlatList, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import AppHeader from '../components/AppHeader';
import {RootStackParamList} from '../navigation/types';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import {mvs} from '../utils/scaling';
import Card from '../components/Card';
import {useOrders, useDeleteOrder} from '../hooks/useOrders';
import LoadingOverlay from '../components/LoadingOverlay';
import {Order} from '../types/order';
import Toast from 'react-native-toast-message';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import {AddIcon} from '../components/Icons';

type OrderListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'OrderList'
>;

const EmptyListComponent = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyText}>No orders found.</Text>
  </View>
);

const OrderListScreen: React.FC = () => {
  const navigation = useNavigation<OrderListScreenNavigationProp>();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const {mutateAsync: deleteOrder} = useDeleteOrder();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useOrders();

  const orders: Order[] = data?.pages.flatMap(page => page.orders.list) || [];
  const handleAddPress = (): void => {
    navigation.navigate('AddOrder');
  };

  const handleEditPress = (id: string): void => {
    navigation.navigate('EditOrder', {orderId: id});
  };

  const handleDetailPress = (id: string): void => {
    navigation.navigate('OrderDetail', {orderId: id});
  };

  const handleDeletePress = (id: string): void => {
    setSelectedOrderId(id);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (selectedOrderId) {
      try {
        setIsDeleting(true);
        await deleteOrder(selectedOrderId);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Order deleted successfully',
        });
        refetch();
      } catch (err) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to delete order',
        });
      } finally {
        setIsDeleting(false);
        setDeleteModalVisible(false);
      }
    }
  };

  const handleOnRefresh = (): void => {
    refetch();
    Toast.show({
      type: 'info',
      text1: 'Refreshed',
      text2: 'Order list refreshed successfully',
    });
  };

  if (isLoading) {
    return <LoadingOverlay visible={isLoading} />;
  }

  if (isError) {
    return (
      <View style={styles.screen}>
        <AppHeader
          title="Order"
          leftComponent={<AddIcon />}
          onLeftPress={handleAddPress}
          showLeft
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Error: {error.message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Order"
        leftComponent={<AddIcon />}
        onLeftPress={handleAddPress}
        showLeft
      />

      {orders.length > 0 && (
        <FlatList
          data={orders}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => {
            if (!item) {
              return null;
            }
            return (
              <Card
                id={item.id}
                customer_name={item.customer_name}
                total_products={item.total_products}
                total_price={item.total_price}
                created_at={item.created_at}
                onEditPress={() => handleEditPress(item.id)}
                onDetailPress={() => handleDetailPress(item.id)}
                onDeletePress={() => handleDeletePress(item.id)}
              />
            );
          }}
          ListEmptyComponent={
            !isLoading && !isError ? EmptyListComponent : null
          }
          keyExtractor={item => (item ? item.id : '')}
          onEndReached={() => {
            if (hasNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          refreshing={isFetchingNextPage}
          onRefresh={handleOnRefresh}
        />
      )}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => !isDeleting && setDeleteModalVisible(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
  },
  container: {
    flexGrow: 1,
    padding: mvs(16),
    backgroundColor: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: mvs(32),
  },
  emptyText: {
    fontSize: Typography.fontSize.large,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray,
    textAlign: 'center',
  },
});

export default OrderListScreen;
