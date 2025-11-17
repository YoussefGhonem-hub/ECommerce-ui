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
  styleUrls: ['./ecommerce-checkout-item.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class EcommerceCheckoutItemComponent implements OnInit {
  // Input Decorator
  @Input() product;

  @Output() cartRefresh = new EventEmitter<void>();
  @Output() quantityUpdated = new EventEmitter<{ item: any, newQuantity: number, newSubTotal: number }>();

  public groupedAttributes: { [key: string]: any[] } = {};
  public productAttributes: { [key: string]: string } = {};
  public colorMap: { [key: string]: string } = {};
  private readonly COLOR_PALETTE: { [key: string]: string } = {
    'Red': '#dc3545',
    'Blue': '#007bff',
    'Green': '#28a745',
    'Yellow': '#ffc107',
    'Black': '#000000',
    'White': '#ffffff',
    'Gray': '#6c757d',
    'Grey': '#6c757d',
    'Orange': '#fd7e14',
    'Purple': '#6f42c1',
    'Pink': '#e83e8c',
    'Brown': '#6f4e37',
    'Navy': '#003366',
    'Teal': '#20c997',
    'Cyan': '#17a2b8',
    'Beige': '#f5f5dc',
    'Cream': '#fffdd0',
    'Silver': '#c0c0c0',
    'Gold': '#ffd700',
    'Maroon': '#800000'
  };

  constructor(
    private httpService: HttpService,
    private guestUserService: GuestUserService,
    private cartService: CartService
  ) { }

  ngOnInit(): void {
    this.initAttributes();
  }

  private initAttributes() {
    debugger
    if (!this.product || !this.product.productAttributes) {
      this.groupedAttributes = {};
      this.productAttributes = {};
      this.colorMap = {};
      return;
    }
    // Group by attributeName
    this.groupedAttributes = {};
    this.productAttributes = {};
    this.colorMap = {};
    this.product.productAttributes?.forEach((attr: any) => {
      debugger
      const attrName = attr.attributeName;
      if (!this.groupedAttributes[attrName]) {
        this.groupedAttributes[attrName] = [];
      }
      this.groupedAttributes[attrName].push(attr);
      // Set selected from product.productAttributes if available, else default to first
      if (this.product.productAttributes) {
        const selected = this.product.productAttributes.find((a: any) => a.attributeName === attrName);
        if (selected) {
          this.productAttributes[attrName] = selected.value;
        }
      }
      if (!this.productAttributes[attrName]) {
        this.productAttributes[attrName] = attr.value;
      }
      // Build color map for Color attribute
      if (attrName.toLowerCase() === 'color') {
        this.colorMap[attr.value] = this.getColorHex(attr.value);
      }
    });
  }

  getColorHex(colorName: string): string {
    const normalizedColor = Object.keys(this.COLOR_PALETTE).find(
      key => key.toLowerCase() === colorName.toLowerCase()
    );
    if (normalizedColor) {
      return this.COLOR_PALETTE[normalizedColor];
    }
    if (colorName.startsWith('#') || /^[0-9A-F]{6}$/i.test(colorName)) {
      return colorName;
    }
    return this.stringToColor(colorName);
  }

  private stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 255;
      color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
  }

  selectAttribute(attributeName: string, value: string): void {
    this.productAttributes[attributeName] = value;
    // Update product.productAttributes for checkout submission
    if (!this.product.productAttributes) {
      this.product.productAttributes = [];
    }
    // Find the attribute object for the selected value
    const attrGroup = this.groupedAttributes[attributeName] || [];
    const attrObj = attrGroup.find(a => a.value === value);
    if (!attrObj) return;

    // Remove any existing productAttributes with the same attributeId
    this.product.productAttributes = this.product.productAttributes.filter((a: any) => a.attributeId !== attrObj.attributeId);

    // Add the new selected attribute
    this.product.productAttributes.push({
      attributeId: attrObj.attributeId || attrObj.id,
      attributeName: attributeName,
      valueId: attrObj.valueId || attrObj.id || null,
      value: value
    });
  }

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

    // Emit the quantity change event to parent component for price details update
    this.quantityUpdated.emit({
      item: this.product,
      newQuantity: newQuantity,
      newSubTotal: this.product.subTotal
    });

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
  // ngOnInit handled above
}
