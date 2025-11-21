export const ProductsController = {
    GetProducts: 'api/products',
    CreateProduct: 'api/products',
    GetProductId: (id: any) => `api/products/${id}`,
    GetProductByIdforUpdate: (id: any) => `api/products/${id}/for-update`,
    UpdateProduct: 'api/products',
}
