import { Component, Input, OnInit, ViewEncapsulation, Output, EventEmitter } from '@angular/core';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { HttpService } from '@shared/services/http.service';
import { CartController } from '@shared/Controllers/CartController';
import { WishlistController } from '@shared/Controllers/WishlistController';
import { GuestUserService } from '@shared/services/guest-user.service';

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
    private guestUserService: GuestUserService
  ) { }

  /**
   * Remove From Cart
   *
   * @param product
   */
  removeFromCart(product) {
    if (!product || !product.id) return;

    // Use the cart item ID (not product ID) for removal
    this.httpService.DELETE(CartController.RemoveFromCart(product.id)).subscribe((res: any) => {
      if (res && res.succeeded) {
        console.log('[CheckoutItem] removed from cart ->', product.productName);
        // Emit event to parent to refresh cart data
        this.cartRefresh.emit();
      }
    }, err => {
      console.error('[CheckoutItem] remove from cart error ->', err);
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
        // Emit event to parent to refresh cart data (API response will contain updated isInWishlist)
        this.cartRefresh.emit();
      }, err => {
        console.error('[CheckoutItem] remove wishlist error ->', err);
      });
    } else {
      // Add to wishlist
      const body = { productId: product.productId, guestId };
      this.httpService.POST(WishlistController.AddToWishlist, body).subscribe(() => {
        console.log('[CheckoutItem] added to wishlist ->', product.productName);
        // Emit event to parent to refresh cart data (API response will contain updated isInWishlist)
        this.cartRefresh.emit();
      }, err => {
        console.error('[CheckoutItem] add to wishlist error ->', err);
      });
    }
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------
  ngOnInit(): void { }
}
