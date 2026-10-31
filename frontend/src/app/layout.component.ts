import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="topbar">
        <a class="brand" routerLink="/">
          <span class="brand-mark">AI</span><span>Talep Analizi</span>
        </a>
        <nav class="nav" aria-label="Sayfa gezinmesi">
          <a routerLink="/">Ana sayfa</a>
          <a routerLink="/dashboard">Yönetim paneli</a>
          <a routerLink="/history">Geçmiş</a>
          <a href="/docs">API dokümantasyonu</a>
        </nav>
      </div>
      <ng-content />
      <footer class="footer">AI Talep Analizi · Destek operasyonları için akıllı çalışma alanı</footer>
    </div>
  `,
})
export class LayoutComponent {
  @Input() title = '';
}
