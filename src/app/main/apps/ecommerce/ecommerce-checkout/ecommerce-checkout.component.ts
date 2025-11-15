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
      console.log('[EcommerceCheckout] Applying coupon locally:', selectedCoupon.code);

      // Store original values before applying coupon
      if (!this.checkoutData.originalSubTotal) {
        this.checkoutData.originalSubTotal = this.checkoutData.subTotal || this.cartData.total || 0;
        this.checkoutData.originalShippingTotal = this.checkoutData.shippingTotal || 10;
        this.checkoutData.originalDiscountTotal = this.checkoutData.discountTotal || 0;
        this.checkoutData.originalTotal = this.checkoutData.total || ((this.checkoutData.subTotal || 0) + (this.checkoutData.shippingTotal || 0));
        this.checkoutData.originalFreeShippingApplied = this.checkoutData.freeShippingApplied || false;
      }

      // Apply the coupon
      this.checkoutData.appliedCoupon = selectedCoupon;
      this.calculateTotalsWithCoupon(selectedCoupon);

      this.couponCode = ''; // Clear input after successful application
      console.log('[EcommerceCheckout] Coupon applied locally with stored originals');
    } else {
      console.warn('[EcommerceCheckout] coupon not found:', trimmedCode);
      // You could add a toast notification here for invalid coupon
    }

    this.isApplyingCoupon = false;
  }  /**
   * Remove applied coupon and restore original values
   */
  removeCoupon() {
    if (this.checkoutData.appliedCoupon) {
      console.log('[EcommerceCheckout] Removing coupon and restoring original values:', this.checkoutData.appliedCoupon.code);

      // Restore original values if they were stored
      if (this.checkoutData.originalSubTotal !== undefined) {
        this.checkoutData.subTotal = this.checkoutData.originalSubTotal;
        this.checkoutData.shippingTotal = this.checkoutData.originalShippingTotal;
        this.checkoutData.discountTotal = this.checkoutData.originalDiscountTotal;
        this.checkoutData.total = this.checkoutData.originalTotal;
        this.checkoutData.freeShippingApplied = this.checkoutData.originalFreeShippingApplied;

        // Clear stored original values
        delete this.checkoutData.originalSubTotal;
        delete this.checkoutData.originalShippingTotal;
        delete this.checkoutData.originalDiscountTotal;
        delete this.checkoutData.originalTotal;
        delete this.checkoutData.originalFreeShippingApplied;

        console.log('[EcommerceCheckout] Original values restored:', {
          subTotal: this.checkoutData.subTotal,
          shippingTotal: this.checkoutData.shippingTotal,
          discountTotal: this.checkoutData.discountTotal,
          total: this.checkoutData.total,
          freeShipping: this.checkoutData.freeShippingApplied
        });
      }

      // Clear applied coupon
      this.checkoutData.appliedCoupon = null;

      console.log('[EcommerceCheckout] Coupon removed, original values restored');
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

    // Use the cart data total as the base subtotal
    const originalSubTotal = this.cartData.total || 0;
    let discountAmount = 0;
    let freeShippingApplied = false;

    // Store original values if not already stored - use backend data if available
    if (!this.checkoutData.originalSubTotal) {
      this.checkoutData.originalSubTotal = originalSubTotal;
      // Use shipping from backend data or default to 10
      this.checkoutData.originalShippingTotal = this.checkoutData.shippingTotal || 10;
      // Store the original total from backend
      this.checkoutData.originalTotal = this.checkoutData.total || (originalSubTotal + (this.checkoutData.shippingTotal || 10));
    }

    const originalShipping = this.checkoutData.originalShippingTotal;

    // Calculate discount based on coupon type with proper validation
    if (coupon.percentage && coupon.percentage > 0) {
      // Percentage discount: ensure it's between 0-100%
      const validPercentage = Math.min(Math.max(coupon.percentage, 0), 100);
      discountAmount = Number(((originalSubTotal * validPercentage) / 100).toFixed(2));
    } else if (coupon.fixedAmount && coupon.fixedAmount > 0) {
      // Fixed amount discount: cannot exceed subtotal
      discountAmount = Number(Math.min(coupon.fixedAmount, originalSubTotal).toFixed(2));
    }

    // Check for free shipping
    if (coupon.freeShipping === true) {
      freeShippingApplied = true;
    }

    // Update checkout data with calculated values
    this.checkoutData.subTotal = originalSubTotal;
    this.checkoutData.discountTotal = discountAmount;
    this.checkoutData.freeShippingApplied = freeShippingApplied;
    this.checkoutData.shippingTotal = freeShippingApplied ? 0 : originalShipping;
    this.checkoutData.total = Number((originalSubTotal - discountAmount + this.checkoutData.shippingTotal).toFixed(2));

    console.log('[Coupon Applied]', {
      coupon: coupon.code,
      originalSubTotal,
      discountAmount,
      freeShipping: freeShippingApplied,
      finalTotal: this.checkoutData.total,
      originalValues: {
        subTotal: this.checkoutData.originalSubTotal,
        shipping: this.checkoutData.originalShippingTotal,
        total: this.checkoutData.originalTotal
      }
    });
  }  /**
   * Calculate totals without coupon (reset to original)
   */
  calculateTotalsWithoutCoupon() {
    if (!this.checkoutData || !this.cartData) {
      return;
    }

    // Get the stored original values or fallback to current cart data
    const originalSubTotal = this.checkoutData.originalSubTotal || this.cartData.total || 0;
    const originalShipping = this.checkoutData.originalShippingTotal || 10;
    const originalTotal = this.checkoutData.originalTotal || (originalSubTotal + originalShipping);

    console.log('[Coupon Removal] Before reset:', {
      currentSubTotal: this.checkoutData.subTotal,
      currentDiscount: this.checkoutData.discountTotal,
      currentShipping: this.checkoutData.shippingTotal,
      currentTotal: this.checkoutData.total,
      storedOriginals: {
        subTotal: this.checkoutData.originalSubTotal,
        shipping: this.checkoutData.originalShippingTotal,
        total: this.checkoutData.originalTotal
      }
    });

    // Reset to exact original values
    this.checkoutData.subTotal = originalSubTotal;
    this.checkoutData.discountTotal = 0;
    this.checkoutData.freeShippingApplied = false;
    this.checkoutData.shippingTotal = originalShipping;
    // Calculate total properly: subtotal + shipping (no discount)
    this.checkoutData.total = Number((originalSubTotal + originalShipping).toFixed(2));

    // Clear stored original values
    delete this.checkoutData.originalSubTotal;
    delete this.checkoutData.originalShippingTotal;
    delete this.checkoutData.originalTotal;

    console.log('[Coupon Removed] After reset:', {
      restoredSubTotal: this.checkoutData.subTotal,
      restoredShipping: this.checkoutData.shippingTotal,
      restoredTotal: this.checkoutData.total,
      calculation: `${originalSubTotal} + ${originalShipping} = ${this.checkoutData.total}`
    });
  }  // Lifecycle Hooks
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
