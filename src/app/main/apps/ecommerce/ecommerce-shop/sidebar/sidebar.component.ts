import { Component, OnInit, ViewEncapsulation, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { HttpService } from '@shared/services/http.service';

@Component({
  selector: 'ecommerce-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['../ecommerce-shop.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EcommerceSidebarComponent implements OnInit, OnDestroy {
  // Public
  public filterForm: FormGroup;
  public sliderPriceValue = [1, 100];
  public categories: any[] = [];
  public maxPrice = 10000;

  // Output
  @Output() filtersChanged = new EventEmitter<any>();

  // Private
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  constructor(
    private fb: FormBuilder,
    private HttpService: HttpService
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      categoryId: [''],
      minPrice: [null],
      maxPrice: [null]
    });
  }

  /**
   * Initialize Reactive Form and setup value changes
   */
  ngOnInit(): void {
    this.initializeForm();
    this.setupFormValueChanges();
  }

  /**
   * Initialize filter form
   */
  private initializeForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      categoryId: [''],
      minPrice: [null],
      maxPrice: [null]
    });
  }

  /**
   * Setup form value changes listener
   */
  private setupFormValueChanges(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(300),
        takeUntil(this._unsubscribeAll)
      )
      .subscribe(values => {
        this.applyFilters();
      });
  }

  /**
   * Apply filters based on form values
   */
  applyFilters(): void {
    const formValue = this.filterForm.value;

    const filters = {
      search: formValue.search || null,
      categoryId: formValue.categoryId || null,
      minPrice: this.sliderPriceValue[0],
      maxPrice: this.sliderPriceValue[1]
    };

    this.filtersChanged.emit(filters);
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterForm.reset();
    this.sliderPriceValue = [1, this.maxPrice];
    this.applyFilters();
  }

  /**
   * Handle price slider change
   */
  onPriceSliderChange(): void {
    this.filterForm.patchValue({
      minPrice: this.sliderPriceValue[0],
      maxPrice: this.sliderPriceValue[1]
    });
  }

  /**
   * On destroy
   */
  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }
}