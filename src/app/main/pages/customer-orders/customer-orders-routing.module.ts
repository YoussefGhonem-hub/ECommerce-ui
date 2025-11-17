import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerOrdersComponent } from './customer-orders.component';
import { AuthGuard } from 'app/auth/helpers';

const routes: Routes = [
    {
        path: 'orders',
        component: CustomerOrdersComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CustomerOrdersRoutingModule { }
