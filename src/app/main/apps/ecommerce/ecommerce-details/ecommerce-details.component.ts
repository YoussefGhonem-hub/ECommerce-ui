import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { SwiperConfigInterface } from 'ngx-swiper-wrapper';
import { NgxPermissionsService } from 'ngx-permissions';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { environment } from 'environments/environment';
import { ProductsController } from '@shared/Controllers/ProductsController';
import { WishlistController } from '@shared/Controllers/WishlistController';
import { CartController } from '@shared/Controllers/CartController';
import { ReviewsController } from '@shared/Controllers/ReviewsController';
import { CartService } from '@shared/services/cart.service';
import { GuestUserService } from '@shared/services/guest-user.service';
import { HttpService } from '@shared/services/http.service';
import { AuthenticationService } from 'app/auth/service/authentication.service';
import Swal from 'sweetalert2';
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

  // Reviews
  public reviews: any[] = [];
  public averageRating: number = 0;
  public totalReviews: number = 0;
  public userReview: any = null;
  public reviewForm = {
    rating: 0,
    comment: ''
  };
  public isSubmittingReview: boolean = false;
  public showReviewForm: boolean = false;

  // Image carousel
  public selectedImage: string = '';
  public productImages: any[] = [];
  public isImageMaximized: boolean = false;
  public maximizedImage: string = '';

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
    slidesPerView: 5,
    spaceBetween: 10,
    navigation: true,
    breakpoints: {
      1024: {
        slidesPerView: 5,
        spaceBetween: 10
      },
      768: {
        slidesPerView: 4,
        spaceBetween: 10
      },
      640: {
        slidesPerView: 3,
        spaceBetween: 10
      },
      320: {
        slidesPerView: 2,
        spaceBetween: 10
      }
    }
  };

  selectImage(imagePath: string) {
    this.selectedImage = imagePath;
  }

  maximizeImage(imagePath: string) {
    this.maximizedImage = imagePath;
    this.isImageMaximized = true;
    document.body.style.overflow = 'hidden';
  }

  closeMaximizedImage() {
    this.isImageMaximized = false;
    this.maximizedImage = '';
    document.body.style.overflow = 'auto';
  }

  constructor(
    private _activatedRoute: ActivatedRoute,
    private HttpService: HttpService,
    private guestUserService: GuestUserService,
    private _ecommerceService: EcommerceService,
    private cartService: CartService,
    private authService: AuthenticationService,
    private router: Router,
    private permissionsService: NgxPermissionsService
  ) {
    // Subscribe to route params changes to reload data when navigating to different products
    this._activatedRoute.params.subscribe(params => {
      this.productId = params['id'];

      // Reload product data whenever the product ID changes
      if (this.productId) {
        this.getProductId();
        this.loadReviews();
      }
    });
  }

  /**
   * Check if current user has admin permission
   */
  hasAdminPermission(): boolean {
    const permissions = this.permissionsService.getPermissions();
    return permissions && permissions['Admin'] !== undefined;
  }

  /**
   * Navigate to edit product page (Admin only)
   */
  editProduct(): void {
    if (!this.hasAdminPermission()) {
      console.warn('[EcommerceDetails] Unauthorized: Only admins can edit products');
      return;
    }

    if (!this.productId) {
      console.error('[EcommerceDetails] No product ID available');
      return;
    }

    // Navigate to admin product edit page
    this.router.navigate(['/admin/products/edit', this.productId]);
  }

  /**
   * Delete product (Admin only)
   */
  deleteProduct(): void {
    if (!this.hasAdminPermission()) {
      console.warn('[EcommerceDetails] Unauthorized: Only admins can delete products');
      return;
    }

    if (!this.productId) {
      console.error('[EcommerceDetails] No product ID available');
      return;
    }

    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete "${this.product?.nameEn}"? This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.HttpService.DELETE(ProductsController.DeleteProduct(this.productId)).subscribe(
          (res: any) => {
            if (res && res.succeeded) {
              Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Product has been deleted successfully.',
                confirmButtonColor: '#7367F0'
              }).then(() => {
                // Navigate back to products list
                this.router.navigate(['/apps/e-commerce/shop']);
              });
            } else {
              Swal.fire('Error!', res.message || 'Failed to delete product.', 'error');
            }
          },
          (error) => {
            console.error('[EcommerceDetails] Error deleting product:', error);
            Swal.fire('Error!', 'An error occurred while deleting the product.', 'error');
          }
        );
      }
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

      // Initialize product images
      if (this.product?.images && this.product.images.length > 0) {
        // Sort images by sortOrder and prepend baseURL
        this.productImages = this.product.images.slice().sort((a, b) => a.sortOrder - b.sortOrder).map(img => ({
          ...img,
          path: `${environment.baseURL}/${img.path}`
        }));
        // Set main image or first image as selected
        const mainImage = this.productImages.find(img => img.isMain);
        this.selectedImage = mainImage ? mainImage.path : this.productImages[0]?.path;
      } else {
        this.productImages = [];
        this.selectedImage = this.product?.mainImagePath ? `${environment.baseURL}/${this.product.mainImagePath}` : '';
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
        const imagePath = rp.mainImagePath || rp.mainImagePath || rp.mainImage || rp.image || '';
        rp.mainImagePath = imagePath ? `${environment.baseURL}/${imagePath}` : '';
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
        // Use the attribute value as-is (e.g. '#000000' or a color name)
        // This ensures hex values returned from the API are used directly
        this.colorMap[attr.value] = attr.value;
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

  /**
   * Load product reviews
   */
  loadReviews(): void {
    if (!this.productId) return;

    this.HttpService.GET(ReviewsController.GetProductReviews(this.productId)).subscribe(
      (res: any) => {
        if (res && res.succeeded) {
          this.reviews = res.data || [];
          this.totalReviews = this.reviews.length;
          this.calculateAverageRating();
        }
      },
      (error) => {
        console.error('Error loading reviews:', error);
      }
    );
  }

  /**
   * Calculate average rating from reviews
   */
  calculateAverageRating(): void {
    if (this.reviews.length === 0) {
      this.averageRating = 0;
      return;
    }
    const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.averageRating = sum / this.reviews.length;
  }

  /**
   * Submit a review
   */
  submitReview(): void {
    // Check if user is logged in
    if (!this.authService.currentUserValue) {
      Swal.fire({
        title: 'Login Required',
        text: 'You need to login to submit a review',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#7367F0',
        cancelButtonColor: '#E42728',
        confirmButtonText: 'Login Now',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/pages/authentication/login-v2']);
        }
      });
      return;
    }

    if (this.reviewForm.rating === 0) {
      Swal.fire('Error!', 'Please select a rating', 'error');
      return;
    }

    this.isSubmittingReview = true;
    const reviewData = {
      productId: this.productId,
      rating: this.reviewForm.rating,
      comment: this.reviewForm.comment || null
    };

    this.HttpService.POST(ReviewsController.AddReview, reviewData).subscribe(
      (res: any) => {
        if (res && res.succeeded) {
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Your review has been submitted and is pending approval.',
            confirmButtonColor: '#7367F0'
          });
          this.reviewForm = { rating: 0, comment: '' };
          this.showReviewForm = false;
          this.loadReviews();
        } else {
          Swal.fire('Error!', res.message || 'Failed to submit review.', 'error');
        }
        this.isSubmittingReview = false;
      },
      (error) => {
        console.error('Error submitting review:', error);
        Swal.fire('Error!', 'An error occurred while submitting your review.', 'error');
        this.isSubmittingReview = false;
      }
    );
  }

  /**
   * Toggle review form visibility
   */
  toggleReviewForm(): void {
    // Check if user is logged in
    if (!this.authService.currentUserValue) {
      Swal.fire({
        title: 'Login Required',
        text: 'You need to login to write a review',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#7367F0',
        cancelButtonColor: '#E42728',
        confirmButtonText: 'Login Now',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/pages/authentication/login-v2']);
        }
      });
      return;
    }

    this.showReviewForm = !this.showReviewForm;
  }

  ngOnInit(): void {
    this.getProductId();
    this.contentHeaderMethod();
    this.loadReviews();
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
