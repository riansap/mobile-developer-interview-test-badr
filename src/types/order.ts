export interface OrdersResponse {
    page: number
    limit: number
    total: number
    list: Order[]
    nextPage: number | null;
}

export interface Order {
    created_at: string
    customer_name: string
    total_products: number
    total_price: number
    id: string
}

export interface DetailOrderResponse {
    order_id: string
    customer_name: string
    products: Product[]
}

export interface Product {
    quantity: number
    product: NestedProduct
}

export interface NestedProduct {
    name: string
    price: number
    id: number
}

export interface CreateOrderRequest {
    customer_name: string
    products: CreateOrderProduct[]
}

export interface CreateOrderProduct {
    product_id: number
    quantity: number
}

export type CreateOrderResponse = {
    success: boolean;
}

export interface UpdateOrderRequest {
    customer_name: string
    products: CreateOrderProduct[]
}

export interface UpdateOrderResponse {
    success: boolean;
}
