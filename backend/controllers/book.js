const Book = require('../models/book');
const fs = require('fs');
const sharp = require('sharp');

/* CREATE */
exports.createBook = (req, res) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    // Specify a different output path for the resized file
    const resizedFileName = `resized-${req.file.filename.replace(/\.[^.]+$/, '')}.webp`;
    const resizedImagePath = `./images/${resizedFileName}`;
    // Use Sharp to resize the image
    sharp(req.file.path)
        .resize(206, 260)
        .toFormat('webp')
        .toFile(resizedImagePath, (err, info) => {
            if (err) {
                return res.status(401).json({ error: err.message });
            }
            // Delete the original file after resizing
            fs.unlink(req.file.path, (unlinkErr) => {
                if (unlinkErr) {
                    console.error('Erreur lors de la suppression du fichier original:', unlinkErr);
                }
                // Create a Book object with resized URL
                const book = new Book({
                    ...bookObject,
                    userId: req.auth.userId,
                    imageUrl: `${req.protocol}://${req.get('host')}/images/${resizedFileName}`
                });
                // Save the book in the database
                book.save()
                    .then(() => {
                        res.status(201).json({ message: 'Livre enregistré !' });
                    })
                    .catch(error => {
                        res.status(401).json({ error: "Erreur lors de l'enregistrement !" });
                    });
            });
        });
};

exports.createRatingBook = (req, res) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            // Check that the rating is between 1 and 5 and that a rating has not already been assigned by this user            
            if (book.ratings.some(rating => rating.userId === req.userId) || (req.body.grade < 1 || req.body.grade > 5)) {
                res.status(500).json({ error: 'Erreur lors de la notation' });
            } else {
                // Add the new rating
                book.ratings.push({
                    userId: req.body.userId,
                    grade: req.body.rating
                });
                // Calculate the new ratings average
                const totalRatings = book.ratings.length;
                const sumOfRatings = book.ratings.reduce((acc, rating) => acc + rating.grade, 0);
                book.averageRating = sumOfRatings / totalRatings;
                book.averageRating = parseFloat(book.averageRating.toFixed(1));
                // Save the book
                book.save()
                    .then(book => {
                        res.status(200).json(book);
                    })
                    .catch(error => res.status(500).json({ error }));
            }
        })
        .catch(error => res.status(404).json({ error }));
};

/* READ */
exports.getAllBook = (req, res) => {
    Book.find()
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
};

exports.getOneBook = (req, res) => {
    Book.findOne({ _id: req.params.id })
        .then(book =>
            res.status(200).json(book))
        .catch(error => res.status(404).json({ error }));
};

exports.getBooksWithBestRating = (req, res) => {
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then(bestRating =>
            res.status(200).json(bestRating)
        )
        .catch(error => res.status(500).json({ error: 'Erreur lors de la récupération des livres les mieux notés' })
        )
};
/* - */

/* UPDATE */
exports.updateOneBook = (req, res) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
    delete bookObject._userId;
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId !== req.auth.userId) {
                return res.status(401).json({ message: 'Non autorisé' });
            } else if (req.file) {
                // Specify a different output path for the resized file
                const resizedFileName = `resized-${req.file.filename.replace(/\.[^.]+$/, '')}.webp}`;
                const resizedImagePath = `./images/${resizedFileName}`;
                // Use Sharp to resize the image
                sharp(req.file.path)
                    .resize(206, 260)
                    .toFormat('webp')
                    .toFile(resizedImagePath, (err, info) => {
                        if (err) {
                            return res.status(401).json({ error: err.message });
                        }
                        // Delete the original file after resizing
                        fs.unlink(req.file.path, (unlinkErr) => {
                            if (unlinkErr) {
                                console.error('Erreur lors de la suppression du fichier original:', unlinkErr);
                            }
                            // Book update with new resized URL
                            Book.updateOne({ _id: req.params.id }, { ...bookObject, imageUrl: `${req.protocol}://${req.get('host')}/images/${resizedFileName}`, _id: req.params.id })
                                .then(() => res.status(200).json({ message: 'Livre modifié!' }))
                                .catch((updateError) => res.status(401).json({ error: updateError.message }));
                        });
                    });
            } else {
                Book.updateOne({ _id: req.params.id }, { ...bookObject })
                    .then(() => res.status(200).json({ message: 'Livre modifié!' }))
                    .catch((updateError) => res.status(500).json({ error: updateError.message }));
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};
/* - */

/* DELETE */
exports.deleteOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(401).json({ message: 'Not authorized' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Livre supprimé !' }) })
                        .catch(error => res.status(401).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};
/* - */