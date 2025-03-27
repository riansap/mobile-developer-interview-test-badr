import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import AppHeader from '../components/AppHeader';
import {RootStackParamList} from '../navigation/types';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import {mvs} from '../utils/scaling';
// Replace Picker with Dropdown
import {Dropdown} from 'react-native-element-dropdown';
import {useProducts} from '../hooks/useProducts';
import {Product, ProductItem} from '../types/product';
import {useOrder, useUpdateOrder} from '../hooks/useOrders';
import {UpdateOrderRequest} from '../types/order';
import Toast from 'react-native-toast-message';
import LoadingOverlay from '../components/LoadingOverlay';
import {formatToRupiah} from '../utils/currency';
import {BackIcon, DropdownIcon} from '../components/Icons';

type EditOrderScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EditOrder'
>;

type EditOrderScreenRouteProp = RouteProp<RootStackParamList, 'EditOrder'>;

const EditOrderScreen: React.FC = () => {
  const navigation = useNavigation<EditOrderScreenNavigationProp>();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const route = useRoute<EditOrderScreenRouteProp>();
  const orderId = route.params?.orderId;

  const [customerName, setCustomerName] = useState('');
  const [products, setProducts] = useState<ProductItem[]>([]);

  const {data: detailData, isLoading: isDetailDataLoading} = useOrder(orderId);
  const {
    data: productsData,
    isLoading: isProductsLoading,
    isError,
  } = useProducts();

  const isPageLoading = isDetailDataLoading || isProductsLoading;

  const productOptions: Product[] = Array.isArray(productsData)
    ? productsData
    : productsData?.data || [];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const {mutateAsync: updateOrderMutation} = useUpdateOrder();

  useEffect(() => {
    if (!detailData || customerName) {
      return;
    }
    setCustomerName(detailData.customer_name);
    if (detailData.products.length > 0) {
      setProducts(
        detailData.products.map(item => ({
          id: item.product.id.toString(),
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
      );
    } else {
      setProducts([{id: '', name: '', price: 0, quantity: 1}]);
    }
  }, [detailData, customerName]);

  const handleBackPress = (): void => {
    navigation.goBack();
  };

  const handleSavePress = async (): Promise<void> => {
    // Format the data in the required structure
    const formattedData: UpdateOrderRequest = {
      customer_name: customerName,
      products: products
        .filter(product => product.id && product.quantity > 0)
        .map(product => ({
          product_id: Number(product.id),
          quantity: product.quantity,
        })),
    };

    try {
      setIsSubmitting(true);
      const response = await updateOrderMutation({
        id: orderId,
        orderData: formattedData,
      });

      if (response && response.success === true) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Order updated successfully!',
        });
        navigation.navigate('OrderList');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: 'Order update failed!',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMoreProduct = (): void => {
    setProducts([...products, {id: '', name: '', price: 0, quantity: 1}]);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: (products.length + 1) * mvs(300),
        animated: true,
      });
    }, 100);
  };

  // Function to update a product in order
  const updateProduct = (
    index: number,
    field: keyof ProductItem,
    value: any,
  ): void => {
    if (field === 'id') {
      const selectedProduct = productOptions.find(p => p.id === value);
      if (!selectedProduct) {
        return;
      }

      setProducts(
        products.map((product, i) =>
          i === index
            ? {
                ...product,
                id: value,
                name: selectedProduct.name,
                price: selectedProduct.price,
              }
            : product,
        ),
      );
    } else {
      setProducts(
        products.map((product, i) =>
          i === index ? {...product, [field]: value} : product,
        ),
      );
    }
  };

  // Function to calculate total price
  const calculateTotalPrice = (): number => {
    return products.reduce(
      (total, product) =>
        total + (product.price || 0) * (product.quantity || 0),
      0,
    );
  };

  const isFormValid = !products.some(p => !p.id || p.quantity <= 0);

  const renderProductPicker = (product: ProductItem, index: number) => {
    const availableProducts = productOptions.filter(option => {
      // Filter out product options that are already selected
      return (
        option.id === Number(product.id) ||
        !products.some(p => Number(p.id) === option.id)
      );
    });

    // Transform products for dropdown format
    const dropdownData = availableProducts.map(option => ({
      label: option.name,
      value: option.id,
    }));

    return (
      <View style={styles.pickerContainer}>
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          iconColor={Colors.primaryDark}
          itemContainerStyle={styles.itemContainerStyle}
          itemTextStyle={styles.itemTextStyle}
          renderRightIcon={() => <DropdownIcon />}
          data={dropdownData}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select product name"
          value={product.id ? Number(product.id) : 0}
          onChange={item => {
            updateProduct(index, 'id', item.value);
          }}
        />
      </View>
    );
  };

  const renderProductItem = (product: ProductItem, index: number) => (
    <View key={`product-${index}`} style={styles.productItem}>
      <Text style={styles.label}>
        Product Name <Text style={styles.required}>*</Text>
      </Text>

      {renderProductPicker(product, index)}

      <Text style={styles.label}>Price</Text>
      <TextInput
        style={styles.input}
        placeholder="Price"
        value={formatToRupiah(product.price || 0)}
        editable={false}
      />
      <Text style={styles.label}>
        Quantity <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Input quantity"
        value={product.quantity.toString()}
        onChangeText={value =>
          updateProduct(index, 'quantity', parseInt(value, 10) || 0)
        }
        keyboardType="numeric"
      />
    </View>
  );

  // Show loading overlay while data is being fetched
  if (isPageLoading) {
    return <LoadingOverlay visible={true} />;
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Edit Order"
        leftComponent={<BackIcon />}
        onLeftPress={handleBackPress}
        showLeft
      />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.label}>
            Customer Name <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Customer name"
            value={customerName}
            editable={false}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Detail</Text>

          {isError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load products</Text>
            </View>
          ) : (
            <>
              {products.map(renderProductItem)}

              <TouchableOpacity
                style={styles.addMoreButton}
                onPress={handleAddMoreProduct}>
                <Text style={styles.addMoreButtonText}>Add More Product</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{...styles.divider, marginVertical: mvs(24)}} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Total Order Price</Text>
          <TextInput
            style={styles.input}
            placeholder="Total price"
            value={formatToRupiah(calculateTotalPrice())}
            editable={false}
          />
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              (!isFormValid || isSubmitting) && styles.disabledButton,
            ]}
            onPress={handleSavePress}
            disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flexGrow: 1,
    padding: mvs(16),
    backgroundColor: Colors.white,
  },
  section: {},
  sectionTitle: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray,
    marginBottom: mvs(16),
  },
  divider: {
    width: mvs(328),
    height: mvs(1),
    backgroundColor: Colors.mediumGray,
    marginBottom: mvs(16),
  },
  label: {
    fontSize: Typography.fontSize.custom(13),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primary,
    marginBottom: mvs(4),
  },
  pickerLabel: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryDark,
  },
  itemPicker: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryDark,
  },
  required: {
    color: Colors.error,
  },
  input: {
    width: mvs(328),
    height: mvs(40),
    borderWidth: 1,
    borderColor: Colors.mediumGray,
    borderRadius: mvs(4),
    paddingHorizontal: mvs(16),
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryDark,
    marginBottom: mvs(16),
  },
  disabledInput: {
    backgroundColor: Colors.lightGray,
  },
  pickerContainer: {
    width: mvs(328),
    marginBottom: mvs(16),
  },
  dropdown: {
    height: mvs(40),
    borderWidth: 1,
    borderColor: Colors.mediumGray,
    borderRadius: mvs(4),
    paddingHorizontal: mvs(16),
  },
  placeholderStyle: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.gray,
  },
  selectedTextStyle: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryDark,
  },
  itemContainerStyle: {
    backgroundColor: Colors.white,
    marginBottom: mvs(2),
  },
  itemTextStyle: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryDark,
  },
  productItem: {},
  addMoreButton: {
    width: mvs(184),
    height: mvs(36),
    backgroundColor: Colors.primary,
    borderRadius: mvs(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: mvs(8),
  },
  addMoreButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.custom(15),
    fontFamily: Typography.fontFamily.bold,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: mvs(16),
  },
  backButton: {
    flex: 1,
    height: mvs(48),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.mediumGray,
    borderRadius: mvs(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: mvs(8),
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: Typography.fontSize.large,
    fontFamily: Typography.fontFamily.bold,
  },
  saveButton: {
    flex: 1,
    height: mvs(48),
    backgroundColor: Colors.secondaryAccent,
    borderRadius: mvs(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: mvs(8),
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.large,
    fontFamily: Typography.fontFamily.bold,
  },
  loadingContainer: {},
  loadingText: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray,
    marginTop: mvs(8),
  },
  errorContainer: {
    padding: mvs(16),
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.error,
  },
  disabledButton: {
    backgroundColor: Colors.mediumGray,
  },
  title: {
    fontSize: Typography.fontSize.xxlarge,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: mvs(16),
    color: Colors.black,
  },
});

export default EditOrderScreen;
