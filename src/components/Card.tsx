import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Colors from '../constants/colors';
import Typography from '../constants/typography';
import {mvs} from '../utils/scaling';
import {DeleteIcon} from './Icons';

type CardProps = {
  id: string;
  customer_name: string;
  total_products: number;
  total_price: number;
  created_at: string;
  onEditPress: () => void;
  onDetailPress: () => void;
  onDeletePress: () => void;
};

const Card: React.FC<CardProps> = ({
  id,
  customer_name,
  total_products,
  total_price,
  created_at,
  onEditPress,
  onDetailPress,
  onDeletePress,
}) => {
  const formattedDate = new Date(created_at).toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const formattedTotalPrice = total_price.toLocaleString('id-ID');
  const formattedTotalProducts = total_products.toLocaleString('id-ID');

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>Order Id</Text>
        <Text style={styles.orderId}>{id}</Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={styles.label}>Customer</Text>
          <Text style={styles.value} ellipsizeMode="tail" numberOfLines={1}>
            {customer_name}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Products</Text>
          <Text style={styles.value}>{formattedTotalProducts}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Total Price</Text>
          <Text style={styles.value}>{formattedTotalPrice}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Order Date</Text>
          <Text style={styles.value}>{formattedDate}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={onEditPress}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.detailButton} onPress={onDetailPress}>
          <Text style={styles.detailButtonText}>Detail</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={onDeletePress}>
          <DeleteIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: mvs(328),
    height: mvs(288),
    backgroundColor: Colors.white,
    borderRadius: mvs(4),
    borderColor: Colors.mediumGray,
    borderWidth: mvs(1),
    paddingTop: mvs(12),
    padding: mvs(16),
    marginBottom: mvs(16),
  },
  header: {},
  divider: {
    width: mvs(296),
    height: mvs(1),
    backgroundColor: Colors.mediumGray,
    marginVertical: mvs(16),
  },
  body: {},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: mvs(8),
  },
  label: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.gray,
    textAlign: 'left',
  },
  value: {
    maxWidth: mvs(160),
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primary,
    textAlign: 'right',
  },
  orderId: {
    fontSize: Typography.fontSize.medium,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  actions: {
    flex: 1,
    flexDirection: 'row',
    marginTop: mvs(16),
    alignItems: 'center',
  },
  editButton: {
    width: mvs(122),
    height: mvs(36),
    backgroundColor: Colors.primary,
    borderWidth: mvs(1),
    borderColor: Colors.primary,
    borderRadius: mvs(4),
    marginRight: mvs(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.custom(15),
    fontFamily: Typography.fontFamily.bold,
  },
  detailButton: {
    width: mvs(122),
    height: mvs(36),
    backgroundColor: Colors.white,
    borderWidth: mvs(1),
    borderColor: Colors.secondaryAccent,
    borderRadius: mvs(4),
    marginRight: mvs(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailButtonText: {
    color: Colors.secondaryLight,
    fontSize: Typography.fontSize.custom(15),
    fontFamily: Typography.fontFamily.bold,
  },
  deleteButton: {
    width: mvs(36),
    height: mvs(36),
    borderRadius: mvs(4),
    borderWidth: mvs(1),
    borderColor: Colors.mediumGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Card;
