// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Tx {
  id?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;   // YYYY-MM-DD
  note?: string;
}

export interface LoginResponse {
  token?: string;
  access_token?: string;
  email?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE = environment.API_URL.replace(/\/$/, '');
  private readonly HTTP_OPTS = {}; // no cookies for JWT
  private readonly LS_KEY = 'transactions';

  constructor(private http: HttpClient) {}

  /* -------- Auth -------- */
  register(payload: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.BASE}/auth/register`, payload, this.HTTP_OPTS);
  }

  login(payload: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.BASE}/auth/login`, payload, this.HTTP_OPTS);
  }

  me(): Observable<any> {
    return this.http.get(`${this.BASE}/auth/me`, this.HTTP_OPTS);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.BASE}/auth/logout`, {}, this.HTTP_OPTS);
  }

  /* ---- Transactions ---- */
  getTransactions(): Observable<Tx[]> {
    return this.http
      .get<{ transactions?: Tx[] }>(`${this.BASE}/transactions`, this.HTTP_OPTS)
      .pipe(
        map(res => res?.transactions ?? []),
        catchError(() => of(this.getAllLocal()))
      );
  }

  addTransaction(tx: Tx): Observable<Tx> {
    return this.http
      .post<Tx>(`${this.BASE}/transactions`, tx, this.HTTP_OPTS)
      .pipe(catchError(() => of(this.createLocal(tx))));
  }

  updateTransaction(id: string, patch: Partial<Tx>): Observable<Tx> {
    return this.http
      .put<Tx>(`${this.BASE}/transactions/${encodeURIComponent(id)}`, patch, this.HTTP_OPTS)
      .pipe(catchError(() => of(this.updateLocal(id, patch) as Tx)));
  }

  deleteTransaction(id: string): Observable<{ deleted: boolean }> {
    return this.http
      .delete<{ deleted: boolean }>(`${this.BASE}/transactions/${encodeURIComponent(id)}`, this.HTTP_OPTS)
      .pipe(
        catchError(() => {
          this.deleteLocal(id);
          return of({ deleted: true });
        })
      );
  }

  /* --- Summary / Budget / Export --- */
  getMonthlySummary(): Observable<any> {
    return this.http.get(`${this.BASE}/summary`, this.HTTP_OPTS);
  }

  getBudget(): Observable<{ limit: number; threshold?: number }> {
    return this.http.get<{ limit: number; threshold?: number }>(
      `${this.BASE}/budget`,
      this.HTTP_OPTS
    );
  }

  upsertBudget(limit: number, threshold = 90): Observable<{ limit: number; threshold: number }> {
    return this.http.put<{ limit: number; threshold: number }>(
      `${this.BASE}/budget`,
      { limit, threshold },
      this.HTTP_OPTS
    );
  }

  // ✅ Fix: make HttpClient return Blob, not ArrayBuffer
  exportTransactionsCsv(type?: 'income' | 'expense'): Observable<Blob> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);

    return this.http.get<Blob>(`${this.BASE}/transactions/export/csv`, {
      params,
      // Angular typing trick: tells HttpClient this is a blob response
      responseType: 'blob' as 'json'
    });
  }

  /* --- Local storage fallback --- */
  private getAllLocal(): Tx[] {
    try {
      return JSON.parse(localStorage.getItem(this.LS_KEY) || '[]') as Tx[];
    } catch {
      return [];
    }
  }

  private setAllLocal(list: Tx[]): void {
    localStorage.setItem(this.LS_KEY, JSON.stringify(list));
  }

  private createLocal(tx: Tx): Tx {
    const list = this.getAllLocal();
    const withId: Tx = {
      ...tx,
      id:
        (globalThis.crypto as any)?.randomUUID
          ? (globalThis.crypto as any).randomUUID()
          : String(Date.now())
    };
    list.push(withId);
    this.setAllLocal(list);
    return withId;
  }

  private updateLocal(id: string, patch: Partial<Tx>): Tx | null {
    const list = this.getAllLocal();
    const i = list.findIndex(t => t.id === id);
    if (i >= 0) {
      list[i] = { ...list[i], ...patch };
      this.setAllLocal(list);
      return list[i];
    }
    return null;
  }

  private deleteLocal(id: string): void {
    this.setAllLocal(this.getAllLocal().filter(t => t.id !== id));
  }
}
