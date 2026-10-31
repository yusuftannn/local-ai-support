import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, Subject } from 'rxjs';
import { ApiService, FeedbackItem } from './api.service';
import { LayoutComponent } from './layout.component';

@Component({ selector: 'app-history', standalone: true, imports: [FormsModule, LayoutComponent], templateUrl: './history.component.html' })
export class HistoryComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly filterChanges = new Subject<void>();
  readonly pageSize = 20;
  offset = 0; total = 0; items: FeedbackItem[] = []; search = ''; category = ''; priority = ''; failed = false;
  readonly labels: Record<string, string> = { hata: 'Hata bildirimi', ozellik_istegi: 'Özellik isteği', soru: 'Soru', diger: 'Diğer', dusuk: 'Düşük', normal: 'Normal', yuksek: 'Yüksek' };
  ngOnInit() {
    this.filterChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.offset = 0;
        this.load();
      });
    this.load();
  }
  load() { this.api.feedback(this.pageSize, this.offset, this.search.trim(), this.category, this.priority).subscribe({ next: (data) => { this.total = data.total; this.items = data.items; this.failed = false; }, error: () => { this.failed = true; this.items = []; } }); }
  filterChanged() { this.filterChanges.next(); }
  previous() { this.offset = Math.max(0, this.offset - this.pageSize); this.load(); }
  next() { if (this.offset + this.pageSize < this.total) { this.offset += this.pageSize; this.load(); } }
  pageCount() { return Math.ceil(this.total / this.pageSize); }
  label(value: string) { return this.labels[value] || value; }
  date(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }); }
}
