import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { uploadRoomModelMiddleware } from '../middleware/modelUploadMiddleware.js';
import { getAllRooms, getMyRooms, createRooms, updateRooms, deleteRooms, getRoomById, uploadRoomModel, getNearbyAreaHighlights } from '../controllers/roomsController.js';

const router = express.Router();

router.get('/demo', getAllRooms);
router.get('/nearby-highlights', getNearbyAreaHighlights);
router.get('/mine', authenticate, getMyRooms);
router.post(
	'/upload-model',
	authenticate,
	uploadRoomModelMiddleware.fields([
		{ name: 'model', maxCount: 1 },
		{ name: 'file', maxCount: 1 },
		{ name: 'modelFile', maxCount: 1 },
		{ name: 'model3d', maxCount: 1 },
	]),
	uploadRoomModel
);
router.get('/:id', getRoomById); // New route for fetching a single room
router.post('/', authenticate, createRooms);
router.put('/:id', authenticate, updateRooms);
router.delete('/:id', authenticate, deleteRooms);
 
export default router; 