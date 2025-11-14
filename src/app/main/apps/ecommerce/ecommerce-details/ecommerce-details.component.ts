import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SwiperConfigInterface } from 'ngx-swiper-wrapper';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { ProductsController } from '@shared/Controllers/ProductsController';
import { WishlistController } from '@shared/Controllers/WishlistController';
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
  public selectedAttributes: { [key: string]: string } = {}; // Track selected values
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
    private guestUserService: GuestUserService
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
      // Group attributes by name
      if (this.product?.attributes && this.product.attributes.length > 0) {
        this.groupAttributesByName();
      }
    });
  }

  /**
   * Group attributes by attributeName
   */
  groupAttributesByName(): void {
    this.groupedAttributes = {};
    this.selectedAttributes = {};
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
      if (!this.selectedAttributes[attrName]) {
        this.selectedAttributes[attrName] = attr.value;
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
    this.selectedAttributes[attributeName] = value;
  }

  addToCart(product) {
  }

  ngOnInit(): void {
    this.getProductId();
    this.contentHeaderMethod();
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
