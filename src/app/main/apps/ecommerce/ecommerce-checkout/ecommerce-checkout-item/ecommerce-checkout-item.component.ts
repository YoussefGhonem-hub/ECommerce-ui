import { Component, Input, OnInit, ViewEncapsulation, Output, EventEmitter } from '@angular/core';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { HttpService } from '@shared/services/http.service';
import { CartController } from '@shared/Controllers/CartController';
import { WishlistController } from '@shared/Controllers/WishlistController';
import { GuestUserService } from '@shared/services/guest-user.service';
import { CartService } from '@shared/services/cart.service';

@Component({
  selector: 'app-ecommerce-checkout-item',
  templateUrl: './ecommerce-checkout-item.component.html',
  styleUrls: ['../ecommerce-checkout.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EcommerceCheckoutItemComponent implements OnInit {
  // Input Decorator
  @Input() product;

  @Output() cartRefresh = new EventEmitter<void>();

  constructor(
    private httpService: HttpService,
    private guestUserService: GuestUserService,
    private cartService: CartService
  ) { }

  /**
   * Handle quantity change from touchspin component
   * @param newQuantity - The new quantity value
   */
  onQuantityChange(newQuantity: number) {
    console.log('[CheckoutItem] Quantity change triggered:', newQuantity);
    if (!this.product) return;

    // Ensure newQuantity is a valid number
    if (typeof newQuantity !== 'number' || isNaN(newQuantity)) {
      console.warn('[CheckoutItem] Invalid quantity value:', newQuantity);
      return;
    }

    if (newQuantity === this.product.quantity) return;

    // Validate quantity bounds
    const minQty = 1;
    const maxQty = this.product.stockQuantity || 10;

    if (newQuantity < minQty) {
      newQuantity = minQty;
    }
    if (newQuantity > maxQty) {
      newQuantity = maxQty;
      console.warn('[CheckoutItem] Quantity limited to stock:', maxQty);
    }

    // Update local product data with new quantity and calculated total
    this.updateLocalProductData(newQuantity);

    console.log('[CheckoutItem] Quantity updated locally:', this.product.productName, newQuantity, 'Subtotal:', this.product.subTotal);
  }

  /**
   * Update local product data for immediate UI feedback
   * @param quantity - The new quantity
   */
  private updateLocalProductData(quantity: number) {
    if (!this.product) return;

    this.product.quantity = quantity;
    // Update subtotal as number, not string, for proper calculations
    this.product.subTotal = this.product.price * quantity;
  }



  /**
   * Get formatted subtotal for display
   */
  getFormattedSubTotal(): string {
    if (!this.product || !this.product.price || !this.product.quantity) {
      return '0.00';
    }
    const subtotal = this.product.price * this.product.quantity;
    return subtotal.toFixed(2);
  }

  /**
   * Get formatted unit price for display
   */
  getFormattedPrice(): string {
    if (!this.product || !this.product.price) {
      return '0.00';
    }
    return this.product.price.toFixed(2);
  }

  /**
   * Remove From Cart
   *
   * @param product
   */
  removeFromCart(product) {
    if (!product || !product.id) return;

    // Use CartService to remove item and automatically update navbar cart
    this.cartService.removeFromCart(product.id).then((success) => {
      if (success) {
        console.log('[CheckoutItem] removed from cart ->', product.productName);
        // CartService refresh will automatically trigger parent component updates
        // No need to emit cartRefresh event to prevent duplicate API calls
      }
    }).catch((error) => {
      console.error('[CheckoutItem] Failed to remove from cart:', error);
    });
  }

  /**
   * Toggle Wishlist
   *
   * @param product
   */
  toggleWishlist(product) {
    if (!product) return;

    const guestId = this.guestUserService.getGuestId();
    if (product.isInWishlist === true) {
      // Remove from wishlist - pass guestId as query parameter
      this.httpService.DELETE(`${WishlistController.RemoveFromWishlist(product.productId)}`).subscribe(() => {
        console.log('[CheckoutItem] removed from wishlist ->', product.productName);
        // Update local state only - no need to refresh cart data
        product.isInWishlist = false;
      }, err => {
        console.error('[CheckoutItem] remove wishlist error ->', err);
      });
    } else {
      // Add to wishlist
      const body = { productId: product.productId, guestId };
      this.httpService.POST(WishlistController.AddToWishlist, body).subscribe(() => {
        console.log('[CheckoutItem] added to wishlist ->', product.productName);
        // Update local state only - no need to refresh cart data
        product.isInWishlist = true;
      }, err => {
        console.error('[CheckoutItem] add to wishlist error ->', err);
      });
    }
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------
  ngOnInit(): void { }
}
