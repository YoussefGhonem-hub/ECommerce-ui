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
    pageSize = 20;
    expandedOrderId: string | null = null;

    constructor(private httpService: HttpService) { }

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders(page: number = 1): void {
        this.loading = true;
        this.httpService.GET(`${OrderController.GetOrders}?pageNumber=${page}&pageSize=${this.pageSize}`).subscribe((res: any) => {
            if (res && res.succeeded && res.data) {
                this.orders = res.data.items || [];
                this.totalCount = res.data.totalCount || 0;
                this.pageNumber = res.data.pageNumber || 1;
                this.pageSize = res.data.pageSize || 20;
            }
            this.loading = false;
        }, () => this.loading = false);
    }

    toggleDetails(orderId: string): void {
        this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
    }
}
