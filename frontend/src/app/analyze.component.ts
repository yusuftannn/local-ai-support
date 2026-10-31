import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService, AnalysisResult, Metrics } from './api.service';
import { LayoutComponent } from './layout.component';

@Component({
  selector: 'app-analyze',
  standalone: true,
  imports: [FormsModule, PercentPipe, LayoutComponent],
  templateUrl: './analyze.component.html',
})
export class AnalyzeComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  message = '';
  result: AnalysisResult | null = null;
  metrics: Metrics | null = null;
  status = 'Model bağlantısı kontrol ediliyor…';
  error = '';
  requestId = '';
  loading = false;
  savingFeedback = false;
  consent = false;
  correctedCategory = 'hata';
  correctedPriority = 'normal';
  feedbackStatus = '';

  ngOnInit() {
    this.loadMetrics();
    this.api.health().subscribe({
      next: (health) => {
        this.status = health.model_ready
          ? `Model hazır · ${health.model}`
          : health.ollama_available ? 'Model indirilmeli' : 'Ollama erişilemedi';
      },
      error: () => this.status = 'Sunucu ve model durumu kontrol edilemedi.',
    });
  }

  loadMetrics() {
    this.api.metrics().subscribe({ next: (metrics) => this.metrics = metrics });
  }

  useExample(text: string) {
    this.message = text;
  }

  analyze() {
    if (this.message.trim().length < 5) return;
    this.loading = true;
    this.error = '';
    this.requestId = '';
    this.result = null;
    this.api.analyze(this.message).pipe(
      finalize(() => {
        this.loading = false;
        this.changeDetector.markForCheck();
      }),
    ).subscribe({
      next: (result) => {
        this.result = result;
        this.correctedCategory = result.category;
        this.correctedPriority = result.priority;
        this.changeDetector.markForCheck();
      },
      error: (error) => {
        this.error = typeof error.error?.detail === 'string'
          ? error.error.detail
          : 'Analiz yanıtı alınamadı. Sunucu loglarını kontrol edin.';
        this.requestId = error.headers?.get('X-Request-ID') || '';
        this.changeDetector.markForCheck();
      },
    });
  }

  saveFeedback() {
    if (!this.result || !this.consent || this.savingFeedback) return;
    this.savingFeedback = true;
    this.feedbackStatus = '';
    this.api.saveFeedback({
      message: this.message,
      predicted_category: this.result.category,
      corrected_category: this.correctedCategory,
      predicted_priority: this.result.priority,
      corrected_priority: this.correctedPriority,
    }).subscribe({
      next: () => {
        this.feedbackStatus = 'Değerlendirme kaydedildi.';
        this.savingFeedback = false;
        this.loadMetrics();
      },
      error: () => {
        this.feedbackStatus = 'Değerlendirme kaydedilemedi.';
        this.savingFeedback = false;
      },
    });
  }

  async copyReply() {
    if (!this.result) return;
    try {
      await navigator.clipboard.writeText(this.result.reply);
      this.feedbackStatus = 'Yanıt taslağı kopyalandı.';
    } catch {
      this.feedbackStatus = 'Yanıt taslağı kopyalanamadı. Metni elle seçin.';
    }
  }
}
