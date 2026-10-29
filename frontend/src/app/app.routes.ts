import { Routes } from '@angular/router';
import { AnalyzeComponent } from './analyze.component';
import { DashboardComponent } from './dashboard.component';
import { HistoryComponent } from './history.component';

export const routes: Routes = [
  { path: '', component: AnalyzeComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'history', component: HistoryComponent },
  { path: '**', redirectTo: '' },
];
