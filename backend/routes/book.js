const express = require('express');
const router = express.Router();
const bookControllers = require('../controllers/book');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

// Create
router.post('/', auth, multer, bookControllers.createBook);
router.post('/:id/rating', auth, bookControllers.createRatingBook);
// Read
router.get('/', bookControllers.getAllBook);
router.get('/bestrating', bookControllers.getBooksWithBestRating);
router.get('/:id', bookControllers.getOneBook);
// Update
router.put('/:id', auth, multer, bookControllers.updateOneBook);
// Delete
router.delete('/:id', auth, bookControllers.deleteOneBook);

module.exports = router;