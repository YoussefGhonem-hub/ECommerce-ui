import { CoreMenu } from '@core/types';

//? DOC: http://localhost:7777/demo/vuexy-angular-admin-dashboard-template/documentation/guide/development/navigation-menus.html#interface

export const menu: CoreMenu[] = [

  // Dashboard
  {
    id: 'dashboard',
    role: ['Admin'],

    title: 'Dashboard',
    translate: 'MENU.DASHBOARD.COLLAPSIBLE',
    type: 'collapsible',
    // role: ['Admin'], //? To hide collapsible based on user role
    icon: 'home',
    badge: {
      title: '2',
      translate: 'MENU.DASHBOARD.BADGE',
      classes: 'badge-light-warning badge-pill'
    },
    children: [
      {
        id: 'analytics',
        title: 'analytics',
        translate: 'MENU.DASHBOARD.ECOMMERCE',
        type: 'item',
        icon: 'circle',
        url: 'dashboard/ecommerce'
      }
    ]
  },
  {
    id: 'apps',
    type: 'section',
    title: 'Manage Products',
    translate: 'MENU.APPS.ECOMMERCE.MANAGE_PRODUCTS',
    icon: 'settings',
    children: [
      {
        id: 'Products',
        title: 'Products',
        translate: 'MENU.APPS.EMAIL',
        type: 'item',
        icon: 'shopping-cart',
        url: 'apps/e-commerce/shop'
      },
      {
        id: 'Orders',
        title: 'Orders',
        translate: 'MENU.APPS.EMAIL',
        type: 'item',
        icon: 'list',
        role: ['Customer'],
        url: 'apps/e-commerce/orders'
      },
      {
        id: 'Orders',
        title: 'Orders',
        translate: 'MENU.APPS.EMAIL',
        type: 'item',
        icon: 'list',
        role: ['Admin'],
        url: 'apps/e-commerce/admin-orders'
      },
      {
        id: 'Products-Attributes',
        title: 'Product Attributes',
        role: ['Admin'],
        translate: 'MENU.APPS.EMAIL',
        type: 'item',
        icon: 'tag',
        url: 'apps/e-commerce/attributes'
      }
      ,
      {
        id: 'Products-Categories',
        role: ['Admin'],
        title: 'Categories',
        translate: 'MENU.APPS.EMAIL',
        type: 'item',
        icon: 'layers',
        url: 'apps/e-commerce/categories'
      }

    ]
  },

];
