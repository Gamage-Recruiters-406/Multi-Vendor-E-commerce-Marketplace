import express from 'express';
import { upload } from '../middlewares/imageUploader';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const router = express.Router();

router.post('/example', upload.single('image'),
        // Call Controller function here
)

export default router;
