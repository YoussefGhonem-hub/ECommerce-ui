import { Component, OnInit, ViewEncapsulation } from '@angular/core';

import Stepper from 'bs-stepper';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { HttpService } from '@shared/services/http.service';
import { CartController } from '@shared/Controllers/CartController';
import { GuestUserService } from '@shared/services/guest-user.service';

@Component({
  selector: 'app-ecommerce-checkout',
  templateUrl: './ecommerce-checkout.component.html',
  styleUrls: ['./ecommerce-checkout.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ecommerce-application' }
})
export class EcommerceCheckoutComponent implements OnInit {
  // Public
  public contentHeader: object;
  public products;
  public cartLists;
  public wishlist;
  public cartData: any = { items: [], total: 0 }; // CartDto structure
  public cartItems: any[] = []; // CartItemDto array
  public paginatedCartItems: any[] = []; // Current page items
  public currentPage: number = 1;
  public itemsPerPage: number = 4;
  public totalPages: number = 0;
  public Math = Math; // Make Math available in template

  public address = {
    fullNameVar: '',
    numberVar: '',
    flatVar: '',
    landmarkVar: '',
    cityVar: '',
    pincodeVar: '',
    stateVar: ''
  };

  // Private
  private checkoutStepper: Stepper;

  /**
   *  Constructor
   *
   * @param {EcommerceService} _ecommerceService
   */
  constructor(
    private _ecommerceService: EcommerceService,
    private httpService: HttpService,
    private guestUserService: GuestUserService
  ) { }

  // Public Methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Get Cart Data from backend
   */
  getCartData() {
    const guestId = this.guestUserService.getGuestId();

    this.httpService.GET(`${CartController.GetCartItems}`).subscribe((res: any) => {
      if (res && res.succeeded && res.data && Array.isArray(res.data)) {
        // API returns array of CartDto, get the first one (user's cart)
        const firstCart = res.data[0];
        if (firstCart) {
          this.cartData = firstCart;
          // Normalize CartItemDto properties to camelCase for UI consistency
          this.cartItems = (this.cartData.items || []).map((item: any) => {
            const normalizedItem = { ...item };
            normalizedItem.id = item.id || item.Id;
            normalizedItem.productId = item.productId || item.ProductId;
            normalizedItem.productName = item.productName || item.ProductName;
            normalizedItem.brand = item.brand || item.Brand;
            normalizedItem.categoryNameEn = item.categoryNameEn || item.CategoryNameEn;
            normalizedItem.categoryNameAr = item.categoryNameAr || item.CategoryNameAr;
            normalizedItem.mainImagePath = item.mainImagePath || item.MainImagePath;
            normalizedItem.averageRating = item.averageRating || item.AverageRating || 0;
            normalizedItem.isInWishlist = (item.isInWishlist !== undefined) ? item.isInWishlist : (item.IsInWishlist !== undefined ? item.IsInWishlist : false);
            normalizedItem.isInCart = (item.isInCart !== undefined) ? item.isInCart : (item.IsInCart !== undefined ? item.IsInCart : true);
            normalizedItem.price = item.price || item.Price || 0;
            normalizedItem.stockQuantity = item.stockQuantity || item.StockQuantity || 0;
            normalizedItem.quantity = item.quantity || item.Quantity || 0;
            normalizedItem.subTotal = item.subTotal || item.SubTotal || (normalizedItem.price * normalizedItem.quantity);
            normalizedItem.selectedAttributes = item.selectedAttributes || item.SelectedAttributes || [];
            return normalizedItem;
          });
          // Update pagination after loading cart items
          this.updatePagination();
        } else {
          // No cart found, initialize empty
          this.cartData = { items: [], total: 0 };
          this.cartItems = [];
          this.updatePagination();
        }
      } else {
        // Handle case where data is not an array (fallback to original structure)
        this.cartData = res.data || { items: [], total: 0 };
        this.cartItems = (this.cartData.items || []).map((item: any) => {
          const normalizedItem = { ...item };
          normalizedItem.id = item.id || item.Id;
          normalizedItem.productId = item.productId || item.ProductId;
          normalizedItem.productName = item.productName || item.ProductName;
          normalizedItem.brand = item.brand || item.Brand;
          normalizedItem.categoryNameEn = item.categoryNameEn || item.CategoryNameEn;
          normalizedItem.categoryNameAr = item.categoryNameAr || item.CategoryNameAr;
          normalizedItem.mainImagePath = item.mainImagePath || item.MainImagePath;
          normalizedItem.averageRating = item.averageRating || item.AverageRating || 0;
          normalizedItem.isInWishlist = (item.isInWishlist !== undefined) ? item.isInWishlist : (item.IsInWishlist !== undefined ? item.IsInWishlist : false);
          normalizedItem.isInCart = (item.isInCart !== undefined) ? item.isInCart : (item.IsInCart !== undefined ? item.IsInCart : true);
          normalizedItem.price = item.price || item.Price || 0;
          normalizedItem.stockQuantity = item.stockQuantity || item.StockQuantity || 0;
          normalizedItem.quantity = item.quantity || item.Quantity || 0;
          normalizedItem.subTotal = item.subTotal || item.SubTotal || (normalizedItem.price * normalizedItem.quantity);
          normalizedItem.selectedAttributes = item.selectedAttributes || item.SelectedAttributes || [];
          return normalizedItem;
        });
        // Update pagination after loading cart items
        this.updatePagination();
      }
    }, err => {
      console.error('[EcommerceCheckout] cart fetch error ->', err);
    });
  }

  /**
   * Stepper Next
   */
  nextStep() {
    this.checkoutStepper.next();
  }
  /**
   * Stepper Previous
   */
  previousStep() {
    this.checkoutStepper.previous();
  }

  /**
   * Validate Next Step
   *
   * @param addressForm
   */
  validateNextStep(addressForm) {
    if (addressForm.valid) {
      this.nextStep();
    }
  }

  /**
   * Update pagination when cart items change
   */
  updatePagination() {
    this.totalPages = Math.ceil(this.cartItems.length / this.itemsPerPage);
    this.updatePaginatedItems();
  }

  /**
   * Update items for current page
   */
  updatePaginatedItems() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCartItems = this.cartItems.slice(startIndex, endIndex);
  }

  /**
   * Go to specific page
   */
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedItems();
    }
  }

  /**
   * Go to next page
   */
  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePaginatedItems();
    }
  }

  /**
   * Go to previous page
   */
  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedItems();
    }
  }

  /**
   * Get array of page numbers for pagination
   */
  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Fetch cart data from backend
    this.getCartData();

    // Subscribe to ProductList change (keep for compatibility)
    this._ecommerceService.onProductListChange.subscribe(res => {
      this.products = res;
      if (this.products) {
        this.products.isInWishlist = false;
      }
    });

    // Subscribe to Cartlist change (keep for compatibility)
    this._ecommerceService.onCartListChange.subscribe(res => (this.cartLists = res));

    // Subscribe to Wishlist change (keep for compatibility)
    this._ecommerceService.onWishlistChange.subscribe(res => (this.wishlist = res));

    // update product is in Wishlist & is in CartList : Boolean (keep for compatibility)
    if (this.products && this.wishlist && this.cartLists) {
      this.products.forEach(product => {
        product.isInWishlist = this.wishlist.findIndex(p => p.productId === product.id) > -1;
        product.isInCart = this.cartLists.findIndex(p => p.productId === product.id) > -1;
      });
    }

    this.checkoutStepper = new Stepper(document.querySelector('#checkoutStepper'), {
      linear: false,
      animation: true
    });

    // content header
    this.contentHeader = {
      headerTitle: 'Checkout',
      actionButton: true,
      breadcrumb: {
        type: '',
        links: [
          {
            name: 'Home',
            isLink: true,
            link: '/'
          },
          {
            name: 'eCommerce',
            isLink: true,
            link: '/'
          },
          {
            name: 'Checkout',
            isLink: false
          }
        ]
      }
    };
  }
}
