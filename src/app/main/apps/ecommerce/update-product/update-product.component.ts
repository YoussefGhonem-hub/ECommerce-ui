import { environment } from 'environments/environment';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpService } from '@shared/services/http.service';
import { CategoryController } from '@shared/Controllers/CategoryController';
import { ProductsController } from '@shared/Controllers/ProductsController';

@Component({
    selector: 'app-update-product',
    templateUrl: './update-product.component.html',
    styleUrls: ['./update-product.component.scss']
})
export class UpdateProductComponent implements OnInit {

    getImageUrl(path: string): string {
        if (!path) return '';
        if (path.startsWith('productimages')) {
            return environment.baseURL + '/' + path;
        }
        return path;
    }
    productForm: FormGroup;
    categories: any[] = [];
    productId: string;
    loading = false;
    error = '';
    success = false;
    images: any[] = [];
    newImages: File[] = [];
    newImagePreviews: string[] = [];
    mainNewImageIndex: number | null = null;
    removeImageIds: string[] = [];
    setMainImageId: string | null = null;
    setMainImageSource: 'new' | 'existing' | null = null;

    constructor(
        private fb: FormBuilder,
        private http: HttpService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.productForm = this.fb.group({
            nameAr: ['', Validators.required],
            nameEn: ['', Validators.required],
            descriptionAr: [''],
            descriptionEn: [''],
            sku: ['', Validators.required],
            brand: [''],
            categoryId: ['', Validators.required],
            price: [0, [Validators.required, Validators.min(0)]],
            stockQuantity: [0, [Validators.required, Validators.min(0)]],
            allowBackorder: [false]
        });
        this.productId = '';
    }

    ngOnInit() {
        this.productId = this.route.snapshot.paramMap.get('id') || '';
        this.fetchCategories();
        this.fetchProduct();
    }

    fetchCategories() {
        this.http.GET(CategoryController.GetCategories).subscribe(res => {
            if (res && res.succeeded && res.data) {
                this.categories = res.data;
            }
        });
    }

    fetchProduct() {
        this.http.GET(ProductsController.GetProductByIdforUpdate(this.productId)).subscribe(res => {
            if (res && res.succeeded && res.data) {
                const product = res.data;
                this.productForm.patchValue({
                    nameAr: product.nameAr,
                    nameEn: product.nameEn,
                    descriptionAr: product.descriptionAr,
                    descriptionEn: product.descriptionEn,
                    sku: product.sku,
                    brand: product.brand,
                    categoryId: product.categoryId,
                    price: product.price,
                    stockQuantity: product.stockQuantity,
                    allowBackorder: product.allowBackorder
                });
                this.images = product.images || [];
                // Set main image radio selection as per response
                const mainImg = this.images.find((img: any) => img.isMain);
                if (mainImg) {
                    this.setMainImageSource = 'existing';
                    this.setMainImageId = mainImg.id;
                    this.mainNewImageIndex = null;
                } else {
                    this.setMainImageSource = null;
                    this.setMainImageId = null;
                    this.mainNewImageIndex = null;
                }
            }
        });
    }

    onFileChange(event: any) {
        if (event.target.files && event.target.files.length > 0) {
            this.newImages = Array.from(event.target.files);
            this.newImagePreviews = [];
            this.newImages.forEach((file, idx) => {
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.newImagePreviews[idx] = e.target.result;
                };
                reader.readAsDataURL(file);
            });
            if (this.mainNewImageIndex == null && this.newImages.length > 0) {
                this.mainNewImageIndex = 0;
            }
        } else {
            this.newImages = [];
            this.newImagePreviews = [];
            this.mainNewImageIndex = null;
        }
    }

    removeExistingImage(imageId: string) {
        this.removeImageIds.push(imageId);
        this.images = this.images.filter((img: any) => img.id !== imageId);
        if (this.setMainImageId === imageId) {
            this.setMainImageId = null;
        }
    }

    selectMainImage(source: 'new' | 'existing', value: any) {
        if (source === 'new') {
            this.setMainImageSource = 'new';
            this.mainNewImageIndex = value;
            this.setMainImageId = null;
            this.images = this.images.map((img: any) => ({ ...img, isMain: false }));
        } else {
            this.setMainImageSource = 'existing';
            this.setMainImageId = value;
            this.mainNewImageIndex = null;
            this.images = this.images.map((img: any) => ({ ...img, isMain: img.id === value }));
        }
    }

    onSubmit() {
        if (this.productForm.invalid) return;
        this.loading = true;
        this.error = '';
        this.success = false;
        const formData = new FormData();
        formData.append('Id', this.productId);
        formData.append('NameAr', this.productForm.value.nameAr);
        formData.append('NameEn', this.productForm.value.nameEn);
        formData.append('DescriptionAr', this.productForm.value.descriptionAr || '');
        formData.append('DescriptionEn', this.productForm.value.descriptionEn || '');
        formData.append('SKU', this.productForm.value.sku);
        formData.append('Brand', this.productForm.value.brand || '');
        formData.append('CategoryId', this.productForm.value.categoryId);
        formData.append('Price', this.productForm.value.price);
        formData.append('StockQuantity', this.productForm.value.stockQuantity);
        formData.append('AllowBackorder', this.productForm.value.allowBackorder);

        // Handle new images
        if (this.newImages.length > 0) {
            this.newImages.forEach((file) => {
                formData.append('NewImages', file);
            });
        }

        // MainNewImageIndex: only if a new image is selected as main
        if (this.setMainImageSource === 'new' && this.mainNewImageIndex != null && this.newImages.length > 0) {
            formData.append('MainNewImageIndex', this.mainNewImageIndex.toString());
        } else if (this.setMainImageSource === 'existing' && this.setMainImageId) {
            formData.append('SetMainImageId', this.setMainImageId);
        }

        // RemoveImageIds
        if (this.removeImageIds.length > 0) {
            this.removeImageIds.forEach(id => formData.append('RemoveImageIds', id));
        }

        this.http.PUT(ProductsController.UpdateProduct, formData).subscribe({
            next: (res) => {
                this.loading = false;
                if (res && res.succeeded) {
                    this.success = true;
                    setTimeout(() => this.router.navigate(['/apps/e-commerce/shop']), 1200);
                } else {
                    this.error = (res && res.errors && res.errors.length) ? res.errors[0] : 'Failed to update product.';
                }
            },
            error: (err) => {
                this.loading = false;
                this.error = err?.error?.message || 'Failed to update product.';
            }
        });
    }
}
