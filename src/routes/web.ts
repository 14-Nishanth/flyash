import { Router, Request, Response } from 'express';
import { requireAuth } from './api';
import { DashboardService } from '../services/dashboardService';
import { PartyService } from '../services/partyService';
import { MaterialService } from '../services/materialService';
import { JobWageService } from '../services/jobWageService';
import { EmployeeService } from '../services/employeeService';
import { ExpenseService } from '../services/expenseService';
import { AlertService } from '../services/alertService';

const webRouter = Router();

webRouter.get('/login', (req: Request, res: Response) => {
  res.render('login', { error: null });
});

webRouter.get('/', requireAuth, async (req: any, res: Response) => {
  try {
    const data = await DashboardService.getDashboardData();
    res.render('dashboard', { user: req.user, ...data });
  } catch (err: any) {
    res.render('dashboard', { user: req.user, error: err.message });
  }
});

webRouter.get('/parties', requireAuth, async (req: any, res: Response) => {
  const parties = await PartyService.getAllParties();
  res.render('parties', { user: req.user, parties });
});

webRouter.get('/parties/:id/ledger', requireAuth, async (req: any, res: Response) => {
  const data = await PartyService.getPartyLedger(Number(req.params.id));
  res.render('ledger', { user: req.user, ...data });
});

webRouter.get('/materials', requireAuth, async (req: any, res: Response) => {
  const inwards = await MaterialService.getInwards();
  const outwards = await MaterialService.getOutwards();
  const parties = await PartyService.getAllParties();
  const rawStocks = await MaterialService.getRawMaterialStockSummary();
  const productStocks = await MaterialService.getProductStockSummary();
  res.render('materials', { user: req.user, inwards, outwards, parties, rawStocks, productStocks });
});

webRouter.get('/jobs', requireAuth, async (req: any, res: Response) => {
  const jobs = await JobWageService.getJobWageEntries();
  const rates = await JobWageService.getJobRates();
  const groups = await JobWageService.getGroups();
  const employees = await EmployeeService.getAllEmployees();
  const parties = await PartyService.getAllParties();
  res.render('jobs', { user: req.user, jobs, rates, groups, employees, parties });
});

webRouter.get('/employees', requireAuth, async (req: any, res: Response) => {
  const employees = await EmployeeService.getAllEmployees();
  const today = new Date().toISOString().split('T')[0];
  const attendance = await EmployeeService.getAttendanceForDate(today);
  res.render('employees', { user: req.user, employees, attendance, today });
});

webRouter.get('/wages', requireAuth, async (req: any, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const wages = await EmployeeService.calculateEmployeeWages(today, today);
  res.render('wages', { user: req.user, wages, from: today, to: today });
});

webRouter.get('/expenses', requireAuth, async (req: any, res: Response) => {
  const expenses = await ExpenseService.getExpenses();
  const categories = await ExpenseService.getExpenseCategorySummary();
  res.render('expenses', { user: req.user, expenses, categories });
});

webRouter.get('/settings', requireAuth, async (req: any, res: Response) => {
  const settings = await AlertService.getSettings();
  res.render('settings', { user: req.user, settings });
});

export default webRouter;
