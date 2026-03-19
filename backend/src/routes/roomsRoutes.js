import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getAllRooms, getMyRooms, createRooms, updateRooms, deleteRooms} from '../controllers/roomsController.js';

const router = express.Router();

router.get('/demo', getAllRooms);
router.get('/mine', authenticate, getMyRooms);
router.post('/', authenticate, createRooms);
router.put('/:id', authenticate, updateRooms);
router.delete('/:id', authenticate, deleteRooms);
 
export default router; 