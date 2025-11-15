export const CartController = {
    AddToCart: 'api/cart/add',
    GetCartItems: 'api/cart',
    RemoveFromCart: (id: any) => `api/cart/${id}`,
    UpdateCartItem: (id: any) => `api/cart/${id}`,
    ApplyCoupon: 'api/cart/apply-coupon',
    RemoveCoupon: 'api/cart/remove-coupon',
};
