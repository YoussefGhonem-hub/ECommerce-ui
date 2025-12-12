import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';
import { ProductsController } from '@shared/Controllers/ProductsController';
import { WishlistController } from '@shared/Controllers/WishlistController';
import { CartController } from '@shared/Controllers/CartController';
import { GuestUserService } from '@shared/services/guest-user.service';
import { AuthenticationService } from 'app/auth/service/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class EcommerceService implements Resolve<any> {
  // Public
  public productList: Array<any>;
  public wishlist: Array<any>;
  public cartList: any[];
  public selectedProduct;
  public relatedProducts;

  public onProductListChange: BehaviorSubject<any>;
  public onRelatedProductsChange: BehaviorSubject<any>;
  public onWishlistChange: BehaviorSubject<any>;
  public onCartListChange: BehaviorSubject<any>;
  public onSelectedProductChange: BehaviorSubject<any>;

  // Private
  private idHandel;

  private sortRef = key => (a, b) => {
    const fieldA = a[key];
    const fieldB = b[key];

    let comparison = 0;
    if (fieldA > fieldB) {
      comparison = 1;
    } else if (fieldA < fieldB) {
      comparison = -1;
    }
    return comparison;
  };

  /**
   * Constructor
   *
   * @param {HttpClient} _httpClient
   */
  constructor(
    private _httpClient: HttpClient,
    private guestUserService: GuestUserService,
    private authService: AuthenticationService
  ) {
    this.onProductListChange = new BehaviorSubject({});
    this.onRelatedProductsChange = new BehaviorSubject({});
    this.onWishlistChange = new BehaviorSubject({});
    this.onCartListChange = new BehaviorSubject({});
    this.onSelectedProductChange = new BehaviorSubject({});
  }

  /**
   * Resolver
   *
   * @param {ActivatedRouteSnapshot} route
   * @param {RouterStateSnapshot} state
   * @returns {Observable<any> | Promise<any> | any}
   */
  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any> | Promise<any> | any {
    this.idHandel = route.params.id;

    return new Promise<void>((resolve, reject) => {
      // For checkout route, skip getCartList as CartService handles cart data
      const isCheckoutRoute = state.url.includes('/checkout');
      const promises = isCheckoutRoute
        ? [this.getProducts(), this.getWishlist(), this.getSelectedProduct()]
        : [this.getProducts(), this.getWishlist(), this.getCartList(), this.getSelectedProduct()];

      Promise.all(promises).then(() => {
        resolve();
      }, reject);
    });
  }

  /**
   * Get Products
   */
  getProducts(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this._httpClient.get(ProductsController.GetProducts).subscribe((response: any) => {
        this.productList = response.data || response;
        this.sortProduct('featured'); // Default shorting
        resolve(this.productList);
      }, reject);
    });
  }

  /**
   * Get Wishlist
   */
  getWishlist(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Add guestId as query parameter if user is not authenticated
      const currentUser = this.authService.currentUserValue;
      let url = WishlistController.GetWishlistItems;

      if (!currentUser) {
        const guestId = this.guestUserService.getGuestId();
        url = `${url}?guestId=${guestId}`;
      }

      this._httpClient.get(url).subscribe((response: any) => {
        this.wishlist = response.data || response || [];
        this.onWishlistChange.next(this.wishlist);
        resolve(this.wishlist);
      }, reject);
    });
  }

  /**
   * Get CartList
   */
  getCartList(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // Add guestId as query parameter if user is not authenticated
      const currentUser = this.authService.currentUserValue;
      let url = CartController.GetCartItems;

      if (!currentUser) {
        const guestId = this.guestUserService.getGuestId();
        url = `${url}?guestId=${guestId}`;
      }

      this._httpClient.get(url).subscribe((response: any) => {
        this.cartList = response.data || response || [];

        this.onCartListChange.next(this.cartList);
        resolve(this.cartList);
      }, reject);
    });
  }

  /**
   * Get Selected Product
   */
  getSelectedProduct(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.idHandel) {
        resolve(null);
        return;
      }
      this._httpClient.get(ProductsController.GetProductId(this.idHandel)).subscribe((response: any) => {
        this.selectedProduct = response.data || response;
        this.onSelectedProductChange.next(this.selectedProduct);
        resolve(this.selectedProduct);
      }, reject);
    });
  }

  /**
   * Get Related Products
   */
  getRelatedProducts(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      // For now, return empty array or subset of products
      // You can implement related products logic on backend later
      this.relatedProducts = [];
      this.onRelatedProductsChange.next(this.relatedProducts);
      resolve(this.relatedProducts);
    });
  }

  /**
   * Sort Product
   *
   * @param sortBy
   */
  sortProduct(sortBy) {
    let sortDesc = false;

    const sortByKey = (() => {
      if (sortBy === 'price-desc') {
        sortDesc = true;
        return 'price';
      }
      if (sortBy === 'price-asc') {
        return 'price';
      }
      sortDesc = true;
      return 'id';
    })();

    // const sortedData = this.productList?.sort(this.sortRef(sortByKey));
    // if (sortDesc) sortedData.reverse();
    // this.productList = sortedData;
    this.onProductListChange.next(this.productList);
  }

  /**
   * Add In Wishlist
   *
   * @param id
   */
  addToWishlist(id) {
    return new Promise<void>((resolve, reject) => {
      const lengthRef = this.wishlist.length + 1;
      const wishRef = { id: lengthRef, productId: id };

      this._httpClient.post('api/ecommerce-userWishlist/' + lengthRef, { ...wishRef }).subscribe(response => {
        this.getWishlist();
        resolve();
      }, reject);
    });
  }

  /**
   * Remove From Wishlist
   *
   * @param id
   */
  removeFromWishlist(id) {
    const indexRef = this.wishlist.findIndex(wishlistRef => wishlistRef.productId === id); // Get the index ref
    const indexId = this.wishlist[indexRef].id; // Get the product wishlist id from indexRef
    return new Promise<void>((resolve, reject) => {
      this._httpClient.delete('api/ecommerce-userWishlist/' + indexId).subscribe((response: any) => {
        this.getWishlist();
        resolve();
      }, reject);
    });
  }

  /**
   * Add In Cart
   *
   * @param id
   */


  /**
   * Remove From Cart
   *
   * @param id
   */
  removeFromCart(id) {
    const indexRef = this.cartList.findIndex(cartListRef => cartListRef.productId === id); // Get the index ref
    const indexId = this.cartList[indexRef].id; // Get the product wishlist id from indexRef

    return new Promise<void>((resolve, reject) => {
      this._httpClient.delete('api/ecommerce-userCart/' + indexId).subscribe((response: any) => {
        this.getCartList();
        resolve();
      }, reject);
    });
  }
}
