import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SwiperConfigInterface } from 'ngx-swiper-wrapper';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { ProductsController } from '@shared/Controllers/ProductsController';
import { WishlistController } from '@shared/Controllers/WishlistController';
import { CartController } from '@shared/Controllers/CartController';
import { CartService } from '@shared/services/cart.service';
import { GuestUserService } from '@shared/services/guest-user.service';
import { HttpService } from '@shared/services/http.service';
@Component({
  selector: 'app-ecommerce-details',
  templateUrl: './ecommerce-details.component.html',
  styleUrls: ['./ecommerce-details.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ecommerce-application' }
})
export class EcommerceDetailsComponent implements OnInit {
  // public
  public contentHeader: object;
  public product;
  public wishlist;
  public cartList;
  productId: any;
  public relatedProducts;
  public groupedAttributes: { [key: string]: any[] } = {}; // Grouped attributes by name
  public productAttributes: { [key: string]: string } = {}; // Track selected values
  public colorMap: { [key: string]: string } = {}; // Map color names to hex values or CSS classes

  // Color mapping for common color names
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
  public swiperResponsive: SwiperConfigInterface = {
    slidesPerView: 3,
    spaceBetween: 50,
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev'
    },
    breakpoints: {
      1024: {
        slidesPerView: 3,
        spaceBetween: 40
      },
      768: {
        slidesPerView: 3,
        spaceBetween: 30
      },
      640: {
        slidesPerView: 2,
        spaceBetween: 20
      },
      320: {
        slidesPerView: 1,
        spaceBetween: 10
      }
    }
  };

  constructor(
    private _activatedRoute: ActivatedRoute,
    private HttpService: HttpService,
    private guestUserService: GuestUserService,
    private _ecommerceService: EcommerceService,
    private cartService: CartService
  ) {
    this._activatedRoute.params.subscribe(params => {
      this.productId = params['id'];
    });
  }

  toggleWishlist(product) {
    if (!product) return;

    const guestId = this.guestUserService.getGuestId();

    // If already in wishlist -> remove
    if (product.isInWishlist === true) {
      // Backend: DELETE api/wishlist/{productId}?guestId=...
      const query = { guestId };
      this.HttpService.DELETE(WishlistController.RemoveFromWishlist(product.id)).subscribe((res: any) => {
        // On success mark as removed
        product.isInWishlist = false;
      }, err => {
        console.error('[EcommerceDetails] remove wishlist error ->', err);
      });
    } else {
      // Add to wishlist
      const body = { productId: product.id, guestId };
      this.HttpService.POST(WishlistController.AddToWishlist, body).subscribe((res: any) => {
        product.isInWishlist = true;
      }, err => {
        console.error('[EcommerceDetails] add to wishlist error ->', err);
      });
    }
  }


  getProductId() {
    this.HttpService.GET(ProductsController.GetProductId(this.productId)).subscribe((res: any) => {
      this.product = res.data;
      // Normalize IsInCart / IsInWishlist coming from API (PascalCase) to camelCase used in templates
      if (this.product) {
        this.product.isInCart = (this.product.isInCart !== undefined) ? this.product.isInCart : (this.product.IsInCart !== undefined ? this.product.IsInCart : false);
        this.product.isInWishlist = (this.product.isInWishlist !== undefined) ? this.product.isInWishlist : (this.product.IsInWishlist !== undefined ? this.product.IsInWishlist : false);
      }
      // Group attributes by name
      if (this.product?.attributes && this.product.attributes.length > 0) {
        this.groupAttributesByName();
      }
      // Related products normalization (map PascalCase names to camelCase and expected fields)
      this.relatedProducts = (res.data?.relatedProducts || []).map((p: any) => {
        const rp: any = { ...p };
        rp.id = rp.id || rp.Id || rp.ID;
        rp.nameEn = rp.nameEn || rp.NameEn || rp.name || '';
        rp.nameAr = rp.nameAr || rp.NameAr || '';
        rp.price = rp.price || rp.Price || 0;
        rp.brand = rp.brand || rp.Brand || '';
        rp.mainImagePath = rp.mainImagePath || rp.mainImagePath || rp.mainImage || rp.image || '';
        rp.averageRating = rp.averageRating || rp.AverageRating || rp.averageRating || rp.rating || 0;
        rp.isInCart = (rp.isInCart !== undefined) ? rp.isInCart : (rp.IsInCart !== undefined ? rp.IsInCart : false);
        rp.isInWishlist = (rp.isInWishlist !== undefined) ? rp.isInWishlist : (rp.IsInWishlist !== undefined ? rp.IsInWishlist : false);
        return rp;
      });
    });
  }

  /**
   * Group attributes by attributeName
   */
  groupAttributesByName(): void {
    this.groupedAttributes = {};
    this.productAttributes = {};
    this.colorMap = {};

    if (!this.product.attributes || this.product.attributes.length === 0) {
      return;
    }

    // Group by attributeName
    this.product.attributes.forEach((attr: any) => {
      const attrName = attr.attributeName;
      if (!this.groupedAttributes[attrName]) {
        this.groupedAttributes[attrName] = [];
      }
      this.groupedAttributes[attrName].push(attr);

      // Set first value as default selected
      if (!this.productAttributes[attrName]) {
        this.productAttributes[attrName] = attr.value;
      }

      // Build color map for Color attribute
      if (attrName.toLowerCase() === 'color') {
        this.colorMap[attr.value] = this.getColorHex(attr.value);
      }
    });
  }

  /**
   * Get hex color value for a color name
   * Falls back to generating a color from the string if not found in palette
   */
  getColorHex(colorName: string): string {
    // Check if color exists in predefined palette (case-insensitive)
    const normalizedColor = Object.keys(this.COLOR_PALETTE).find(
      key => key.toLowerCase() === colorName.toLowerCase()
    );

    if (normalizedColor) {
      return this.COLOR_PALETTE[normalizedColor];
    }

    // If color starts with # or is a valid hex, return it
    if (colorName.startsWith('#') || /^[0-9A-F]{6}$/i.test(colorName)) {
      return colorName;
    }

    // Fallback: Generate a color from the string hash
    return this.stringToColor(colorName);
  }

  /**
   * Generate a color from a string (used as fallback)
   */
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

  /**
   * Handle attribute selection
   */
  selectAttribute(attributeName: string, value: string): void {
    this.productAttributes[attributeName] = value;
  }

  /**
   * Add to cart. If `quickAdd` is true (used for related products), send Attributes = null.
   */
  addToCart(product, quickAdd: boolean = false) {
    if (!product) return;

    let attributes = [];
    if (!quickAdd) {
      // Build selected attributes array from productAttributes object
      attributes = Object.entries(this.productAttributes).map(([name, value]) => {
        const attrGroup = this.groupedAttributes[name] || [];
        const attrObj = attrGroup.find(a => a.value === value);

        return {
          AttributeId: attrObj?.attributeId || attrObj?.id,
          ValueId: attrObj?.valueId || attrObj?.id || null
        };
      });
    }

    // Use CartService for better integration with navbar cart
    this.cartService.addToCart(product.id, 1, attributes)
      .then(() => {
        product.isInCart = true;
        console.log('[EcommerceDetails] Item added to cart successfully');

        // Optional: Show success notification
        // You can add a toast notification here
      })
      .catch((error) => {
        console.error('[EcommerceDetails] Failed to add item to cart:', error);

        // Optional: Show error notification
        // You can add a toast notification here
      });
  }

  ngOnInit(): void {
    this.getProductId();
    this.contentHeaderMethod();
  }

  /**
   * Return the current product URL for sharing
   */
  getShareUrl(): string {
    try {
      return window.location.href;
    } catch (e) {
      return '';
    }
  }

  /**
   * Share product to social platforms or open link
   */
  shareTo(platform: string): void {
    const shareUrl = encodeURIComponent(this.getShareUrl());
    const title = encodeURIComponent(this.product?.nameEn || this.product?.name || '');
    const text = encodeURIComponent(this.product?.descriptionEn || '');

    // Construct platform-specific URL
    let url = '';
    switch ((platform || '').toLowerCase()) {
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${shareUrl}&text=${title}`;
        break;
      case 'youtube':
      case 'instagram':
        // These platforms don't have simple share endpoints for arbitrary links — open the product page instead
        url = this.getShareUrl();
        break;
      default:
        url = this.getShareUrl();
    }

    // Prefer Web Share API when available for native-like sharing
    const nav: any = (navigator as any);
    if (nav && typeof nav.share === 'function') {
      nav.share({ title: this.product?.nameEn || '', text: this.product?.descriptionEn || '', url: this.getShareUrl() })
        .catch(() => {
          // Fallback to opening the constructed URL
          if (url) { window.open(url, '_blank', 'noopener'); }
        });
    } else {
      if (url) { window.open(url, '_blank', 'noopener'); }
    }
  }

  /**
   * Copy current product link to clipboard
   */
  copyLink(): void {
    const link = this.getShareUrl();
    if (!link) return;
    const nav: any = (navigator as any);
    if (nav && typeof nav.clipboard !== 'undefined' && typeof nav.clipboard.writeText === 'function') {
      nav.clipboard.writeText(link).then(() => {
        // minimal UX: alert; in real app replace with toast
        alert('Product link copied to clipboard');
      }).catch(() => {
        this.fallbackCopy(link);
      });
    } else {
      this.fallbackCopy(link);
    }
  }

  /**
   * Fallback clipboard copy using temporary input
   */
  private fallbackCopy(text: string) {
    try {
      const input = document.createElement('input');
      input.style.position = 'fixed';
      input.style.left = '-1000px';
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      alert('Product link copied to clipboard');
    } catch (e) {
      console.error('[EcommerceDetails] copy fallback failed', e);
      alert('Could not copy link. Please copy it from the address bar.');
    }
  }

  contentHeaderMethod() {
    this.contentHeader = {
      headerTitle: 'Product Details',
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
            name: 'Shop',
            isLink: true,
            link: '/'
          },
          {
            name: 'Details',
            isLink: false
          }
        ]
      }
    };
  }
}
