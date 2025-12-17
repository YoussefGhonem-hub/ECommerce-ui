import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { HttpService } from '@shared/services/http.service';
import { CartService } from '@shared/services/cart.service';
import { SelectedAttributesService } from '@shared/services/selected-attributes.service';
import { CartController } from '@shared/Controllers/CartController';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-navbar-cart',
  templateUrl: './navbar-cart.component.html'
})
export class NavbarCartComponent implements OnInit, OnDestroy {
  // Public
  public cartItems: any[] = [];
  public cartData: any = { items: [], total: 0 };
  public cartListLength: number = 0;
  public cartTotal: number = 0;
  public Math = Math; // Make Math available in template
  baseUrl: any = environment.baseURL + '/';
  // Private
  private _unsubscribeAll: Subject<any>;

  /**
   * Constructor
   */
  constructor(
    public _ecommerceService: EcommerceService,
    private httpService: HttpService,
    private cartService: CartService,
    private selectedAttributesService: SelectedAttributesService
  ) {
    this._unsubscribeAll = new Subject();
  }

  // Public Methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Get Cart Data from backend
   */
  getCartData() {
    this.httpService.GET(`${CartController.GetCartItems}`).subscribe((res: any) => {
      if (res && res.succeeded && res.data) {
        // Store the cart data
        this.cartData = res.data.cart || { items: [], total: 0 };

        // Extract cart items and normalize them
        this.cartItems = (this.cartData.items || []).map((item: any) => {
          const normalizedItem = { ...item };
          normalizedItem.id = item.id || item.Id;
          normalizedItem.productId = item.productId || item.ProductId;
          normalizedItem.productName = item.productName || item.ProductName;
          normalizedItem.brand = item.brand || item.Brand;
          normalizedItem.mainImagePath = (item.mainImagePath || item.MainImagePath);
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

        this.cartListLength = this.cartItems.length;
        this.cartTotal = res.data.total || this.cartData.total || 0;

        console.log('[NavbarCart] Cart items loaded:', this.cartItems.length);
      } else {
        // Initialize empty state
        this.cartItems = [];
        this.cartData = { items: [], total: 0 };
        this.cartListLength = 0;
        this.cartTotal = 0;
      }
    }, err => {
      console.error('[NavbarCart] Error loading cart:', err);
      // Initialize empty state on error
      this.cartItems = [];
      this.cartListLength = 0;
      this.cartTotal = 0;
    });
  }

  /**
   * Remove From Cart
   */
  removeFromCart(item: any) {
    this.cartService.removeFromCart(item.id).then(() => {
      console.log('[NavbarCart] Item removed successfully');
      // Also remove selected attributes for this item
      this.selectedAttributesService.removeSelectedAttributes(item.id);
    }).catch((err) => {
      console.error('[NavbarCart] Failed to remove item:', err);
    });
  }

  /**
   * Update item quantity
   */
  getTotalPrice() {
    let total = 0;
    this.cartItems.forEach(item => {
      total += item.price * item.quantity;
    });
    return total;
  }
  updateQuantity(item: any, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeFromCart(item);
      return;
    }

    const updatePayload = {
      productId: item.productId,
      quantity: newQuantity,
      attributes: item.productAttributes || []
    };

    this.httpService.POST(CartController.AddToCart, updatePayload).subscribe((res: any) => {
      if (res && res.succeeded) {
        console.log('[NavbarCart] Item quantity updated successfully');
        // Refresh cart data after update
        this.getCartData();
      } else {
        console.error('[NavbarCart] Failed to update item quantity:', res.message);
      }
    }, err => {
      console.error('[NavbarCart] Error updating item quantity:', err);
    });
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Subscribe to cart data from CartService
    this.cartService.cartItems$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(items => {
        this.updateCartItemsWithSelectedAttributes(items);
        console.log('[NavbarCart] Cart items updated:', items.length);
      });

    this.cartService.cartCount$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(count => {
        this.cartListLength = count;
      });

    this.cartService.cartTotal$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(total => {
        this.cartTotal = total;
      });

    // Subscribe to selected attributes changes
    this.selectedAttributesService.attributesChanged$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => {
        // Re-merge cart items with updated selected attributes
        this.updateCartItemsWithSelectedAttributes(this.cartService.getCurrentCartItems());
        console.log('[NavbarCart] Selected attributes updated');
      });

    // CartService already loads cart data in constructor, no need for additional call here
    // this.cartService.refreshCart(); // Removed to prevent duplicate API calls
  }

  /**
   * Update cart items with selected attributes from the service
   */
  private updateCartItemsWithSelectedAttributes(items: any[]): void {
    this.cartItems = items.map(item => {
      // Check if user has selected attributes for this item in checkout
      const selectedAttrs = this.selectedAttributesService.getSelectedAttributes(item.id);

      if (selectedAttrs && selectedAttrs.length > 0) {
        // Use user-selected attributes from checkout
        return {
          ...item,
          productAttributes: selectedAttrs
        };
      } else {
        // Use backend attributes (already filtered by cart service)
        return item;
      }
    });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
