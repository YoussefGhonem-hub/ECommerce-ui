import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { HttpService } from '@shared/services/http.service';
import { CategoryController } from '@shared/Controllers/CategoryController';

@Component({
  selector: 'app-product-categories',
  templateUrl: './product-categories.component.html',
  styleUrls: ['./product-categories.component.scss']
})
export class ProductCategoriesComponent implements OnInit {

  categories: any[] = [];
  pageNumber = 1;
  pageSize = 10;
  totalCount = 0;

  parents: any[] = [];

  modalRef: NgbModalRef | null = null;
  editMode = false;
  currentEditId: any = null;
  categoryForm: FormGroup;

  constructor(private http: HttpService, private fb: FormBuilder, private modalService: NgbModal) {
    this.categoryForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      parentId: [null],
      isFeatured: [false]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadParents();
  }

  loadCategories() {
    const params = { pageNumber: this.pageNumber, pageSize: this.pageSize } as any;
    this.http.GET(CategoryController.GetCategories, params).subscribe((res: any) => {
      this.categories = res.items || res;
      this.totalCount = res.totalCount || (this.categories || []).length;
    });
  }

  loadParents() {
    const params: any = { pageNumber: 1, pageSize: 1000 };
    this.http.GET(CategoryController.GetCategories, params).subscribe((res: any) => {
      this.parents = res.items || res || [];
    });
  }

  openCreate() {
    this.editMode = false;
    this.currentEditId = null;
    this.categoryForm.reset({ isFeatured: false });
    // template-driven modal will open
  }

  openCreateModal(content: any) {
    this.editMode = false;
    this.currentEditId = null;
    this.categoryForm.reset({ isFeatured: false });
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  openEditModal(category: any, content: any) {
    this.openEdit(category);
    this.modalRef = this.modalService.open(content, { centered: true });
  }

  openEdit(category: any) {
    this.editMode = true;
    this.currentEditId = category.id;
    this.currentEditId = category.id || category.Id || category.id;
    this.categoryForm.patchValue({ nameEn: category.nameEn || category.NameEn || category.name || '', nameAr: category.nameAr || category.NameAr || '', parentId: category.parentId || category.ParentId || null, isFeatured: !!(category.isFeatured || category.IsFeatured) });
  }

  save() {
    if (this.categoryForm.invalid) return;
    const payload: any = { NameEn: this.categoryForm.value.nameEn, NameAr: this.categoryForm.value.nameAr, ParentId: this.categoryForm.value.parentId, IsFeatured: this.categoryForm.value.isFeatured };
    if (this.editMode && this.currentEditId) {
      payload.Id = this.currentEditId;
      this.http.PUT(CategoryController.Update, payload).subscribe(() => {
        this.loadCategories();
      });
    } else {
      this.http.POST(CategoryController.CreateCategory, payload).subscribe(() => {
        this.loadCategories();
      });
    }
  }

  async confirmDelete(id: any) {
    const result = await Swal.fire({
      title: 'Delete this category?',
      text: 'This action cannot be undone.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      this.http.DELETE(CategoryController.Delete(id)).subscribe({
        next: () => {
          Swal.fire('Deleted', 'Category has been deleted.', 'success');
          this.loadCategories();
        },
        error: (err) => {
          Swal.fire('Error', err?.message || 'Failed to delete', 'error');
        }
      });
    }
  }

  changePage(n: number) {
    this.pageNumber = n;
    this.loadCategories();
  }

  changePageSize(size: number) {
    this.pageSize = size;
    this.pageNumber = 1;
    this.loadCategories();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil((this.totalCount || 0) / this.pageSize));
  }

  getParentName(category: any): string {
    const pid = category.parentId || category.ParentId;
    if (!pid) return '-';
    const p = this.parents.find(x => x.id === pid || x.Id === pid);
    return p ? (p.nameEn || p.NameEn || p.name || '') : '-';
  }

}
