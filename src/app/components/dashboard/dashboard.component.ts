import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import { NgChartsModule } from 'ng2-charts';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

type Budget = { limit: number; threshold?: number };
type Scope = 'all' | 'month';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgChartsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  // header
  userEmail: string | null = null;

  // all-time list & cards
  transactions: any[] = [];
  totalTransactions = 0;
  totalIncome = 0;        // all-time
  totalExpenses = 0;      // all-time
  totalAmount = 0;        // all-time (income + expense)

  // all-time chart sources
  allIncome = 0;
  allExpenses = 0;
  allCategoryTotals: Record<string, number> = {};

  // monthly summary (alert + monthly charts)
  monthIncome = 0;
  monthExpenses = 0;
  monthCategoryTotals: Record<string, number> = {};
  monthlySpending = 0;

  // budget
  budget: Budget = { limit: 50, threshold: 90 };
  budgetLimitInput = 50;
  budgetThresholdInput = 90;
  savingBudget = false;

  // chart scope
  chartScope: Scope = 'all';

  loading = true;
  error = '';

  // bar palette
  private palette = [
    '#3f51b5', '#e91e63', '#4caf50', '#ff9800', '#9c27b0',
    '#03a9f4', '#795548', '#00bcd4', '#8bc34a', '#ff5722'
  ];

  // charts
  barChartType: 'bar' = 'bar';
  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Spending by Category',
      maxBarThickness: 48,
      borderRadius: 6,
      backgroundColor: []
    }]
  };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: {
      x: { ticks: { autoSkip: false }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0 }, suggestedMax: 10 }
    },
    layout: { padding: { top: 8, right: 8, bottom: 8, left: 8 } }
  };

  pieChartType: 'pie' = 'pie';
  pieChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Income', 'Expenses'],
    datasets: [{
      data: [],
      backgroundColor: ['#4caf50', '#f44336'],
      borderColor: '#ffffff',
      borderWidth: 2
    }]
  };
  pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    layout: { padding: { top: 8, right: 8, bottom: 8, left: 8 } }
  };

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.userEmail = this.auth.email;
    this.fetchSummary();       // monthly
    this.fetchTransactions();  // all-time
    this.fetchBudget();        // form + alert
  }

  // ---------- API ----------
  private fetchSummary() {
    // backend: GET /summary/month -> { totalIncome, totalExpenses, categoryTotals, ... }
    this.api.getMonthlySummary().subscribe({
      next: (s: any) => {
        this.monthIncome         = Number(s?.totalIncome || 0);
        this.monthExpenses       = Number(s?.totalExpenses || 0);
        this.monthCategoryTotals = s?.categoryTotals || {};
        this.monthlySpending     = this.monthExpenses;
        if (this.chartScope === 'month') this.prepareCharts();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Failed to load monthly summary';
        this.loading = false;
      }
    });
  }

  private fetchTransactions() {
    this.api.getTransactions().subscribe({
      next: (list: any[]) => {
        this.transactions = Array.isArray(list) ? list : [];
        this.totalTransactions = this.transactions.length;

        this.totalIncome = this.transactions
          .filter(t => t.type === 'income')
          .reduce((s, t) => s + Number(t.amount || 0), 0);

        this.totalExpenses = this.transactions
          .filter(t => t.type === 'expense')
          .reduce((s, t) => s + Number(t.amount || 0), 0);

        this.totalAmount = this.totalIncome + this.totalExpenses;

        this.allIncome = this.totalIncome;
        this.allExpenses = this.totalExpenses;
        this.allCategoryTotals = this.groupExpensesByCategory(this.transactions);

        if (this.chartScope === 'all') this.prepareCharts();
      },
      error: (err: any) => console.error('Transaction fetch failed:', err)
    });
  }

  private fetchBudget() {
    this.api.getBudget().subscribe({
      next: (b) => {
        this.budget = b || { limit: 50, threshold: 90 };
        this.budgetLimitInput = Number(this.budget.limit || 50);
        this.budgetThresholdInput = Number(this.budget.threshold || 90);
      },
      error: () => {
        this.budget = { limit: 50, threshold: 90 };
        this.budgetLimitInput = 50;
        this.budgetThresholdInput = 90;
      }
    });
  }

  // ---------- helpers ----------
  private groupExpensesByCategory(list: any[]): Record<string, number> {
    const out: Record<string, number> = {};
    list.filter(t => t.type === 'expense').forEach(t => {
      const c = t.category || 'Other';
      out[c] = (out[c] || 0) + Number(t.amount || 0);
    });
    return out;
  }

  onScopeChange() { this.prepareCharts(); }

  prepareCharts(): void {
    const catTotals = this.chartScope === 'all' ? this.allCategoryTotals : this.monthCategoryTotals;
    const labels = Object.keys(catTotals);
    const data = Object.values(catTotals) as number[];

    const max = data.length ? Math.max(...data) : 0;
    this.barChartOptions = {
      ...this.barChartOptions,
      scales: {
        x: { ticks: { autoSkip: false }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0 }, suggestedMax: max ? max * 1.25 : 10 }
      }
    };

    const barColors = labels.map((_, i) => this.palette[i % this.palette.length]);

    this.barChartData = {
      labels,
      datasets: [{ ...this.barChartData.datasets[0], data, backgroundColor: barColors }]
    };

    const pieIncome  = this.chartScope === 'all' ? this.allIncome   : this.monthIncome;
    const pieExpense = this.chartScope === 'all' ? this.allExpenses : this.monthExpenses;

    this.pieChartData = {
      labels: ['Income', 'Expenses'],
      datasets: [{
        ...this.pieChartData.datasets[0],
        data: [pieIncome, pieExpense],
        backgroundColor: ['#4caf50', '#f44336'],
        borderColor: '#ffffff',
        borderWidth: 2
      }]
    };
  }

  // ----- Budget form -----
  saveBudget() {
    const limit = Number(this.budgetLimitInput);
    const threshold = Number(this.budgetThresholdInput);
    if (!isFinite(limit) || limit <= 0) { alert('Please enter a valid positive budget limit.'); return; }
    this.savingBudget = true;
    this.api.upsertBudget(limit, threshold).subscribe({
      next: (b) => {
        this.savingBudget = false;
        this.budget = b;
        alert('Budget updated!');
        this.fetchSummary();
      },
      error: () => { this.savingBudget = false; alert('Failed to save budget.'); }
    });
  }

  // stat helpers
  getHighestIncome(): number {
    const a = this.transactions.filter(t => t.type === 'income').map(t => Number(t.amount || 0));
    return a.length ? Math.max(...a) : 0;
  }
  getLowestIncome(): number {
    const a = this.transactions.filter(t => t.type === 'income').map(t => Number(t.amount || 0));
    return a.length ? Math.min(...a) : 0;
  }
  getAverageIncome(): number {
    const a = this.transactions.filter(t => t.type === 'income').map(t => Number(t.amount || 0));
    const s = a.reduce((sum, v) => sum + v, 0);
    return a.length ? s / a.length : 0;
  }
  getHighestExpense(): number {
    const a = this.transactions.filter(t => t.type === 'expense').map(t => Number(t.amount || 0));
    return a.length ? Math.max(...a) : 0;
  }
  getLowestExpense(): number {
    const a = this.transactions.filter(t => t.type === 'expense').map(t => Number(t.amount || 0));
    return a.length ? Math.min(...a) : 0;
  }
  getAverageExpense(): number {
    const a = this.transactions.filter(t => t.type === 'expense').map(t => Number(t.amount || 0));
    const s = a.reduce((sum, v) => sum + v, 0);
    return a.length ? s / a.length : 0;
  }

  // alert visibility
  get showAlert(): boolean {
    return (this.budget.limit || 0) > 0 && this.monthlySpending >= (this.budget.limit || 0);
  }
  get monthlyLimit(): number { return this.budget.limit || 0; }
}
