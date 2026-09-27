import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { PartyService } from '../services/partyService';
import { MaterialService } from '../services/materialService';
import { JobWageService } from '../services/jobWageService';
import { EmployeeService } from '../services/employeeService';
import { ExpenseService } from '../services/expenseService';
import { DashboardService } from '../services/dashboardService';
import { AlertService } from '../services/alertService';

const router = Router();

// Middleware to authenticate JWT or Cookie session
export const requireAuth = (req: any, res: Response, next: NextFunction) => {
  const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Unauthorized. Please login.' });
    }
    return res.redirect('/login');
  }

  const user = AuthService.verifyToken(token);
  if (!user) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    return res.redirect('/login');
  }

  req.user = user;
  next();
};

// Auth endpoints
router.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '';
  const userAgent = req.headers['user-agent'] || '';

  const result = await AuthService.authenticate(username, password, ip, userAgent);
  if (result.error || !result.token) {
    return res.status(401).json({ error: result.error });
  }

  res.cookie('auth_token', result.token, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ success: true, user: result.user, token: result.token });
});

router.post('/auth/logout', (req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/auth/me', requireAuth, (req: any, res: Response) => {
  res.json({ user: req.user });
});

// Dashboard
router.get('/dashboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = await DashboardService.getDashboardData();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Parties
router.get('/parties', requireAuth, async (req: Request, res: Response) => {
  try {
    const parties = await PartyService.getAllParties();
    res.json(parties);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/parties', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = await PartyService.createParty(req.body);
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/parties/:id/ledger', requireAuth, async (req: Request, res: Response) => {
  try {
    const data = await PartyService.getPartyLedger(Number(req.params.id));
    res.json(data);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.post('/parties/:id/payment', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = await PartyService.recordPayment({
      ...req.body,
      party_id: Number(req.params.id),
    });
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/parties/:id/adjustment', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = await PartyService.addAdjustment({
      ...req.body,
      party_id: Number(req.params.id),
    });
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Materials
router.get('/materials/inward', requireAuth, async (req: Request, res: Response) => {
  try {
    const inwards = await MaterialService.getInwards();
    res.json(inwards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/materials/inward', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = await MaterialService.createInward(req.body);
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/materials/outward', requireAuth, async (req: Request, res: Response) => {
  try {
    const outwards = await MaterialService.getOutwards();
    res.json(outwards);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/materials/outward', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = await MaterialService.createOutward(req.body);
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/materials/stocks', requireAuth, async (req: Request, res: Response) => {
  try {
    const raw = await MaterialService.getRawMaterialStockSummary();
    const products = await MaterialService.getProductStockSummary();
    res.json({ raw, products });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Labor & Piece-Rate Job Wages
router.get('/jobs', requireAuth, async (req: Request, res: Response) => {
  try {
    const jobs = await JobWageService.getJobWageEntries();
    res.json(jobs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/jobs', requireAuth, async (req: Request, res: Response) => {
  try {
    const { workerIds, ...jobData } = req.body;
    const id = await JobWageService.createJobWageEntry(jobData, workerIds || []);
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/jobs/rates', requireAuth, async (req: Request, res: Response) => {
  try {
    const rates = await JobWageService.getJobRates();
    res.json(rates);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/jobs/rates', requireAuth, async (req: Request, res: Response) => {
  try {
    await JobWageService.saveJobRate(req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/jobs/groups', requireAuth, async (req: Request, res: Response) => {
  try {
    const groups = await JobWageService.getGroups();
    res.json(groups);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/jobs/groups', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, description, memberIds } = req.body;
    const id = await JobWageService.createGroup(name, description, memberIds);
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Employees
router.get('/employees', requireAuth, async (req: Request, res: Response) => {
  try {
    const employees = await EmployeeService.getAllEmployees();
    res.json(employees);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/employees', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = await EmployeeService.createEmployee(req.body);
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/employees/attendance', requireAuth, async (req: Request, res: Response) => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const records = await EmployeeService.getAttendanceForDate(date);
    res.json({ date, records });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/employees/attendance', requireAuth, async (req: Request, res: Response) => {
  try {
    const { date, records } = req.body;
    await EmployeeService.saveAttendance(date, records);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/employees/wages', requireAuth, async (req: Request, res: Response) => {
  try {
    const from = (req.query.from as string) || new Date().toISOString().split('T')[0];
    const to = (req.query.to as string) || new Date().toISOString().split('T')[0];
    const wages = await EmployeeService.calculateEmployeeWages(from, to);
    res.json({ from, to, wages });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/employees/disburse', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = await EmployeeService.recordSalaryDisbursement(req.body);
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Expenses
router.get('/expenses', requireAuth, async (req: Request, res: Response) => {
  try {
    const expenses = await ExpenseService.getExpenses();
    res.json(expenses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/expenses', requireAuth, async (req: Request, res: Response) => {
  try {
    const id = await ExpenseService.createExpense(req.body);
    res.status(201).json({ success: true, id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Settings & Alerts
router.get('/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    const settings = await AlertService.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', requireAuth, async (req: Request, res: Response) => {
  try {
    await AlertService.updateSettings(req.body);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
