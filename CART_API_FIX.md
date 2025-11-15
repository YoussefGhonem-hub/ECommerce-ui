# Fix: Multiple GetCartItems API Calls on Checkout Page

## Issue Description

The `GetCartItems` API (`api/cart`) was being called multiple times when navigating to the checkout page, causing unnecessary network requests and potential performance issues.

## Root Cause Analysis

The multiple API calls were caused by:

1. **EcommerceService Resolver**: The checkout route had a resolver that called `EcommerceService.resolve()`, which included a call to `getCartList()` - making one API call.

2. **CartService Constructor**: The `CartService` automatically calls `refreshCart()` in its constructor - making another API call.

3. **NavbarCartComponent**: The navbar cart component called `cartService.refreshCart()` in its `ngOnInit()` - making a third API call.

4. **CheckoutComponent**: The checkout component had its own `getCartData()` method that directly called the `GetCartItems` API - making a fourth API call.

5. **Route-based Calls**: Each route navigation would trigger some of these calls again.

## Solution Implemented

### 1. Centralized Cart Management

- **CartService** is now the single source of truth for cart data
- All components subscribe to `CartService` observables instead of making direct API calls
- Implemented proper initialization tracking to prevent duplicate calls

### 2. Updated Checkout Component

- **Before**: Called `getCartData()` directly + subscribed to `cartRefresh$` + called `refreshCart()`
- **After**: Only subscribes to `cartItems$` and `cartTotal$` observables from CartService
- **New Method**: `getCheckoutData()` for loading checkout-specific data (coupons, etc.)
- **Smart Refresh**: Only calls `refreshCart()` if cart is empty

### 3. Updated Navbar Cart Component

- **Before**: Called `cartService.refreshCart()` in `ngOnInit()`
- **After**: Commented out redundant refresh call since CartService handles initialization

### 4. Updated EcommerceService Resolver

- **Before**: Always called `getCartList()` for all routes
- **After**: Skip `getCartList()` for checkout route since CartService handles cart data

### 5. Enhanced CartService

- Added initialization tracking with `_isInitialized` flag
- Better logging to track API calls
- Added `isInitialized()` method for external components to check status

## Files Modified

1. **src/@shared/services/cart.service.ts**

   - Added initialization tracking
   - Enhanced logging
   - Added `isInitialized()` method

2. **src/app/main/apps/ecommerce/ecommerce-checkout/ecommerce-checkout.component.ts**

   - Replaced direct API calls with CartService observables
   - Updated `ngOnInit()` to use reactive approach
   - Renamed `getCartData()` to `getCheckoutData()` for checkout-specific data
   - Updated `onCartRefresh()` to use CartService

3. **src/app/layout/components/navbar/navbar-cart/navbar-cart.component.ts**

   - Removed redundant `refreshCart()` call from `ngOnInit()`

4. **src/app/main/apps/ecommerce/ecommerce.service.ts**
   - Updated resolver to skip cart API call for checkout route

## Benefits

1. **Reduced API Calls**: From 3-4 API calls down to 1 API call when navigating to checkout
2. **Better Performance**: Faster page load times
3. **Centralized State**: Single source of truth for cart data
4. **Reactive Updates**: All components automatically update when cart changes
5. **Reduced Network Traffic**: Less bandwidth usage
6. **Better User Experience**: Faster checkout page loading

## Testing Recommendations

1. **Navigation Test**: Navigate to checkout page and verify only 1 `api/cart` call in Network tab
2. **Cart Updates**: Add/remove items and verify all components update correctly
3. **Page Refresh**: Refresh checkout page and verify cart data loads properly
4. **Multiple Navigation**: Navigate between shop and checkout multiple times to verify no duplicate calls

## Notes

- The fix maintains all existing functionality while eliminating redundant API calls
- CartService remains the central hub for all cart-related operations
- All cart data normalization is preserved
- Error handling and loading states are maintained
