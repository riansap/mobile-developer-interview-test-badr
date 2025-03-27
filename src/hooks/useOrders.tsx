import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createOrder,
  deleteOrder,
  fetchOrders,
  getOrderById,
  updateOrder,
} from '../services/orderService';
import {CreateOrderRequest, UpdateOrderRequest} from '../types/order';

const QUERY_KEYS = {
  ORDERS: 'orders',
  ORDER: 'order',
};

export const useOrders = () => {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.ORDERS],
    queryFn: fetchOrders,
    initialPageParam: 1,
    getNextPageParam: lastPage => lastPage.nextPage ?? undefined,
    getPreviousPageParam: firstPage => firstPage.nextPage ?? undefined,
    staleTime: 1000 * 60 * 5, // Data dianggap fresh selama 5 menit (dalam milidetik)
    refetchOnWindowFocus: false, // Hindari refetch saat fokus kembali pada jendela
    refetchOnMount: false, // Hindari refetch saat komponen dimount
    refetchOnReconnect: false, // Hindari refetch saat koneksi internet kembali
  });
};

export const useOrder = (id: string) => {
  const stableId = id || ''; // Menghindari `undefined` dalam queryKey

  return useQuery({
    queryKey: [QUERY_KEYS.ORDER, stableId],
    queryFn: () => getOrderById(stableId),
    staleTime: 1000 * 60 * 10, // Data dianggap fresh selama 10 menit (dalam milidetik)
    refetchOnWindowFocus: false, // Hindari refetch saat fokus kembali pada jendela
    refetchOnMount: false, // Hindari refetch saat komponen dimount
    refetchOnReconnect: false, // Hindari refetch saat koneksi internet kembali
    enabled: !!id, // Only run query if id exists
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: CreateOrderRequest) => createOrder(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [QUERY_KEYS.ORDERS]});
    },
    onError: error => {
      console.error('Order creation failed:', error);
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      orderData,
    }: {
      id: string;
      orderData: UpdateOrderRequest;
    }) => updateOrder(id, orderData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({queryKey: [QUERY_KEYS.ORDER]});
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ORDER, variables.id],
      });
    },
    onError: error => {
      console.error('Order update failed:', error);
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: [QUERY_KEYS.ORDERS]});
    },
    onError: error => {
      console.error('Order deletion failed:', error);
    },
  });
};
