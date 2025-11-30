import { getCurrentAffairs } from '../utils/currentAffairsUtils.js';

// GET current affairs
export const getCurrentAffairsData = async (req, res) => {
  try {
    const currentAffairs = await getCurrentAffairs();
    res.json(currentAffairs);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch current affairs', 
      message: error.message 
    });
  }
};

