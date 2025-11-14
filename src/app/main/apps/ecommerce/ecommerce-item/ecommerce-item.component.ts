import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { HttpService } from '@shared/services/http.service';
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
   *
   * @param {EcommerceService} _ecommerceService
   */
  constructor(
    private _ecommerceService: EcommerceService,
    private httpService: HttpService,
    private guestUserService: GuestUserService
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
   *
   * @param product
   */
  addToCart(product) {
    if (!product) return;

    // Item component typically doesn't collect attribute selections here.
    // Send payload matching backend contract. Attributes = null when none selected.
    const body = {
      ProductId: product.id,
      Quantity: 1,
      Attributes: null
    };

    this.httpService.POST(CartController.AddToCart, body).subscribe((res: any) => {
      if (res && res.succeeded) {
        product.isInCart = true;
        console.log('[EcommerceItem] added to cart ->', res);
      }
    }, err => {
      console.error('[EcommerceItem] add to cart error ->', err);
    });
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------
  ngOnInit(): void { }
}
