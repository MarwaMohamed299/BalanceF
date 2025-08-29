// balancef.service.ts
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {  AccountStatementResponseDto } from '../DTOs/AccountReadDtos/AccountStatementDto';
import { PageResult } from '../DTOs/PagedResult/PagedResult';

export interface AccountLookup {
  accountId: string;
  accountName: string;
}

@Injectable({ providedIn: 'root' })
export class BalancefService {
  private baseUrl = 'https://localhost:7028/api/Accounts';

  constructor(private http: HttpClient) {}

  getAccountsAutoComplete(search: string): Observable<AccountLookup[]> {
    const params = new HttpParams().set('search', search);

    return this.http.get<any>(`${this.baseUrl}/autocomplete`, { params }).pipe(
      map((res: any) => {
        // نعدّل الشكل لو الـ API بيرجع {data:[...]} أو مصفوفة مباشرة
        const arr = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        return arr
          .map((x: any) => ({
            accountId: x.accountId ?? x.id ?? x.accountID ?? x.code,
            accountName: x.accountName ?? x.name ?? x.account ?? x.title
          }))
          .filter((x: AccountLookup) => !!x.accountId && !!x.accountName);
      }),
      catchError(() => of([])) // ما نكسرش الـ UI لو حصل خطأ
    );
  }

   getAccounts(
  accountId: number,
  from: string, 
  to: string, 
  pageNumber: number, 
  pageSize: number
): Observable<AccountStatementResponseDto> { // ✅ النوع الصحيح
  const params = new HttpParams()
    .set('from', from)
    .set('to', to)
    .set('pageNumber', pageNumber.toString())
    .set('pageSize', pageSize.toString());

  return this.http.get<AccountStatementResponseDto>(
    `${this.baseUrl}/${accountId}`,
    { params }
  );
}


}



