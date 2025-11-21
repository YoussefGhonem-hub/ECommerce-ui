// Update the file input label with selected file names


import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { HttpService } from '@shared/services/http.service';
import { ProductsController } from '@shared/Controllers/ProductsController';
import { CategoryController } from '@shared/Controllers/CategoryController';
import { Router } from '@angular/router';

@Component({
    selector: 'app-create-product',
    templateUrl: './create-product.component.html',
    styleUrls: ['./create-product.component.scss']
})
export class CreateProductComponent implements OnInit {
    productForm: FormGroup;
    categories: any[] = [];
    images: File[] = [];
    mainImageIndex: number | null = null;
    imagePreviews: { src: string, main: boolean }[] = [];
    loading = false;
    error = '';
    success = false;

    constructor(
        private fb: FormBuilder,
        private http: HttpService,
        private router: Router,
        private cdr: ChangeDetectorRef
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
    }
    updateFileLabel(event: any) {
        const input = event.target as HTMLInputElement;
        const label = document.getElementById('file-upload-label');
        if (input && label) {
            const files = input.files;
            if (files && files.length > 0) {
                const names = Array.from(files).map(f => f.name).join(', ');
                label.textContent = names;
            } else {
                label.textContent = 'Choose file';
            }
        }
    }
    removeImage(i: number) {
        this.images.splice(i, 1);
        this.imagePreviews.splice(i, 1);
        if (this.mainImageIndex === i) {
            this.mainImageIndex = 0;
        } else if (this.mainImageIndex && this.mainImageIndex > i) {
            this.mainImageIndex--;
        }
        this.cdr.detectChanges();
    }
    ngOnInit() {
        this.fetchCategories();
    }

    fetchCategories() {
        this.http.GET(CategoryController.GetCategories).subscribe(res => {
            if (res && res.succeeded && res.data) {
                this.categories = res.data;
            }
        });
    }

    onFileChange(event: any) {
        if (event.target.files && event.target.files.length > 0) {
            this.images = Array.from(event.target.files);
            if (this.mainImageIndex == null && this.images.length > 0) {
                this.mainImageIndex = 0;
            }
            // Generate image previews as objects
            this.imagePreviews = [];
            this.images.forEach((file, idx) => {
                const reader = new FileReader();
                reader.onload = (e: any) => {
                    this.imagePreviews[idx] = {
                        src: e.target.result,
                        main: idx === this.mainImageIndex
                    };
                    // If all previews loaded, trigger change detection
                    if (this.imagePreviews.length === this.images.length) {
                        this.cdr.detectChanges();
                    }
                };
                reader.readAsDataURL(file);
            });
        } else {
            this.images = [];
            this.imagePreviews = [];
            this.mainImageIndex = null;
        }
    }

    onMainImageChange(index: number) {
        this.mainImageIndex = index;
        // Update main property for each preview
        debugger
        if (this.imagePreviews) {
            this.imagePreviews = this.imagePreviews.map((img, i) => ({ ...img, main: i === index }));
        }
        this.cdr.detectChanges();
    }

    onSubmit() {
        if (this.productForm.invalid) return;
        this.loading = true;
        this.error = '';
        this.success = false;

        const formData = new FormData();
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
        if (this.images.length > 0) {
            this.images.forEach((file, idx) => {
                formData.append('Images', file);
            });
            if (this.mainImageIndex != null) {
                formData.append('MainImageIndex', this.mainImageIndex.toString());
            }
        }

        this.http.POST(ProductsController.CreateProduct, formData).subscribe({
            next: (res) => {
                this.loading = false;
                if (res && res.succeeded) {
                    this.success = true;
                    setTimeout(() => this.router.navigate(['/apps/e-commerce/shop']), 1200);
                } else {
                    this.error = (res && res.errors && res.errors.length) ? res.errors[0] : 'Failed to create product.';
                }
            },
            error: (err) => {
                this.loading = false;
                this.error = err?.error?.message || 'Failed to create product.';
            }
        });
    }
}
