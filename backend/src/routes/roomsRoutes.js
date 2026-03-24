import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { getAllRooms, getMyRooms, createRooms, updateRooms, deleteRooms, getRoomById } from '../controllers/roomsController.js';

const router = express.Router();

router.get('/demo', getAllRooms);
router.get('/mine', authenticate, getMyRooms);
router.get('/:id', getRoomById); // New route for fetching a single room
router.post('/', authenticate, createRooms);
router.put('/:id', authenticate, updateRooms);
router.delete('/:id', authenticate, deleteRooms);
 
export default router; 