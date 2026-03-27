import { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/pay/pay.component').then((m) => m.PayComponent),
  },
  {
    path: 'result',
    loadComponent: () =>
      import('./pages/result/result.component').then((m) => m.ResultComponent),
  },
  { path: '**', redirectTo: '' },
]
