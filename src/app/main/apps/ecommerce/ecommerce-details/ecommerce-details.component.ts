import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SwiperConfigInterface } from 'ngx-swiper-wrapper';

import { EcommerceService } from 'app/main/apps/ecommerce/ecommerce.service';
import { ProductsController } from '@shared/Controllers/ProductsController';
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

  // Swiper
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
    private HttpService: HttpService
  ) {
    this._activatedRoute.params.subscribe(params => {
      this.productId = params['id'];
    });

  }

  toggleWishlist(product) {
  }


  getProductId() {
    this.HttpService.GET(ProductsController.GetProductId(this.productId)).subscribe((res: any) => {
      this.product = res.data;
    });
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
