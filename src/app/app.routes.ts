import { Routes } from '@angular/router';
import { BalanceTableComponent } from './balance-table/balance-table.component';

export const routes: Routes = [
  { path: '', component: BalanceTableComponent },
  { path: '**', redirectTo: '' }
];
