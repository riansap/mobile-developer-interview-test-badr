import apiClient from '../api/client';
import { ProductsResponse } from '../types/product';
export const fetchProducts = async (): Promise<ProductsResponse> => {
    try {
        const { data } = await apiClient.get('/api/products');
        return data.data;
    } catch (error) {
        throw new Error('Failed to fetch products.');
    }
};
