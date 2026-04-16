import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/authMiddleware.js';
import { uploadRoomPanoramaImagesMiddleware } from '../middleware/modelUploadMiddleware.js';
import { getAllRooms, getMyRooms, createRooms, updateRooms, deleteRooms, getRoomById, uploadRoomPanoramaImages, getNearbyAreaHighlights } from '../controllers/roomsController.js';
import { getAiRecommendations } from '../controllers/userDashboardController.js';

const router = express.Router();

router.get('/demo', getAllRooms);
router.get('/nearby-highlights', getNearbyAreaHighlights);
router.post('/ai/recommendations', getAiRecommendations);
router.get('/mine', authenticate, getMyRooms);
router.post(
	'/upload-panorama-images',
	authenticate,
	uploadRoomPanoramaImagesMiddleware.fields([
		{ name: 'panoramaImages', maxCount: 12 },
		{ name: 'panoramas', maxCount: 12 },
		{ name: 'images', maxCount: 12 },
	]),
	uploadRoomPanoramaImages
);
router.get('/:id', optionalAuthenticate, getRoomById); // New route for fetching a single room
router.post('/', authenticate, createRooms);
router.put('/:id', authenticate, updateRooms);
router.delete('/:id', authenticate, deleteRooms);
 
export default router; 