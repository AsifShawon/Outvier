import api from '../api';
import { ApiResponse } from '@/types/api';

export interface BudgetPlan {
  _id: string;
  name: string;
  currency: string;
  tuitionFeesAud: number;
  livingExpensesAud: number;
  scholarshipAud: number;
  partTimeIncomeAud: number;
  savingsAud: number;
  durationYears: number;
  notes?: string;
  isDefault: boolean;
  createdAt: string;
}

export const budgetPlanApi = {
  getAll: (): Promise<{ data: ApiResponse<BudgetPlan[]> }> =>
    api.get('/budget'),

  create: (data: any): Promise<{ data: ApiResponse<BudgetPlan> }> =>
    api.post('/budget', data),

  update: (id: string, data: any): Promise<{ data: ApiResponse<BudgetPlan> }> =>
    api.patch(`/budget/${id}`, data),

  delete: (id: string): Promise<{ data: ApiResponse<void> }> =>
    api.delete(`/budget/${id}`),
};
