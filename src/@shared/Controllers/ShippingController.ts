export const ShippingController = {
    GetShippingMethods: 'api/admin/shipping/methods',
    GetShippingMethod: (id: string) => `api/admin/shipping/methods/${id}`,
    CreateShippingMethod: 'api/admin/shipping/methods',
    UpdateShippingMethod: (id: string) => `api/admin/shipping/methods/${id}`,
};
