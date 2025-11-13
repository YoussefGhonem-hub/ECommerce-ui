import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

import { CoreSidebarService } from '@core/components/core-sidebar/core-sidebar.service';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { HttpService } from '@shared/services/http.service';
import { ProductsController } from '@shared/Controllers/ProductsController';

@Component({
  selector: 'app-ecommerce-shop',
  templateUrl: './ecommerce-shop.component.html',
  styleUrls: ['./ecommerce-shop.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: { class: 'ecommerce-application' }
})
export class EcommerceShopComponent implements OnInit, OnDestroy {
  // public
  public contentHeader: object;
  public shopSidebarToggle = false;
  public shopSidebarReset = false;
  public gridViewRef = true;
  public products: any[] = [];
  public wishlist;
  public cartList;
  public page = 1;
  public pageSize = 9;
  public searchText = '';
  public totalCount = 0;
  // search input subject for debouncing
  private _searchSubject: Subject<string> = new Subject<string>();

  // Private
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  private filters: any = {};

  constructor(
    private _coreSidebarService: CoreSidebarService,
    private HttpService: HttpService,
    private _ecommerceService: EcommerceService) { }

  toggleSidebar(name): void {
    this._coreSidebarService.getSidebarRegistry(name).toggleOpen();
  }

  /**
   * Update to List View
   */
  listView() {
    this.gridViewRef = false;
  }

  /**
   * Update to Grid View
   */
  gridView() {
    this.gridViewRef = true;
  }

  /**
   * Sort Product
   */
  sortProduct(sortParam) {
    // Use backend sorting: set Sort filter and reload products
    this.filters.Sort = sortParam;
    this.getAllProducts(this.page, this.pageSize);
  }

  /**
   * Called from template when search input changes (debounced)
   */
  onSearchChange(value: string) {
    this._searchSubject.next(value);
  }

  /**
   * Get All Products with pagination and filters
   */
  getAllProducts(pageNumber: number = 1, pageSize: number = 9) {
    const params = {
      pageNumber,
      pageSize,
      ...this.filters
    };

    const queryString = this.buildQueryString(params);
    const url = `${ProductsController.GetProducts}?${queryString}`;

    this.HttpService.GET(url).pipe(
      takeUntil(this._unsubscribeAll)
    ).subscribe((res: any) => {
      if (res.succeeded && res.data) {
        this.products = res.data.items || [];
        this.totalCount = res.data.totalCount || 0;

        // Update product wishlist and cart status
        this.updateProductStatuses();
      }
    });
  }

  /**
   * Update product wishlist and cart status
   */
  updateProductStatuses() {
    if (this.products && this.products.length > 0) {
      this.products.forEach(product => {
        product.isInWishlist = this.wishlist?.findIndex(p => p.productId === product.id) > -1;
        product.isInCart = this.cartList?.findIndex(p => p.productId === product.id) > -1;
      });
    }
  }

  /**
   * Apply filters from sidebar
   */
  applyFilters(filters: any) {
    this.filters = filters;
    this.page = 1; // Reset to first page
    this.getAllProducts(this.page, this.pageSize);
  }

  /**
   * Build query string from params object
   */
  private buildQueryString(params: any): string {
    return Object.keys(params)
      .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');
  }

  // Lifecycle Hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void {
    // Debounced search subscription
    this._searchSubject.pipe(
      debounceTime(300),
      takeUntil(this._unsubscribeAll)
    ).subscribe(value => {
      this.filters.Search = value || null;
      this.page = 1;
      this.getAllProducts(this.page, this.pageSize);
    });

    // Get initial products
    this.getAllProducts(this.page, this.pageSize);

    // content header
    this.contentHeader = {
      headerTitle: 'Shop',
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
            isLink: false
          }
        ]
      }
    };
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}
