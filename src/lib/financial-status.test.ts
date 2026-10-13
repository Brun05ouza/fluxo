import { describe, expect, it } from 'vitest';
import { getIncomeTotal, getExpenseTotal, getSpentByCategory, filterTransactionsByMonth } from './transaction-utils';
import type { Transaction } from '@/types/database';
import { computeForecast } from './forecast';
const tx = (amount: number, patch: Partial<Transaction> = {}): Transaction => ({ id:'1',user_id:'u',title:'Teste',description:null,category:'Casa',amount,date:'2026-10-13',payment_method:'Pix',tags:[],is_recurring:false,created_at:'',...patch });
describe('valores realizados e previstos',()=>{
  it('salário previsto só conta como recebido após confirmação',()=>{
    expect(getIncomeTotal([tx(3000,{is_paid:false,settlement_status:'pending'})])).toBe(0);
    expect(getIncomeTotal([tx(3000,{is_paid:true,settlement_status:'settled'})])).toBe(3000);
  });
  it('ignora despesas canceladas, transferências e pagamentos de fatura duplicados',()=>{
    const rows=[tx(-100),tx(-50,{is_ignored:true}),tx(-200,{is_paid:false}),tx(-100,{transaction_kind:'invoice_payment'}),tx(-100,{transaction_kind:'transfer'})];
    expect(getExpenseTotal(rows)).toBe(100);
    expect(getSpentByCategory(rows)).toEqual({Casa:100});
  });
  it('orçamento mensal não inclui gastos de outros meses',()=>{
    expect(getSpentByCategory(filterTransactionsByMonth([tx(-100),tx(-500,{date:'2026-09-13'})],2026,10))).toEqual({Casa:100});
  });
  it('conta mensal não vira gasto diário e previsões reservam o orçamento',()=>{
    const now=new Date();
    const month=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const rows=[tx(-100,{date:`${month}-01`,planning_item_id:'fixed-light'}),tx(-50,{date:`${month}-02`,is_paid:false,settlement_status:'pending',planning_item_id:'fixed-water'})];
    const result=computeForecast(month,rows,[{id:'b',user_id:'u',category:'Casa',limit_amount:200,created_at:''}]);
    expect(result.totalSpent).toBe(100);
    expect(result.forecastEndMonth).toBe(150);
    expect(result.byCategory[0].forecastEndMonth).toBe(150);
    expect(result.suggestedDailyLimit).toBe(result.daysRemaining ? 50/result.daysRemaining : 0);
  });
});
