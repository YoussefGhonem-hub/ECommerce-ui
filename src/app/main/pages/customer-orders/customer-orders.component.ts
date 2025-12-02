import { Component, OnInit } from '@angular/core';
import { HttpService } from '@shared/services/http.service';
import { OrderController } from '@shared/Controllers/OrderController';

@Component({
    selector: 'app-customer-orders',
    templateUrl: './customer-orders.component.html',
    styleUrls: ['./customer-orders.component.scss']
})
export class CustomerOrdersComponent implements OnInit {
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
    expandedOrderId: string | null = null;

    statusOptions: Array<{ label: string, value: number | null }> = [
        { label: 'Processing', value: 4 },
        { label: 'Delivered', value: 7 },
        { label: 'Cancelled', value: 8 },
        { label: 'Returned', value: 9 }
    ];

    constructor(private httpService: HttpService) { }

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders(page: number = 1): void {
        this.loading = true;
        this.filters.pageIndex = page;
        this.filters.pageSize = this.pageSize;
        const query = this.buildQueryParams();
        const url = `${OrderController.GetOrders}?${query}`;

        this.httpService.GET(url).subscribe((res: any) => {
            if (res && res.succeeded && res.data) {
                this.orders = res.data.items || [];
                this.totalCount = res.data.totalCount || 0;
                this.pageNumber = res.data.pageIndex ?? res.data.pageNumber ?? page;
                this.pageSize = res.data.pageSize ?? this.pageSize;
                this.filters.pageIndex = this.pageNumber;
                this.filters.pageSize = this.pageSize;
            } else {
                this.orders = [];
                this.totalCount = 0;
            }
            this.loading = false;
        }, () => this.loading = false);
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
        this.pageNumber = 1;
        this.loadOrders(1);
    }

    private buildQueryParams(): string {
        const p: string[] = [];
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

    getStatusLabel(statusValue: any): string {
        if (statusValue === null || statusValue === undefined) { return '' };
        const asNum = (typeof statusValue === 'number') ? statusValue : (Number(statusValue));
        if (!Number.isNaN(asNum)) {
            const found = this.statusOptions.find(s => s.value === asNum);
            if (found) { return found.label; }
        }
        const asStr = String(statusValue).toLowerCase();
        const foundByLabel = this.statusOptions.find(s => (s.label || '').toLowerCase() === asStr);
        if (foundByLabel) { return foundByLabel.label; }
        return String(statusValue);
    }

    getStatusBadgeClass(statusValue: any): string {
        if (statusValue === null || statusValue === undefined) { return 'badge badge-pill badge-secondary'; }
        const asNum = (typeof statusValue === 'number') ? statusValue : Number(statusValue);
        const v = Number.isNaN(asNum) ? null : asNum;
        switch (v) {
            case 1:
                return 'badge badge-pill badge-warning';
            case 2:
                return 'badge badge-pill badge-warning';
            case 3:
                return 'badge badge-pill badge-success';
            case 4:
                return 'badge badge-pill badge-primary';
            case 5:
                return 'badge badge-pill badge-info';
            case 6:
                return 'badge badge-pill badge-primary';
            case 7:
                return 'badge badge-pill badge-success';
            case 8:
                return 'badge badge-pill badge-danger';
            case 9:
                return 'badge badge-pill badge-dark';
            default:
                const s = String(statusValue).toLowerCase();
                if (s.includes('pending')) { return 'badge badge-pill badge-warning'; }
                if (s.includes('paid') || s.includes('delivered')) { return 'badge badge-pill badge-success'; }
                if (s.includes('processing') || s.includes('shipped')) { return 'badge badge-pill badge-primary'; }
                if (s.includes('packed')) { return 'badge badge-pill badge-info'; }
                if (s.includes('cancel')) { return 'badge badge-pill badge-danger'; }
                if (s.includes('return')) { return 'badge badge-pill badge-dark'; }
                return 'badge badge-pill badge-secondary';
        }
    }

    getStatusIcon(statusValue: any): string {
        if (statusValue === null || statusValue === undefined) { return 'info'; }
        const asNum = (typeof statusValue === 'number') ? statusValue : Number(statusValue);
        const v = Number.isNaN(asNum) ? null : asNum;
        switch (v) {
            case 4:
                return 'clock';
            case 7:
                return 'check-circle';
            case 8:
                return 'x-circle';
            case 9:
                return 'corner-up-left';
            default:
                const s = String(statusValue).toLowerCase();
                if (s.includes('pending')) { return 'clock'; }
                if (s.includes('paid') || s.includes('delivered')) { return 'check-circle'; }
                if (s.includes('processing') || s.includes('shipped')) { return 'truck'; }
                if (s.includes('cancel')) { return 'x-circle'; }
                if (s.includes('return')) { return 'corner-up-left'; }
                return 'info';
        }
    }
}
