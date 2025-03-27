import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import AppHeader from '../components/AppHeader';
import {RootStackParamList} from '../navigation/types';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import {mvs} from '../utils/scaling';
import {Dropdown} from 'react-native-element-dropdown';
import {useProducts} from '../hooks/useProducts';
import {Product, ProductItem} from '../types/product';
import {useCreateOrder} from '../hooks/useOrders';
import {CreateOrderRequest} from '../types/order';
import Toast from 'react-native-toast-message';
import {formatToRupiah} from '../utils/currency';
import {BackIcon, DropdownIcon} from '../components/Icons';

type AddOrderScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AddOrder'
>;

const AddOrderScreen: React.FC = () => {
  const navigation = useNavigation<AddOrderScreenNavigationProp>();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [customerName, setCustomerName] = useState('');
  const [products, setProducts] = useState<ProductItem[]>([
    {id: '', name: '', price: 0, quantity: 1},
  ]);

  const {data, isLoading, isError} = useProducts();
  const productOptions: Product[] = Array.isArray(data)
    ? data
    : data?.data || [];

  const [isSubmitting, setIsSubmitting] = useState(false);
  const {mutateAsync: createOrder} = useCreateOrder();

  const handleBackPress = (): void => {
    navigation.goBack();
  };

  const handleSavePress = async (): Promise<void> => {
    const formattedData: CreateOrderRequest = {
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
      const response = await createOrder(formattedData);
      if (response && response.success === true) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Order submitted successfully!',
        });
        navigation.replace('OrderList');
      } else if (response && response.success === false) {
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: 'Order submission failed!',
        });
      }
    } catch (error) {
      console.error('Error submitting order:', error);
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

  const calculateTotalPrice = (): number => {
    return products.reduce(
      (total, product) =>
        total + (product.price || 0) * (product.quantity || 0),
      0,
    );
  };

  const isFormValid =
    customerName && !products.some(p => !p.id || p.quantity <= 0);

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
          value={product.id}
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
        value={formatToRupiah(product.price)}
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

  return (
    <View style={styles.screen}>
      <AppHeader
        title="Add New Order"
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
            placeholderTextColor={Colors.gray}
            style={styles.input}
            placeholder="Input customer name"
            value={customerName}
            onChangeText={setCustomerName}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Detail</Text>

          {isError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                Error fetching products. Please try again.
              </Text>
            </View>
          )}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.secondaryAccent} />
              <Text style={styles.loadingText}>Loading products...</Text>
            </View>
          )}

          {products.map(renderProductItem)}

          <TouchableOpacity
            style={styles.addMoreButton}
            onPress={handleAddMoreProduct}>
            <Text style={styles.addMoreButtonText}>Add More Product</Text>
          </TouchableOpacity>

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
  loadingContainer: {
    padding: mvs(16),
    alignItems: 'center',
  },
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
  itemContainerStyle: {
    backgroundColor: Colors.white,
    marginBottom: mvs(2),
  },
  itemTextStyle: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryDark,
  },
});

export default AddOrderScreen;
