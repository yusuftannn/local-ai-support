import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface AnalysisResult {
  category: 'hata' | 'ozellik_istegi' | 'soru' | 'diger';
  priority: 'dusuk' | 'normal' | 'yuksek';
  topic: string;
  summary: string;
  reply: string;
}

export interface Metrics {
  evaluated_count: number;
  category_accuracy: number | null;
  priority_accuracy: number | null;
  category_counts: Record<string, number>;
  priority_counts: Record<string, number>;
}

export interface Health {
  ollama_available: boolean;
  model: string;
  model_ready: boolean;
}

export interface FeedbackItem {
  message: string;
  model: string;
  predicted_category: string;
  corrected_category: string;
  predicted_priority: string;
  corrected_priority: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  analyze(message: string): Observable<AnalysisResult> {
    return this.http.post<AnalysisResult>('/api/analyze', { message }).pipe(
      map((result) => {
        if (!result || typeof result.reply !== 'string' || typeof result.summary !== 'string') {
          throw new Error('Analiz yanıtı beklenen formatta değil.');
        }
        return result;
      }),
    );
  }

  health(): Observable<Health> {
    return this.http.get<Health>('/api/health');
  }

  metrics(): Observable<Metrics> {
    return this.http.get<Metrics>('/api/feedback/metrics');
  }

  saveFeedback(payload: {
    message: string;
    predicted_category: string;
    corrected_category: string;
    predicted_priority: string;
    corrected_priority: string;
  }): Observable<{ saved: boolean }> {
    return this.http.post<{ saved: boolean }>('/api/feedback', payload);
  }

  feedback(limit: number, offset: number, search: string, category: string, priority: string) {
    let params = new HttpParams()
      .set('limit', limit)
      .set('offset', offset)
      .set('search', search);
    if (category) params = params.set('category', category);
    if (priority) params = params.set('priority', priority);
    return this.http.get<{ total: number; items: FeedbackItem[] }>('/api/feedback', { params });
  }
}
