import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware.js';
import { uploadRoomModelMiddleware } from '../middleware/modelUploadMiddleware.js';
import { getAllRooms, getMyRooms, createRooms, updateRooms, deleteRooms, getRoomById, uploadRoomModel, getNearbyAreaHighlights } from '../controllers/roomsController.js';
import { getAiRecommendations } from '../controllers/userDashboardController.js';

const router = express.Router();

router.get('/demo', getAllRooms);
router.get('/nearby-highlights', getNearbyAreaHighlights);
router.post('/ai/recommendations', getAiRecommendations);
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
router.get('/:id', optionalAuthenticate, getRoomById); // New route for fetching a single room
router.post('/', authenticate, createRooms);
router.put('/:id', authenticate, updateRooms);
router.delete('/:id', authenticate, deleteRooms);
 
export default router; 