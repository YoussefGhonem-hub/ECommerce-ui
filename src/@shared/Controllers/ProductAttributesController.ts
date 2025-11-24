export const ProductAttributesController = {
    GetAll: 'api/productattributes',
    Getdropdown: 'api/productattributes/dropdown',
    Create: 'api/productattributes',
    GetById: (id: any) => `api/productattributes/${id}`,
    Update: 'api/productattributes',
    Delete: (id: any) => `api/productattributes/${id}`
};
