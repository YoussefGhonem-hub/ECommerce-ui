import { environment } from 'environments/environment';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpService } from '@shared/services/http.service';
import { CategoryController } from '@shared/Controllers/CategoryController';
import { ProductAttributesController } from '@shared/Controllers/ProductAttributesController';
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
    // Attributes management for update
    availableAttributes: any[] = [];
    // each selection row: { attributeId, attributeName, initialValueIds: string[], selectedValueIds: string[], removeAttribute: boolean }
    attributeSelections: any[] = [];

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
        // fetch available attributes first, then product
        this.fetchAttributes().then(() => this.fetchProduct());
    }

    fetchAttributes(): Promise<void> {
        return new Promise((resolve) => {
            this.http.GET(ProductAttributesController.GetAll).subscribe({
                next: (res: any) => {
                    // API returns array directly: [{ attributeId, attributeName, hasNullMapping, values: [{ id, value }] }]
                    if (res && Array.isArray(res)) {
                        this.availableAttributes = res.map((attr: any) => {
                            const attributeId = attr.attributeId || attr.id || null;
                            const attributeName = attr.attributeName || attr.name || '';
                            const values = Array.isArray(attr.values) ? attr.values.map((v: any) => ({
                                id: v.id || '',
                                value: v.value || v.name || ''
                            })) : [];
                            return { attributeId, attributeName, values };
                        });
                    } else {
                        this.availableAttributes = [];
                    }
                    resolve();
                },
                error: () => { this.availableAttributes = []; resolve(); }
            });
        });
    }

    fetchCategories() {
        this.http.GET(CategoryController.GetCategories).subscribe(res => {
            if (res && res.items) {
                this.categories = res.items;
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
                // Build attributeSelections from product data if present
                const rawAttrs = product.attributes || product.attributeMappings || product.attributeValues || [];
                this.attributeSelections = [];
                if (Array.isArray(rawAttrs) && rawAttrs.length > 0) {
                    rawAttrs.forEach((ra: any) => {
                        const attributeId = ra.attributeId || ra.attributeID || ra.attribute || null;
                        let initialValueIds: string[] = [];
                        if (Array.isArray(ra.valueIds) && ra.valueIds.length > 0) {
                            initialValueIds = ra.valueIds.map((v: any) => v.toString());
                        } else if (Array.isArray(ra.values) && ra.values.length > 0) {
                            // values might be objects with id and a mapped flag
                            const mapped = ra.values.filter((v: any) => v.isMapped || v.mapped || v.selected || v.isSelected || v.mappedToProduct).map((v: any) => v.id?.toString()).filter(Boolean);
                            if (mapped.length > 0) initialValueIds = mapped;
                        }
                        const attrMeta = this.availableAttributes.find((a: any) => a.attributeId === attributeId) || null;
                        this.attributeSelections.push({
                            attributeId: attributeId,
                            attributeName: attrMeta ? attrMeta.attributeName : (ra.attributeName || ''),
                            initialValueIds: initialValueIds,
                            selectedValueIds: initialValueIds.slice(),
                            removeAttribute: false
                        });
                    });
                }
            }
        });
    }

    // Update attribute selection helpers for UI
    addAttributeSelectionUpdate(preselectAttributeId?: string | null) {
        this.attributeSelections.push({
            attributeId: preselectAttributeId || null,
            attributeName: '',
            initialValueIds: [],
            selectedValueIds: [],
            removeAttribute: false
        });
    }

    removeAttributeSelectionUpdate(index: number) {
        this.attributeSelections.splice(index, 1);
    }

    isAttributeSelectedUpdate(attributeId: string, index: number): boolean {
        if (!attributeId) return false;
        return this.attributeSelections.some((s, i) => i !== index && s.attributeId === attributeId);
    }

    toggleAttributeValueSelectionUpdate(index: number, valueId: string) {
        const sel = this.attributeSelections[index];
        if (!sel) return;
        const arr: string[] = Array.isArray(sel.selectedValueIds) ? sel.selectedValueIds.slice() : [];
        const pos = arr.indexOf(valueId);
        if (pos === -1) arr.push(valueId); else arr.splice(pos, 1);
        sel.selectedValueIds = arr;
    }

    getValuesForAttribute(attributeId: string) {
        const a = this.availableAttributes.find((x: any) => x.attributeId === attributeId);
        return a ? a.values : [];
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

        // Attributes updates: compute AddValueIds, RemoveValueIds, RemoveAttribute per selection
        const updates: any[] = [];
        this.attributeSelections.forEach(s => {
            if (!s || !s.attributeId) return;
            if (s.removeAttribute) {
                updates.push({ AttributeId: s.attributeId, RemoveAttribute: true });
            } else {
                const initial = new Set((s.initialValueIds || []).map((v: any) => v.toString()));
                const selected = new Set((s.selectedValueIds || []).map((v: any) => v.toString()));
                const add = Array.from(selected).filter(x => !initial.has(x));
                const remove = Array.from(initial).filter(x => !selected.has(x));
                if (add.length > 0 || remove.length > 0) {
                    updates.push({ AttributeId: s.attributeId, AddValueIds: add.length > 0 ? add : null, RemoveValueIds: remove.length > 0 ? remove : null, RemoveAttribute: false });
                }
            }
        });

        // Append updates as indexed form fields
        updates.forEach((u, i) => {
            formData.append(`Attributes[${i}].AttributeId`, u.AttributeId.toString());
            if (u.AddValueIds && Array.isArray(u.AddValueIds)) {
                u.AddValueIds.forEach((v: any, j: number) => formData.append(`Attributes[${i}].AddValueIds[${j}]`, v.toString()));
            }
            if (u.RemoveValueIds && Array.isArray(u.RemoveValueIds)) {
                u.RemoveValueIds.forEach((v: any, j: number) => formData.append(`Attributes[${i}].RemoveValueIds[${j}]`, v.toString()));
            }
            // Always send RemoveAttribute flag (true/false)
            formData.append(`Attributes[${i}].RemoveAttribute`, (u.RemoveAttribute ? 'true' : 'false'));
        });

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
