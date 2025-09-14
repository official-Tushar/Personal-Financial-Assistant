import { Router } from 'express';
import { createTransaction, listTransactions, updateTransaction, deleteTransaction, createTransactionsBulk } from '../controllers/transactionsController.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

router.use(authRequired);
router.post('/', createTransaction);
router.post('/bulk', createTransactionsBulk);
router.get('/', listTransactions);
router.patch('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
