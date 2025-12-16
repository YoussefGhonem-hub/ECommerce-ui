import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { HttpService } from './http.service';
import { CartController } from '@shared/Controllers/CartController';

@Injectable({
    providedIn: 'root'
})
export class CartService {
    // Private subjects for cart state
    private _cartItems = new BehaviorSubject<any[]>([]);
    private _cartTotal = new BehaviorSubject<number>(0);
    private _cartCount = new BehaviorSubject<number>(0);

    // Public observables
    public cartItems$ = this._cartItems.asObservable();
    public cartTotal$ = this._cartTotal.asObservable();
    public cartCount$ = this._cartCount.asObservable();

    // Subject for cart refresh events
    private _cartRefresh = new Subject<void>();
    public cartRefresh$ = this._cartRefresh.asObservable();

    // Subject for cart action notifications
    private _cartNotification = new Subject<{ type: 'added' | 'removed' | 'updated', productName?: string }>();
    public cartNotification$ = this._cartNotification.asObservable();

    private _isInitialized = false;

    constructor(private httpService: HttpService) {
        // Load cart data on service initialization
        this.refreshCart();
    }

    /**
     * Refresh cart data from API
     */
    refreshCart(): void {
        console.log('[CartService] Refreshing cart data...');
        this.httpService.GET(`${CartController.GetCartItems}`).subscribe((res: any) => {
            if (res && res.succeeded && res.data) {
                const cartData = res.data.cart || { items: [], total: 0 };

                // Normalize cart items
                const normalizedItems = (cartData.items || []).map((item: any) => {
                    const normalizedItem = { ...item };
                    normalizedItem.id = item.id || item.Id;
                    normalizedItem.productId = item.productId || item.ProductId;
                    normalizedItem.productName = item.productName || item.ProductName;
                    normalizedItem.brand = item.brand || item.Brand;
                    normalizedItem.mainImagePath = item.mainImagePath || item.MainImagePath;
                    normalizedItem.price = item.price || item.Price || 0;
                    normalizedItem.quantity = item.quantity || item.Quantity || 0;
                    normalizedItem.subTotal = item.subTotal || item.SubTotal || (normalizedItem.price * normalizedItem.quantity);

                    // Normalize product attributes - only include actually selected attributes
                    // Only include attributes that have BOTH attributeId and valueId (indicating actual selection)
                    const allAttributes = item.productAttributes || item.ProductAttributes || [];
                    normalizedItem.productAttributes = allAttributes
                        .filter((attr: any) => {
                            const attributeId = attr.attributeId || attr.AttributeId;
                            const valueId = attr.valueId || attr.ValueId;

                            // Must have both IDs to be considered a selected attribute
                            return attributeId && valueId;
                        })
                        .map((attr: any) => ({
                            attributeId: attr.attributeId || attr.AttributeId,
                            valueId: attr.valueId || attr.ValueId,
                            attributeName: attr.attributeName || attr.AttributeName,
                            value: attr.value || attr.Value,
                            isSelected: true
                        }));

                    return normalizedItem;
                });

                // Update subjects
                this._cartItems.next(normalizedItems);
                this._cartCount.next(normalizedItems.length);
                this._cartTotal.next(res.data.total || cartData.total || 0);

                // Mark as initialized and emit refresh event
                this._isInitialized = true;
                this._cartRefresh.next();

                console.log('[CartService] Cart refreshed successfully:', normalizedItems.length, 'items');
            } else {
                // Empty cart state
                this._cartItems.next([]);
                this._cartCount.next(0);
                this._cartTotal.next(0);
                this._cartRefresh.next();
            }
        }, err => {
            console.error('[CartService] Error refreshing cart:', err);
            // Set empty state on error
            this._cartItems.next([]);
            this._cartCount.next(0);
            this._cartTotal.next(0);
            this._cartRefresh.next();
        });
    }

    /**
     * Add item to cart
     */
    addToCart(productId: string, quantity: number, attributes: any[] = []): Promise<boolean> {
        const payload = {
            ProductId: productId,
            Quantity: quantity,
            Attributes: attributes.length > 0 ? attributes : null
        };

        return new Promise((resolve, reject) => {
            this.httpService.POST(CartController.AddToCart, payload).subscribe((res: any) => {
                if (res && res.succeeded) {
                    console.log('[CartService] Item added to cart successfully');
                    this.refreshCart(); // Refresh cart data
                    this._cartNotification.next({ type: 'added' });
                    resolve(true);
                } else {
                    console.error('[CartService] Failed to add item to cart:', res.message);
                    reject(false);
                }
            }, err => {
                console.error('[CartService] Error adding item to cart:', err);
                reject(false);
            });
        });
    }

    /**
     * Remove item from cart
     */
    removeFromCart(cartItemId: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.httpService.DELETE(CartController.RemoveFromCart(cartItemId)).subscribe((res: any) => {
                if (res && res.succeeded) {
                    console.log('[CartService] Item removed from cart successfully');
                    this.refreshCart(); // Refresh cart data
                    this._cartNotification.next({ type: 'removed' });
                    resolve(true);
                } else {
                    console.error('[CartService] Failed to remove item from cart:', res.message);
                    reject(false);
                }
            }, err => {
                console.error('[CartService] Error removing item from cart:', err);
                reject(false);
            });
        });
    }

    /**
     * Update item quantity in cart
     */
    updateQuantity(productId: string, quantity: number, attributes: any[] = []): Promise<boolean> {
        if (quantity <= 0) {
            // For quantity 0 or negative, we need the cart item ID to remove it
            // This should be handled by the calling component that has the cart item ID
            return Promise.reject('Cannot remove item without cart item ID');
        }

        return this.addToCart(productId, quantity, attributes);
    }

    /**
     * Get current cart items (snapshot)
     */
    getCurrentCartItems(): any[] {
        return this._cartItems.value;
    }

    /**
     * Get current cart total (snapshot)
     */
    getCurrentCartTotal(): number {
        return this._cartTotal.value;
    }

    /**
     * Get current cart count (snapshot)
     */
    getCurrentCartCount(): number {
        return this._cartCount.value;
    }

    /**
     * Check if cart service is initialized
     */
    isInitialized(): boolean {
        return this._isInitialized;
    }
}