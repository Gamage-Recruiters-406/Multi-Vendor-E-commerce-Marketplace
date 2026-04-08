import express from 'express';
import { upload } from '../middlewares/imageUploader';

const router = express.Router();

router.post('/example', upload.single('image'),
        // Call Controller function here
)

export default router;