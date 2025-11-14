import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

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

  /**
   * Constructor
   *
   * @param {EcommerceService} _ecommerceService
   */
  constructor(
    private _ecommerceService: EcommerceService,
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

    this.httpService.DELETE(CartController.RemoveFromCart(product.id)).subscribe((res: any) => {
      if (res && res.succeeded) {
        // Refresh cart data or remove item from UI
        console.log('[CheckoutItem] removed from cart ->', product.productName);
        // Optionally emit event to parent to refresh cart
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
      this.httpService.DELETE(WishlistController.RemoveFromWishlist(product.productId)).subscribe(() => {
        product.isInWishlist = false;
      }, err => {
        console.error('[CheckoutItem] remove wishlist error ->', err);
      });
    } else {
      const body = { productId: product.productId, guestId };
      this.httpService.POST(WishlistController.AddToWishlist, body).subscribe(() => {
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
