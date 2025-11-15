import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { HttpService } from '@shared/services/http.service';
import { CartService } from '@shared/services/cart.service';
import { WishlistController } from '@shared/Controllers/WishlistController';
import { CartController } from '@shared/Controllers/CartController';
import { GuestUserService } from '@shared/services/guest-user.service';

@Component({
  selector: 'app-ecommerce-item',
  templateUrl: './ecommerce-item.component.html',
  styleUrls: ['./ecommerce-item.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ecommerce-application' }
})
export class EcommerceItemComponent implements OnInit {
  // Input Decorotor
  @Input() product;
  @Input() isWishlistOpen = false;

  // Public
  public isInCart = false;

  /**
   * Constructor
   */
  constructor(
    private _ecommerceService: EcommerceService,
    private httpService: HttpService,
    private guestUserService: GuestUserService,
    private cartService: CartService
  ) { }


  toggleWishlist(product) {
    if (!product) return;

    const guestId = this.guestUserService.getGuestId();
    if (product.isInWishlist === true) {
      const query = { guestId };
      this.httpService.DELETE(WishlistController.RemoveFromWishlist(product.id)).subscribe(() => {
        // Optimistic update
        product.isInWishlist = false;
      }, err => {
        console.error('[EcommerceItem] remove wishlist error ->', err);
      });
    } else {
      const body = { productId: product.id, guestId };
      this.httpService.POST(WishlistController.AddToWishlist, body).subscribe(() => {
        // Optimistic update
        product.isInWishlist = true;
      }, err => {
        console.error('[EcommerceItem] add to wishlist error ->', err);
      });
    }
  }

  /**
   * Add To Cart
   */
  addToCart(product) {
    if (!product) return;

    // Use CartService for better integration with navbar cart
    this.cartService.addToCart(product.id, 1, [])
      .then(() => {
        product.isInCart = true;
        console.log('[EcommerceItem] Item added to cart successfully');

        // Optional: Show success notification
        // You can add a toast notification here
      })
      .catch((error) => {
        console.error('[EcommerceItem] Failed to add item to cart:', error);

        // Optional: Show error notification
        // You can add a toast notification here
      });
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------
  ngOnInit(): void { }
}
