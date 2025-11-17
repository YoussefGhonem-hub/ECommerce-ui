import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerOrdersComponent } from './customer-orders.component';
import { CustomerOrdersRoutingModule } from './customer-orders-routing.module';

@NgModule({
    declarations: [CustomerOrdersComponent],
    imports: [CommonModule, CustomerOrdersRoutingModule],
    exports: [CustomerOrdersComponent]
})
export class CustomerOrdersModule { }
