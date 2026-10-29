import { Component, OnInit, inject } from '@angular/core';
import { PercentPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, Health, Metrics } from './api.service';
import { LayoutComponent } from './layout.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [PercentPipe, RouterLink, LayoutComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);
  metrics: Metrics | null = null;
  health: Health | null = null;
  failed = false;
  readonly categoryLabels = { hata: 'Hata bildirimi', ozellik_istegi: 'Özellik isteği', soru: 'Soru', diger: 'Diğer' };
  readonly priorityLabels = { yuksek: 'Yüksek', normal: 'Normal', dusuk: 'Düşük' };

  ngOnInit() {
    this.api.metrics().subscribe({ next: (value) => this.metrics = value, error: () => this.failed = true });
    this.api.health().subscribe({ next: (value) => this.health = value, error: () => this.failed = true });
  }
  entries(counts: Record<string, number> | undefined, labels: Record<string, string>) {
    return Object.entries(labels).map(([key, label]) => ({ key, label, count: counts?.[key] || 0 }));
  }
  maximum(counts: Record<string, number> | undefined) { return Math.max(0, ...Object.values(counts || {})); }
}
