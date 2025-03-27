export interface ProductsResponse {
    data: Product[]
}

export interface Product {
    name: string
    price: number
    id: number
}

export interface ProductItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}
