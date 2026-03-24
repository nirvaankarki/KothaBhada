import { Room } from '../models/roomModel.js';
import { User } from '../models/userModel.js';

export async function getAllRooms(req, res) {
    try {
        const rooms = await Room.find({ status: 'active' }).sort({ createdAt: -1 });
        res.status(200).json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms', error: error.message });
    }
}

export async function getMyRooms(req, res) {
    try {
        if (req.user?.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can access their listings' });
        }

        const rooms = await Room.find({ ownerId: req.user.userId }).sort({ createdAt: -1 });
        return res.status(200).json(rooms);
    } catch (error) {
        return res.status(500).json({ message: 'Error fetching landlord rooms', error: error.message });
    }
}

export async function createRooms(req, res) {
    try {
        if (req.user?.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can create listings' });
        }

        const {
            title,
            price,
            description,
            location,
            bedrooms,
            bathrooms,
            areaSqFt,
            image,
            ownerPhone,
            status,
        } = req.body;

        if (!title || !String(title).trim()) {
            return res.status(400).json({ message: 'Listing title is required' });
        }

        if (!location || !String(location).trim()) {
            return res.status(400).json({ message: 'Location is required' });
        }

        const numericPrice = Number(price);
        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
            return res.status(400).json({ message: 'Price must be a valid number greater than 0' });
        }

        const owner = await User.findById(req.user.userId).select('name email phone');
        if (!owner) {
            return res.status(404).json({ message: 'Landlord account not found' });
        }

        const newRoom = new Room({
            ownerId: req.user.userId,
            ownerName: owner.name || 'Property Owner',
            ownerEmail: owner.email || '',
            ownerPhone: String(ownerPhone || owner.phone || '').trim(),
            title: String(title).trim(),
            price: numericPrice,
            description: String(description || '').trim(),
            location: String(location).trim(),
            bedrooms: Number(bedrooms) || 1,
            bathrooms: Number(bathrooms) || 1,
            areaSqFt: Number(areaSqFt) || 0,
            image: String(image || '').trim(),
            status: status === 'inactive' ? 'inactive' : 'active',
        });

        await newRoom.save();
        res.status(201).json({ message: 'Room created successfully', room: newRoom });
    } catch (error) {
        res.status(500).json({ message: 'Error creating room', error: error.message });
    }
}

export async function updateRooms(req, res) {
    try {
        if (req.user?.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can update listings' });
        }

        const { id } = req.params;
        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (String(room.ownerId) !== String(req.user.userId)) {
            return res.status(403).json({ message: 'You can update only your own listings' });
        }

        const allowedKeys = ['title', 'price', 'description', 'location', 'bedrooms', 'bathrooms', 'areaSqFt', 'image', 'ownerPhone', 'status'];
        const updates = {};
        for (const key of allowedKeys) {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        }

        if (updates.title !== undefined) updates.title = String(updates.title).trim();
        if (updates.location !== undefined) updates.location = String(updates.location).trim();
        if (updates.description !== undefined) updates.description = String(updates.description || '').trim();
        if (updates.image !== undefined) updates.image = String(updates.image || '').trim();
        if (updates.ownerPhone !== undefined) updates.ownerPhone = String(updates.ownerPhone || '').trim();
        if (updates.price !== undefined) updates.price = Number(updates.price);
        if (updates.bedrooms !== undefined) updates.bedrooms = Number(updates.bedrooms) || 0;
        if (updates.bathrooms !== undefined) updates.bathrooms = Number(updates.bathrooms) || 0;
        if (updates.areaSqFt !== undefined) updates.areaSqFt = Number(updates.areaSqFt) || 0;

        const updatedRoom = await Room.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        res.status(200).json({ message: 'Room updated successfully', room: updatedRoom });
    } catch (error) {
        res.status(500).json({ message: 'Error updating room', error: error.message });
    }
}

export async function deleteRooms(req, res) {
    try {
        if (req.user?.role !== 'landlord') {
            return res.status(403).json({ message: 'Only landlords can delete listings' });
        }

        const { id } = req.params;
        const room = await Room.findById(id);
        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (String(room.ownerId) !== String(req.user.userId)) {
            return res.status(403).json({ message: 'You can delete only your own listings' });
        }

        await Room.findByIdAndDelete(id);
        res.status(200).json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting room', error: error.message });
    }
}

export async function getRoomById(req, res) {
    try {
        const { id } = req.params;
        const room = await Room.findById(id);

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching room', error: error.message });
    }
}
