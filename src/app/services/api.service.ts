// src/app/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../environments/environment';

const BASE = environment.API_URL; // ← dev uses 127.0.0.1, prod uses your Azure URL

export interface Tx {
  id?: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  date: string;   // YYYY-MM-DD
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private LS_KEY = 'transactions';

  constructor(private http: HttpClient) {}

  // --- Auth ---
  register(payload: { email: string; password: string }) {
    return this.http.post(`${BASE}/auth/register`, payload);
  }

  login(payload: { email: string; password: string }) {
    return this.http.post<{ access_token: string; email: string }>(
      `${BASE}/auth/login`,
      payload
    );
  }

  // --- Transactions ---
  getTransactions(): Observable<Tx[]> {
    return this.http.get<{ transactions: Tx[] }>(`${BASE}/transactions`).pipe(
      map(res => res.transactions || []),
      catchError(() => of(this.getAllLocal()))
    );
  }

  addTransaction(tx: Tx): Observable<Tx> {
    return this.http.post<Tx>(`${BASE}/transactions`, tx).pipe(
      catchError(() => of(this.createLocal(tx)))
    );
  }

  updateTransaction(id: string, patch: Partial<Tx>): Observable<Tx> {
    return this.http.put<Tx>(`${BASE}/transactions/${id}`, patch).pipe(
      catchError(() => of(this.updateLocal(id, patch)!))
    );
  }

  deleteTransaction(id: string): Observable<{ deleted: boolean }> {
    return this.http.delete<{ deleted: boolean }>(`${BASE}/transactions/${id}`).pipe(
      catchError(() => {
        this.deleteLocal(id);
        return of({ deleted: true });
      })
    );
  }

  // --- Dashboard helpers ---
  // If your backend route is `/summary` (as previously), keep this:
  getMonthlySummary(): Observable<any> {
    return this.http.get(`${BASE}/summary`);
  }
  // If your backend actually expects `/summary/month`, change the line above to:
  // return this.http.get(`${BASE}/summary/month`);

  getBudget(): Observable<{ limit: number; threshold?: number }> {
    return this.http.get<{ limit: number; threshold?: number }>(`${BASE}/budget`);
  }

  upsertBudget(limit: number, threshold: number = 90): Observable<{ limit: number; threshold: number }> {
    return this.http.put<{ limit: number; threshold: number }>(`${BASE}/budget`, { limit, threshold });
  }

  // --- Export CSV ---
  exportTransactionsCsv(type?: 'income' | 'expense'): Observable<Blob> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get(`${BASE}/transactions/export/csv`, {
      responseType: 'blob',
      params
    });
  }

  // --- Local storage fallback ---
  private getAllLocal(): Tx[] {
    try {
      return JSON.parse(localStorage.getItem(this.LS_KEY) || '[]');
    } catch {
      return [];
    }
  }

  private setAllLocal(list: Tx[]) {
    localStorage.setItem(this.LS_KEY, JSON.stringify(list));
  }

  private createLocal(tx: Tx): Tx {
    const list = this.getAllLocal();
    const withId: Tx = {
      ...tx,
      id: (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now())
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

  private deleteLocal(id: string) {
    this.setAllLocal(this.getAllLocal().filter(t => t.id !== id));
  }
}
