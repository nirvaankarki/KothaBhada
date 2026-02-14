import { Room } from '../models/roomModel.js';

export async function getAllRooms(req, res) {
    try {
        const rooms = await Room.find();
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms', error: error.message });
    }
}

export async function createRooms(req, res) {
    try {
        const { title, price, description, location } = req.body;
        const newRoom = new Room({ title, price, description, location });
        await newRoom.save();
        res.status(201).json({ message: 'Room created successfully', room: newRoom });
    } catch (error) {
        res.status(500).json({ message: 'Error creating room', error: error.message });
    }
}

export async function updateRooms(req, res) {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedRoom = await Room.findByIdAndUpdate(id, updates, { new: true });
        res.status(200).json({ message: 'Room updated successfully', room: updatedRoom });
    } catch (error) {
        res.status(500).json({ message: 'Error updating room', error: error.message });
    }
}

export async function deleteRooms(req, res) {
    try {
        const { id } = req.params;
        await Room.findByIdAndDelete(id);
        res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting room', error: error.message });
    }
}
