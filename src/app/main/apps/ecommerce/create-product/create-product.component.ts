// ...existing code...


import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '@shared/services/http.service';
import { ProductsController } from '@shared/Controllers/ProductsController';
import { ProductAttributesController } from '@shared/Controllers/ProductAttributesController';
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

    // Attribute logic
    attributes: any[] = [];
    // attributesForm is a FormArray inside productForm to store attribute selections
    // each item is a FormGroup { attributeId: string|null, selectedValueIds: string[] }
    loadingAttributes = false;
    // Modal / create attribute form
    createAttributeForm: FormGroup;
    creatingAttribute = false;
    private _createAttrModalRef: NgbModalRef | null = null;

    constructor(
        private fb: FormBuilder,
        private http: HttpService,
        private router: Router,
        private cdr: ChangeDetectorRef
        , private modalService: NgbModal
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
            ,
            attributes: this.fb.array([])
        });

        this.createAttributeForm = this.fb.group({
            name: ['', Validators.required],
            valuesText: [''] // comma separated values
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
        this.fetchAttributes();
    }

    fetchAttributes() {
        this.loadingAttributes = true;
        this.http.GET(ProductAttributesController.GetAll).subscribe({
            next: (res) => {
                // Map API response to expected format for the UI
                this.attributes = (res && Array.isArray(res)) ? res.map((attr: any) => ({
                    attributeId: attr.attributeId,
                    attributeName: attr.attributeName,
                    hasNullMapping: attr.hasNullMapping,
                    values: (attr.values || []).map((v: any) => ({ id: v.id, value: v.value }))
                })) : [];
                this.loadingAttributes = false;
            },
            error: () => {
                this.attributes = [];
                this.loadingAttributes = false;
            }
        });
    }

    // Expose attributes FormArray to template
    get attributesFormArray(): FormArray {
        return this.productForm.get('attributes') as FormArray;
    }

    // allow optional preselect when adding a new selection row
    addAttributeSelection(preselectAttributeId?: string | null) {
        const attrs = this.productForm.get('attributes') as FormArray;
        attrs.push(this.fb.group({
            attributeId: [preselectAttributeId || null],
            selectedValueIds: [[]]
        }));
    }

    // Return true if given attributeId is already selected in any attribute row
    isAttributeSelected(attributeId: string): boolean {
        if (!attributeId) return false;
        const attrs = this.attributesFormArray;
        if (!attrs || attrs.length === 0) return false;
        return attrs.controls.some(g => {
            const val = g.get('attributeId')?.value;
            return val === attributeId;
        });
    }

    // Return true when all available attributes are already selected (used to disable Add button)
    allAttributesSelected(): boolean {
        if (!this.attributes || this.attributes.length === 0) return true;
        // count unique selected attribute ids
        const selected = new Set<string>();
        const attrs = this.attributesFormArray;
        if (attrs) {
            attrs.controls.forEach(g => {
                const v = g.get('attributeId')?.value;
                if (v) selected.add(v);
            });
        }
        return selected.size >= this.attributes.length;
    }

    // Open the create-attribute modal
    openCreateAttributeModal(content: any) {
        this.createAttributeForm.reset({ name: '', valuesText: '' });
        this._createAttrModalRef = this.modalService.open(content, { centered: true, size: 'lg' });
    }

    // Submit new attribute to API
    createAttribute() {
        if (this.createAttributeForm.invalid) return;
        this.creatingAttribute = true;
        const name = this.createAttributeForm.get('name')?.value;
        const valuesText = this.createAttributeForm.get('valuesText')?.value || '';
        const values = valuesText.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0);
        const payload = { Name: name, Values: values };

        this.http.POST(ProductAttributesController.Create, payload).subscribe({
            next: (res: any) => {
                this.creatingAttribute = false;
                // Try to close modal
                try { this._createAttrModalRef?.close(); } catch (e) { }
                // If API returns created id, refresh attributes or append
                if (res && res.succeeded) {
                    // If returned value is new id, re-fetch attributes to get canonical data
                    this.fetchAttributes();
                    // Optionally add a preselected attribute row so user can pick values for it
                    const newId = res.data || res.value || null;
                    if (newId) {
                        // Add a new selection and set its attributeId after short delay to avoid change detection issues
                        setTimeout(() => this.addAttributeSelection(newId), 50);
                    }
                } else {
                    // still refresh to show backend state
                    this.fetchAttributes();
                }
            },
            error: (err: any) => {
                this.creatingAttribute = false;
                // keep modal open and show console error — could be extended to show UI error
                console.error('Failed to create attribute', err);
            }
        });
    }

    removeAttributeSelection(index: number) {
        const attrs = this.productForm.get('attributes') as FormArray;
        attrs.removeAt(index);
    }

    onAttributeChange(index: number) {
        // Reset value selection when attribute changes
        const attrs = this.productForm.get('attributes') as FormArray;
        const ctrl = attrs.at(index).get('selectedValueIds');
        if (ctrl) ctrl.setValue([]);
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

        // Prepare attributes for API: append as indexed fields so backend binds as array
        const attrs = this.productForm.get('attributes') as FormArray;
        const attributesPayload = attrs.controls.map(g => {
            const val: any = g.value;
            return {
                AttributeId: val.attributeId || null,
                ValueIds: (val.selectedValueIds && val.selectedValueIds.length > 0) ? val.selectedValueIds : null
            };
        });

        // Append attributes as indexed form fields (Attributes[0].AttributeId, Attributes[0].ValueIds[0], ...)
        attributesPayload.forEach((a, i) => {
            if (a.AttributeId !== null && a.AttributeId !== undefined) {
                formData.append(`Attributes[${i}].AttributeId`, a.AttributeId.toString());
            }
            if (a.ValueIds && Array.isArray(a.ValueIds)) {
                a.ValueIds.forEach((v: any, j: number) => {
                    formData.append(`Attributes[${i}].ValueIds[${j}]`, v.toString());
                });
            }
        });

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
    // Helper to get values for a selected attribute
    getAttributeValues(attributeId: string) {
        const attr = this.attributes.find((a: any) => a.attributeId === attributeId);
        return attr ? attr.values : [];
    }

    // Toggle selection of an existing attribute value (multiple allowed)
    toggleAttributeValueSelection(index: number, valueId: string) {
        const attrs = this.productForm.get('attributes') as FormArray;
        if (!attrs || !attrs.at(index)) return;
        const ctrl = attrs.at(index).get('selectedValueIds');
        if (!ctrl) return;
        const arr: string[] = Array.isArray(ctrl.value) ? ctrl.value.slice() : [];
        const pos = arr.indexOf(valueId);
        if (pos === -1) {
            arr.push(valueId);
        } else {
            arr.splice(pos, 1);
        }
        ctrl.setValue(arr);
    }

    isValueSelected(index: number, valueId: string) {
        const attrs = this.productForm.get('attributes') as FormArray;
        if (!attrs || !attrs.at(index)) return false;
        const ctrl = attrs.at(index).get('selectedValueIds');
        const arr: string[] = Array.isArray(ctrl?.value) ? ctrl.value : [];
        return arr.indexOf(valueId) !== -1;
    }
}
