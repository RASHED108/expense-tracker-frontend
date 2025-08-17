import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, Tx } from '../../services/api.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
  transactions: Tx[] = [];
  loading = true;
  error = '';

  // Edit modal
  editOpen = false;
  editing: Tx | null = null;
  editingId = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.fetch(); }

  fetch() {
    this.loading = true;
    this.api.getTransactions().subscribe({
      next: (list) => { this.transactions = list || []; this.loading = false; },
      error: () => { this.loading = false; this.error = 'Failed to load transactions.'; }
    });
  }

  get incomes(): Tx[]  { return this.transactions.filter(t => t.type === 'income');  }
  get expenses(): Tx[] { return this.transactions.filter(t => t.type === 'expense'); }

  // ----- Edit -----
  openEdit(tx: Tx) {
    this.editingId = tx.id || '';
    this.editing = { ...tx };
    this.editOpen = true;
  }
  closeEdit() {
    this.editOpen = false;
    this.editing = null;
    this.editingId = '';
  }
  saveEdit() {
    if (!this.editing || !this.editingId) return;
    const e = this.editing;
    if (!e.type || !e.category || !e.date || !e.note || !isFinite(Number(e.amount)) || Number(e.amount) <= 0) {
      alert('Please fill all fields with valid values.');
      return;
    }
    const patch: Partial<Tx> = {
      type: e.type,
      category: e.category,
      amount: Number(e.amount),
      date: e.date,
      note: e.note.trim()
    };
    this.api.updateTransaction(this.editingId, patch).subscribe({
      next: (updated) => {
        const i = this.transactions.findIndex(t => t.id === this.editingId);
        if (i >= 0) this.transactions[i] = updated;
        this.closeEdit();
      },
      error: () => alert('Failed to update transaction.')
    });
  }

  // ----- Delete -----
  delete(id?: string) {
    if (!id) return;
    if (!confirm('Delete this transaction?')) return;
    this.api.deleteTransaction(id).subscribe({
      next: () => this.transactions = this.transactions.filter(t => t.id !== id),
      error: () => alert('Failed to delete.')
    });
  }

  // ----- Export CSV -----
  exportCsv(scope?: 'income'|'expense'|'all') {
    const type = scope === 'all' ? undefined : scope;
    this.api.exportTransactionsCsv(type).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = `transactions_${scope || 'all'}.csv`;
        a.href = url; a.download = filename;
        document.body.appendChild(a);
        a.click(); a.remove();
        URL.revokeObjectURL(url);
      },
      error: () => alert('CSV export failed.')
    });
  }
}
