import { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'transactions',
    pathMatch: 'full',
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./pages/transactions/transaction-list/transaction-list.component').then(
        (m) => m.TransactionListComponent,
      ),
  },
  {
    path: 'transactions/:id',
    loadComponent: () =>
      import('./pages/transactions/transaction-detail/transaction-detail.component').then(
        (m) => m.TransactionDetailComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'transactions',
  },
]
