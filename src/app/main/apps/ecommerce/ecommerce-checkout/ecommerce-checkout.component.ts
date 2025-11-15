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
  public checkoutData: any = {}; // Full checkout response data
  public cartData: any = { items: [], total: 0 }; // CartDto structure
  public cartItems: any[] = []; // CartItemDto array
  public paginatedCartItems: any[] = []; // Current page items
  public currentPage: number = 1;
  public itemsPerPage: number = 4;
  public totalPages: number = 0;
  public Math = Math; // Make Math available in template

  // Coupon functionality
  public couponCode: string = '';
  public availableCoupons: any[] = [];
  public appliedCoupons: any[] = [];
  public isApplyingCoupon: boolean = false;

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
    private httpService: HttpService,
    private guestUserService: GuestUserService
  ) { }

  // Public Methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Get Cart Data from backend
   */
  getCartData() {
    this.httpService.GET(`${CartController.GetCartItems}`).subscribe((res: any) => {
      if (res && res.succeeded && res.data) {
        // Store the full checkout data
        this.checkoutData = res.data;

        // Extract cart data from the new structure
        this.cartData = res.data.cart || { items: [], total: 0 };

        // Extract available coupons
        this.availableCoupons = res.data.coupons || [];

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
        // Initialize empty state
        this.checkoutData = {};
        this.cartData = { items: [], total: 0 };
        this.cartItems = [];
        this.availableCoupons = [];
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

  /**
   * Handle cart refresh event from child components
   */
  onCartRefresh() {
    // Reload cart data from backend
    this.getCartData();
  }

  /**
   * Apply coupon code locally
   */
  applyCoupon() {
    if (!this.couponCode || this.couponCode.trim() === '') {
      return;
    }

    this.isApplyingCoupon = true;
    const trimmedCode = this.couponCode.trim().toUpperCase();

    // Find matching coupon in available coupons
    const selectedCoupon = this.availableCoupons.find(coupon =>
      coupon.code.toUpperCase() === trimmedCode
    );

    if (selectedCoupon) {
      // Apply the coupon locally
      this.checkoutData.appliedCoupon = selectedCoupon;
      this.calculateTotalsWithCoupon(selectedCoupon);
      this.couponCode = ''; // Clear input after successful application
      console.log('[EcommerceCheckout] coupon applied locally:', selectedCoupon);
    } else {
      console.warn('[EcommerceCheckout] coupon not found:', trimmedCode);
      // You could add a toast notification here for invalid coupon
    }

    this.isApplyingCoupon = false;
  }

  /**
   * Remove applied coupon locally
   */
  removeCoupon() {
    if (this.checkoutData.appliedCoupon) {
      this.checkoutData.appliedCoupon = null;
      this.calculateTotalsWithoutCoupon();
      console.log('[EcommerceCheckout] coupon removed locally');
    }
  }

  /**
   * Get coupon discount description
   */
  getCouponDescription(coupon: any): string {
    if (coupon.percentage) {
      return `${coupon.percentage}% off`;
    } else if (coupon.fixedAmount) {
      return `$${coupon.fixedAmount} off`;
    } else if (coupon.freeShipping) {
      return 'Free shipping';
    }
    return 'Discount';
  }

  /**
   * Calculate totals with applied coupon
   */
  calculateTotalsWithCoupon(coupon: any) {
    if (!this.checkoutData || !this.cartData) {
      return;
    }

    const originalSubTotal = this.cartData.total || 0;
    let discountAmount = 0;
    let freeShippingApplied = false;
    const originalShipping = this.checkoutData.shippingTotal || 10; // Default shipping cost

    // Calculate discount based on coupon type
    if (coupon.percentage) {
      discountAmount = (originalSubTotal * coupon.percentage) / 100;
    } else if (coupon.fixedAmount) {
      discountAmount = Math.min(coupon.fixedAmount, originalSubTotal);
    }

    // Check for free shipping
    if (coupon.freeShipping) {
      freeShippingApplied = true;
    }

    // Update checkout data
    this.checkoutData.subTotal = originalSubTotal;
    this.checkoutData.discountTotal = discountAmount;
    this.checkoutData.freeShippingApplied = freeShippingApplied;
    this.checkoutData.shippingTotal = freeShippingApplied ? 0 : originalShipping;
    this.checkoutData.total = originalSubTotal - discountAmount + this.checkoutData.shippingTotal;
  }

  /**
   * Calculate totals without coupon (reset to original)
   */
  calculateTotalsWithoutCoupon() {
    if (!this.checkoutData || !this.cartData) {
      return;
    }

    const originalSubTotal = this.cartData.total || 0;
    const originalShipping = 10; // Default shipping cost

    // Reset to original values
    this.checkoutData.subTotal = originalSubTotal;
    this.checkoutData.discountTotal = 0;
    this.checkoutData.freeShippingApplied = false;
    this.checkoutData.shippingTotal = originalShipping;
    this.checkoutData.total = originalSubTotal + originalShipping;
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Fetch cart data from backend
    this.getCartData();



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
