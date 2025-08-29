export interface AccountStatementRowDto {
  date: string; 
  previousBalance: number;
  debit: number;
  credit: number;
  finalBalance: number;
  remarks: string;
}

export interface AccountStatementResponseDto {
  data: AccountStatementRowDto[];  
  totalCount: number;
}

export interface AccountStatementDto {
  data: AccountStatementRowDto[];
  accountId: number;
  accountName: string;
  totalDebit: number;
  totalCredit: number;
  finalBalance: number;
}
