import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import {mvs} from '../utils/scaling';
import {Product} from '../types/order';

type ProductListProps = {
  products: Product[];
};

const ProductList: React.FC<ProductListProps> = ({products = []}) => {
  if (!products || products.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No products found</Text>
      </View>
    );
  }

  return products.map((product, index) => {
    if (!product) {
      return null;
    }
    if (!product.product) {
      return null;
    }

    const productPrice = (product.product.price || 0).toLocaleString('id-ID', {
      style: 'currency',
      maximumFractionDigits: 0,
      currency: 'IDR',
    });

    const quantityProduct = (product.quantity || 0).toLocaleString('id-ID');
    const totalProductPrice =
      (product.quantity || 0) * (product.product.price || 0);

    const valueEachProductPrice = totalProductPrice.toLocaleString('id-ID', {
      style: 'currency',
      maximumFractionDigits: 0,
      currency: 'IDR',
    });

    return (
      <View key={`product-${product.product.id}-${index}`}>
        <View
          style={{
            ...styles.productList,
            paddingBottom: index !== products.length - 1 ? mvs(16) : mvs(0),
          }}>
          <View style={styles.row}>
            <Text style={styles.labelProduct}>Product Name</Text>
            <Text style={styles.valueProduct}>{product.product.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelProduct}>Price</Text>
            <Text style={styles.valueProduct}>{productPrice}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelProduct}>Quantity</Text>
            <Text style={styles.valueProduct}>{quantityProduct}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.labelProduct}>Total Price</Text>
            <Text style={styles.valueProduct}>{valueEachProductPrice}</Text>
          </View>
        </View>
        {index !== products.length - 1 && <View style={styles.divider} />}
      </View>
    );
  });
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: mvs(8),
  },
  productList: {
    paddingTop: mvs(16),
  },
  labelProduct: {
    fontSize: Typography.fontSize.custom(13),
    fontFamily: Typography.fontFamily.regular,
    color: Colors.darkGray,
    textAlign: 'left',
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

export default ProductList;
