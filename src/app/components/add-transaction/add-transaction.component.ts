// src/app/components/add-transaction/add-transaction.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, Tx } from '../../services/api.service';

@Component({
  selector: 'app-add-transaction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-transaction.component.html',
  styleUrls: ['./add-transaction.component.scss']
})
export class AddTransactionComponent {
  model: Tx = {
    type: 'expense',                               // default
    amount: 0,
    category: 'Food',                              // safe default
    date: new Date().toISOString().slice(0, 10),   // YYYY-MM-DD
    note: ''
  };

  saving = false;
  error = '';

  constructor(private api: ApiService, private router: Router) {}

  saveTransaction() {
    // safer validation
    if (
      !this.model.type ||                       // type missing
      !this.model.category?.trim() ||           // category empty/blank
      !this.model.date ||                       // no date
      !this.model.note?.trim() ||               // note empty/blank
      this.model.amount === null ||             // no amount
      isNaN(Number(this.model.amount)) ||       // not a number
      Number(this.model.amount) <= 0            // negative or zero
    ) {
      alert('Please fill in all fields with valid values.');
      return;
    }

    this.saving = true;
    this.error = '';

    // call Flask API: POST /transactions (Authorization header auto-added by interceptor)
    this.api.addTransaction({
      type: this.model.type,
      category: this.model.category,
      amount: Number(this.model.amount),
      date: this.model.date,
      note: this.model.note.trim()
    }).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/transactions']);
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.error || 'Failed to save transaction';
        alert(this.error);
      }
    });
  }
}
