import apiClient from '../api/client';
import { CreateOrderRequest, CreateOrderResponse, DetailOrderResponse, OrdersResponse, UpdateOrderRequest } from '../types/order';

type FetchOrderResponse = {
    orders: OrdersResponse;
    nextPage: number | null;
}

const API_ENDPOINTS = {
    ORDERS: '/api/orders',
    ORDER: '/api/order',
};

export const fetchOrders = async ({ pageParam = 1 }): Promise<FetchOrderResponse> => {
    try {
        const { data } = await apiClient.get(`${API_ENDPOINTS.ORDERS}?page=${pageParam}&limit=10`);
        return {
            orders: data,
            nextPage: data.list.length > 0 ? pageParam + 1 : null,
        };
    } catch (error) {
        throw new Error('Failed to fetch orders.');
    }
};

export const getOrderById = async (orderId: string): Promise<DetailOrderResponse> => {
    try {
        const { data } = await apiClient.get(`${API_ENDPOINTS.ORDER}/${orderId}`);
        return data;
    } catch (error) {
        throw new Error('Failed to fetch order details.');
    }
};

export const createOrder = async (orderData: CreateOrderRequest): Promise<CreateOrderResponse> => {
    try {
        const { data } = await apiClient.post(API_ENDPOINTS.ORDER, orderData);
        return data;
    } catch (error) {
        throw new Error('Failed to create order.');
    }
};

export const updateOrder = async (orderId: string, orderData: UpdateOrderRequest): Promise<CreateOrderResponse> => {
    try {
        const { data } = await apiClient.put(`${API_ENDPOINTS.ORDER}/${orderId}`, orderData);
        return data;
    } catch (error) {
        throw new Error('Failed to update order.');
    }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
    try {
        await apiClient.delete(`${API_ENDPOINTS.ORDER}/${orderId}`);
    } catch (error) {
        throw new Error('Failed to delete order.');
    }
};
