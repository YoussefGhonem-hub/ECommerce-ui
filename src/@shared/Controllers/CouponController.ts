export class CouponController {
    static readonly GetCoupons = 'api/Coupons';
    static readonly GetCouponById = (id: string) => `api/Coupons/${id}`;
    static readonly CreateCoupon = 'api/Coupons';
    static readonly UpdateCoupon = (id: string) => `api/Coupons/${id}`;
    static readonly DeleteCoupon = (id: string) => `api/Coupons/${id}`;
    static readonly ToggleCouponStatus = (id: string) => `api/Coupons/${id}/toggle-status`;
}
