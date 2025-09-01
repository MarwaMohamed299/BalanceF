import { Component } from '@angular/core';
import { BalancefService, AccountLookup } from '../../Services/balancef.service';
import { AccountStatementDto, AccountStatementResponseDto, AccountStatementRowDto } from '../../DTOs/AccountReadDtos/AccountStatementDto';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { NgxPaginationModule } from 'ngx-pagination';
import * as XLSX from 'xlsx';
import { PageResult } from '../../DTOs/PagedResult/PagedResult';

declare var bootstrap: any;

@Component({
  selector: 'app-balance-table',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxPaginationModule],
  templateUrl: './balance-table.component.html',
  styleUrl: './balance-table.component.css'
})
export class BalanceTableComponent {
  constructor(private balanceService: BalancefService) {}


accounts: AccountStatementDto[] = [];
totalCount: number = 0;
pageNumber: number = 1;
pageSize: number = 50;


 Math = Math; 
  

  pagedStatement: PageResult<AccountStatementDto> | null = null;


  statement: AccountStatementDto | null = null;
  selectedTransaction: AccountStatementRowDto | null = null;
  

  // AutoComplete
  searchTerm = '';
  searchSubject = new Subject<string>();
  suggestions: AccountLookup[] = [];
  showSuggestions = false;
  isLoading = false;
  errorMsg = '';

  // Statement
  selectedAccountId = '';
  accountName = '';
  from = '';
  to = '';


  ngOnInit() {
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => {
          this.isLoading = true;
          this.errorMsg = '';
          return this.balanceService.getAccountsAutoComplete(term);
        })
      )
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.suggestions = res;
          this.showSuggestions = res.length > 0;
        },
        error: () => {
          this.isLoading = false;
          this.suggestions = [];
          this.showSuggestions = false;
          this.errorMsg = 'Failed to load accounts.';
        }
      });
  }

  /** 🔹 Utility: Convert Date to Local ISO string */
  private toLocalISOString(date: Date): string {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 19);
  }
onPageChange(newPage: number): void {
  console.log('Page changed to:', newPage); 
  this.pageNumber = newPage;   
  this.getStatement(); 
}
getStatement() {
  if (!this.from || !this.to || !this.selectedAccountId) {
    alert('Please select account and date range');
    return;
  }

  const fromDate = this.toLocalISOString(new Date(this.from));
  const toDate = this.toLocalISOString(new Date(this.to));

  this.balanceService
    .getAccounts(
      parseInt(this.selectedAccountId),
      fromDate,
      toDate,
      this.pageNumber,
      this.pageSize
    )
    .subscribe({
      next: (res: AccountStatementResponseDto) => {
        console.log('API Response:', res);
        
        if (res && res.data && Array.isArray(res.data)) {
          this.statement = {
            data: res.data,
            accountId: parseInt(this.selectedAccountId),
            accountName: this.accountName,
            totalDebit: res.data.reduce((sum, item) => sum + (item.debit || 0), 0),
            totalCredit: res.data.reduce((sum, item) => sum + (item.credit || 0), 0),
            finalBalance: res.data[res.data.length - 1]?.finalBalance || 0
          };
        }
        
        this.totalCount = res.totalCount || 0;
      },
      error: (error) => {
        console.error('Error:', error);
        alert('Failed to fetch account statement');
      }
    });
}



  /** 🔍 Autocomplete search input */
  onSearchChange() {
    const term = this.searchTerm.trim();
    if (!term) {
      this.suggestions = [];
      this.showSuggestions = false;
      return;
    }
    this.searchSubject.next(term);
  }

  onSearchKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && this.suggestions.length) {
      this.selectAccount(this.suggestions[0]);
      e.preventDefault();
    }
    if (e.key === 'Escape' || e.key === 'Esc') {
      this.showSuggestions = false;
    }
  }

  hideSuggestionsDelayed() {
    setTimeout(() => (this.showSuggestions = false), 150);
  }

  /** ✅ Select account from autocomplete */
  selectAccount(acc: AccountLookup) {
    this.selectedAccountId = acc.accountId;
    this.accountName = acc.accountName;
    this.searchTerm = acc.accountName;
    this.showSuggestions = false;
  }

 

  /** 🖨 Print + Excel Export */
  onPrint() { 
    window.print(); 
  }

fileName = "AccountStatement.xlsx";
onExportExcel() {
  if (!this.statement || !this.statement.data || this.statement.data.length === 0) {
    alert('No data to export');
    return;
  }

  try {
    const exportData = this.statement.data.map((data: AccountStatementRowDto, index: number) => ({
      'Account ID': this.statement?.accountId || '',
      'Account Name': this.statement?.accountName || this.accountName,
      'Date': this.formatDateForExcel(data.date),
      'Previous Balance': data.previousBalance || 0,
      'Debit': data.debit || 0,
      'Credit': data.credit || 0,
      'Final Balance': data.finalBalance || 0
    }));

    const headerInfo = [
      { 'Account ID': `Account: ${this.accountName}`, 'Account Name': '', 'Date': '', 'Previous Balance': '', 'Debit': '', 'Credit': '', 'Final Balance': '' },
      { 'Account ID': `From: ${this.from}`, 'Account Name': `To: ${this.to}`, 'Date': '', 'Previous Balance': '', 'Debit': '', 'Credit': '', 'Final Balance': '' },
      { 'Account ID': '', 'Account Name': '', 'Date': '', 'Previous Balance': '', 'Debit': '', 'Credit': '', 'Final Balance': '' }, 
    ];

    const finalData = [...headerInfo, ...exportData];

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(finalData);

    const columnWidths = [
      { wch: 12 },  // Account ID
      { wch: 20 },  // Account Name
      { wch: 12 },  // Date
      { wch: 15 },  // Previous Balance
      { wch: 12 },  // Debit
      { wch: 12 },  // Credit
      { wch: 15 }   // Final Balance
    ];
    ws['!cols'] = columnWidths;

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Account Statement');

    const fileName = `AccountStatement_${this.accountName.replace(/\s+/g, '_')}_${this.getCurrentDate()}.xlsx`;

    XLSX.writeFile(wb, fileName);

    alert('Exported Successfully');
  } catch (error) {
    console.error('Error in data exportation', error);
    alert('Error in data exportation');
  }
}


private formatDateForExcel(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
  } catch {
    return dateString;
  }
}

private getCurrentDate(): string {
  return new Date().toISOString().slice(0, 10);
}
 openTransaction(row: AccountStatementRowDto) {
    this.selectedTransaction = row;
    
    const modalEl = document.getElementById('transactionModal');
    if (modalEl) {
      new bootstrap.Modal(modalEl).show();
    }
  }

getCleanRemarks(remarks: string): string {
  if (!remarks) return '';
  
  return remarks
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();
}
closeModal() {
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.closest('#transactionModal')) {
    activeElement.blur();
  }
}

}
