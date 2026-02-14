import express from 'express';
import { getAllRooms, createRooms, updateRooms, deleteRooms} from '../controllers/roomsController.js';

const router = express.Router();

router.get('/', getAllRooms);
router.post('/', createRooms);
router.put('/:id', updateRooms);
router.delete('/:id', deleteRooms);
 
export default router; 