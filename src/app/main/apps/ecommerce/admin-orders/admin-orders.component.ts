import { Component, OnInit } from '@angular/core';
import { HttpService } from '@shared/services/http.service';
import { OrderController } from '@shared/Controllers/OrderController';

@Component({
    selector: 'app-admin-orders',
    templateUrl: './admin-orders.component.html',
    styleUrls: ['./admin-orders.component.scss']
})
export class AdminOrdersComponent implements OnInit {
    orders: any[] = [];
    loading = false;
    totalCount = 0;
    pageNumber = 1;
    pageSize = 6;
    // filter model matches backend GetMyOrdersQuery / BaseFilterDto
    filters: any = {
        pageIndex: 1,
        pageSize: this.pageSize,
        sort: '',
        descending: true,
        orderNumber: '',
        status: null as number | null,
        paymentStatus: null as number | null,
        from: null as string | null,
        to: null as string | null,
        minTotal: null as number | null,
        maxTotal: null as number | null,
        productId: null as string | null,
        categoryId: null as string | null,
        search: ''
    };
    // keep pageNumber for UI
    statusFilter: string = 'All';
    expandedOrderId: string | null = null;

    // status options map to backend numeric status (adjust values to match your backend)
    statusOptions: Array<{ label: string, value: number | null }> = [
        { label: 'All', value: null },
        { label: 'Pending', value: 0 },
        { label: 'Processing', value: 1 },
        { label: 'Shipped', value: 2 },
        { label: 'Delivered', value: 3 },
        { label: 'Cancelled', value: 4 }
    ];

    paymentStatusOptions: Array<{ label: string, value: number | null }> = [
        { label: 'Any', value: null },
        { label: 'Pending', value: 0 },
        { label: 'Paid', value: 1 },
        { label: 'Failed', value: 2 }
    ];

    constructor(private httpService: HttpService) { }

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders(page: number = 1): void {
        this.loading = true;
        // set page index and page size on filters
        this.filters.pageIndex = page;
        this.filters.pageSize = this.pageSize;

        const query = this.buildQueryParams();
        const url = `${OrderController.GetOrders}?${query}`;

        this.httpService.GET(url).subscribe((res: any) => {
            if (res && res.succeeded && res.data) {
                this.orders = res.data.items || [];
                this.totalCount = res.data.totalCount || 0;
                // backend may return PageIndex or pageNumber depending on implementation
                this.pageNumber = res.data.pageIndex ?? res.data.pageNumber ?? page;
                this.pageSize = res.data.pageSize ?? this.pageSize;
                // keep filters in sync
                this.filters.pageIndex = this.pageNumber;
                this.filters.pageSize = this.pageSize;
            } else {
                this.orders = [];
                this.totalCount = 0;
            }
            this.loading = false;
        }, () => this.loading = false);
    }

    changeTab(option: any): void {
        // option may be an object {label,value} from statusOptions
        const val = option && option.value !== undefined ? option.value : null;
        const label = option && option.label ? option.label : String(option);
        if (this.filters.status === val) { return; }
        this.filters.status = val;
        this.statusFilter = label;
        this.pageNumber = 1;
        this.loadOrders(1);
    }

    applyFilters(): void {
        this.pageNumber = 1;
        this.pageSize = this.filters.pageSize || this.pageSize;
        this.loadOrders(1);
    }

    resetFilters(): void {
        this.filters = {
            pageIndex: 1,
            pageSize: this.pageSize,
            sort: '',
            descending: true,
            orderNumber: '',
            status: null,
            paymentStatus: null,
            from: null,
            to: null,
            minTotal: null,
            maxTotal: null,
            productId: null,
            categoryId: null,
            search: ''
        };
        this.statusFilter = 'All';
        this.pageNumber = 1;
        this.loadOrders(1);
    }

    private buildQueryParams(): string {
        const p: string[] = [];
        // required paging
        p.push(`pageIndex=${this.filters.pageIndex}`);
        p.push(`pageSize=${this.filters.pageSize}`);

        if (this.filters.sort) { p.push(`sort=${encodeURIComponent(this.filters.sort)}`); }
        if (this.filters.descending !== undefined && this.filters.descending !== null) { p.push(`descending=${this.filters.descending}`); }
        if (this.filters.orderNumber) { p.push(`orderNumber=${encodeURIComponent(this.filters.orderNumber)}`); }
        if (this.filters.status !== null && this.filters.status !== undefined) { p.push(`status=${this.filters.status}`); }
        if (this.filters.paymentStatus !== null && this.filters.paymentStatus !== undefined) { p.push(`paymentStatus=${this.filters.paymentStatus}`); }
        if (this.filters.from) { p.push(`from=${encodeURIComponent(new Date(this.filters.from).toISOString())}`); }
        if (this.filters.to) { p.push(`to=${encodeURIComponent(new Date(this.filters.to).toISOString())}`); }
        if (this.filters.minTotal !== null && this.filters.minTotal !== undefined) { p.push(`minTotal=${this.filters.minTotal}`); }
        if (this.filters.maxTotal !== null && this.filters.maxTotal !== undefined) { p.push(`maxTotal=${this.filters.maxTotal}`); }
        if (this.filters.productId) { p.push(`productId=${encodeURIComponent(this.filters.productId)}`); }
        if (this.filters.categoryId) { p.push(`categoryId=${encodeURIComponent(this.filters.categoryId)}`); }
        if (this.filters.search) { p.push(`search=${encodeURIComponent(this.filters.search)}`); }

        return p.join('&');
    }

    gotoPage(page: number): void {
        if (page < 1) { return; }
        const totalPages = this.totalPages;
        if (totalPages && page > totalPages) { return; }
        this.loadOrders(page);
    }

    toggleDetails(orderId: string): void {
        this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
    }

    get totalPages(): number {
        return this.pageSize ? Math.ceil(this.totalCount / this.pageSize) : 0;
    }

    formatAttributes(attrs: any[] | undefined | null): string {
        if (!attrs || !Array.isArray(attrs) || attrs.length === 0) { return ''; }
        return attrs.map(a => a.attributeName + (a.value ? (': ' + a.value) : '')).join(', ');
    }
}
