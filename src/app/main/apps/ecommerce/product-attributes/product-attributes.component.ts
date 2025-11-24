import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from '@shared/services/http.service';
import { ProductAttributesController } from '@shared/Controllers/ProductAttributesController';

@Component({
    selector: 'app-product-attributes',
    templateUrl: './product-attributes.component.html',
    styleUrls: ['./product-attributes.component.scss']
})
export class ProductAttributesComponent implements OnInit {
    attributes: any[] = [];
    loading = false;
    error = '';
    // pagination
    pageNumber = 1;
    pageSize = 10;
    totalCount = 0;

    // modal/form
    modalRef: NgbModalRef | null = null;
    attributeForm: FormGroup;
    creating = false;
    editingId: string | null = null;
    // when editing, keep track of existing values and whether they should be removed
    // originalValue is stored to detect edits (so we can replace by removing old id and adding new value)
    existingValues: Array<{ id: string, value: string, originalValue?: string, remove?: boolean }> = [];
    // when adding new values for Color attribute, maintain an array of color strings
    newColorValues: string[] = [];

    constructor(
        private http: HttpService,
        private fb: FormBuilder,
        private modalService: NgbModal,
        private cdr: ChangeDetectorRef
    ) {
        this.attributeForm = this.fb.group({
            name: ['', Validators.required],
            valuesText: ['']
        });
    }

    ngOnInit(): void {
        this.loadAttributes();
    }

    loadAttributes(page?: number) {
        if (page && page > 0) this.pageNumber = page;
        this.loading = true;
        const query = { pageNumber: this.pageNumber, pageSize: this.pageSize };
        this.http.GET(ProductAttributesController.GetAll, query).subscribe({
            next: (res: any) => {
                // expected shape: { items: [...], totalCount, pageNumber, pageSize }
                if (res) {
                    this.attributes = Array.isArray(res.items) ? res.items : (Array.isArray(res) ? res : (res.data || []));
                    this.totalCount = res.totalCount || 0;
                    this.pageNumber = res.pageNumber || this.pageNumber;
                    this.pageSize = res.pageSize || this.pageSize;
                } else {
                    this.attributes = [];
                    this.totalCount = 0;
                }
                this.loading = false;
            },
            error: (err) => {
                this.loading = false;
                this.error = err?.message || 'Failed to load attributes';
            }
        });
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil((this.totalCount || 0) / this.pageSize));
    }

    changePage(page: number) {
        if (page < 1 || page > this.totalPages) return;
        this.pageNumber = page;
        this.loadAttributes(page);
    }

    changePageSize(size: number) {
        this.pageSize = size;
        this.pageNumber = 1;
        this.loadAttributes(1);
    }

    formatAttributeValues(attr: any): string {
        try {
            const vals = attr && (attr.values || []);
            if (!Array.isArray(vals) || vals.length === 0) return '';
            return vals.map((v: any) => v && (v.value || v.name || '')).filter(Boolean).join(', ');
        } catch (e) {
            return '';
        }
    }
    openCreateModal(content: any) {
        this.editingId = null;
        this.attributeForm.reset({ name: '', valuesText: '' });
        // initialize color inputs for convenience
        this.newColorValues = ['#000000'];
        this.modalRef = this.modalService.open(content, { centered: true });
    }

    openEditModal(attr: any, content: any) {
        this.editingId = attr.attributeId || attr.id || null;
        const values = (attr.values || []).map((v: any) => v.value).join(',');
        this.attributeForm.setValue({ name: attr.attributeName || attr.name || '', valuesText: '' });
        // populate existingValues with remove flag default false and keep originalValue for change detection
        this.existingValues = (attr.values || []).map((v: any) => ({ id: v.id, value: v.value, originalValue: v.value, remove: false }));
        // reset newColorValues when editing; user can still add additional colors via the add control
        this.newColorValues = [];
        this.modalRef = this.modalService.open(content, { centered: true });
    }

    saveAttribute() {
        if (this.attributeForm.invalid) return;
        const name = this.attributeForm.get('name')?.value;
        const valuesText = this.attributeForm.get('valuesText')?.value || '';
        const isColor = (name || '').toLowerCase() === 'color';
        const values = isColor ? this.newColorValues.map(v => v).filter(Boolean) : valuesText.split(',').map((v: string) => v.trim()).filter((v: string) => v.length > 0);
        this.creating = true;

        if (this.editingId) {
            // Build update payload per backend: Id, Name, AddValues (strings), RemoveValueIds (guids)
            // Detect changed existing values: we'll remove the old id and add the new value
            const changed = this.existingValues.filter(v => !v.remove && v.originalValue !== undefined && v.originalValue !== v.value);
            const changedRemoveIds = changed.map(v => v.id);
            const changedAddValues = changed.map(v => v.value);

            const removeIds = this.existingValues.filter(v => v.remove).map(v => v.id).concat(changedRemoveIds);
            const addValues = (values || []).concat(changedAddValues).filter(Boolean);

            const payload = { Id: this.editingId, Name: name, AddValues: addValues.length > 0 ? addValues : null, RemoveValueIds: removeIds.length > 0 ? removeIds : null };
            this.http.PUT(ProductAttributesController.Update, payload).subscribe({
                next: (res: any) => {
                    this.creating = false;
                    this.modalRef?.close();
                    // clear new color inputs after successful save
                    this.newColorValues = [];
                    this.loadAttributes();
                },
                error: (err) => { this.creating = false; this.error = err?.message || 'Failed to update'; }
            });
        } else {
            const payload = { Name: name, Values: values };
            this.http.POST(ProductAttributesController.Create, payload).subscribe({
                next: (res: any) => {
                    this.creating = false;
                    this.modalRef?.close();
                    this.newColorValues = [];
                    this.loadAttributes();
                },
                error: (err) => { this.creating = false; this.error = err?.message || 'Failed to create'; }
            });
        }
    }

    confirmDelete(attr: any) {
        if (!confirm(`Delete attribute "${attr.attributeName || attr.name}"? This cannot be undone.`)) return;
        const id = attr.attributeId || attr.id;
        if (!id) return;
        this.http.DELETE(ProductAttributesController.Delete(id)).subscribe({
            next: () => this.loadAttributes(),
            error: (err) => this.error = err?.message || 'Failed to delete'
        });
    }
}
