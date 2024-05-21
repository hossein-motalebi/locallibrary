const Genre = require("../models/genre");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// Display list of all Genres.
exports.genre_list = asyncHandler(async (req, res) => {
  const genresSorted = await Genre.find().sort({ name: 1 }).exec();
  res.render("genre_list", {
    title: "List of Genres",
    list_genres: genresSorted,
  });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res) => {
  const [genreDetails, booksByGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  if (!genreDetails) {
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }

  res.render("genre_detail", {
    title: `Detail of Genre: ${genreDetails.name}`,
    genre: genreDetails,
    genre_books: booksByGenre,
  });
});

// GET request to create a Genre.
exports.genre_create_get = (req, res) => {
  res.render("genre_form", { title: "New Genre" });
};

// POST request to create a Genre.
exports.genre_create_post = [
  body("name", "Genre name requires at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "New Genre",
        genre,
        errors: errors.array(),
      });
      return;
    }

    const existingGenre = await Genre.findOne({ name: req.body.name })
      .collation({ locale: "en", strength: 2 })
      .exec();

    if (existingGenre) {
      res.redirect(existingGenre.url);
    } else {
      await genre.save();
      res.redirect(genre.url);
    }
  }),
];

// GET request to delete a Genre.
exports.genre_delete_get = asyncHandler(async (req, res) => {
  const genreToDelete = await Genre.findById(req.params.id).exec();
  const books = await Book.find({ genre: req.params.id }, "title summary").exec();

  if (!genreToDelete) {
    res.redirect("/catalog/genres");
    return;
  }

  res.render("genre_delete", {
    title: "Delete Genre",
    genre: genreToDelete,
    genre_books: books,
  });
});

// POST request to delete a Genre.
exports.genre_delete_post = asyncHandler(async (req, res) => {
  const books = await Book.find({ genre: req.params.id }, "title summary").exec();

  if (books.length > 0) {
    res.render("genre_delete", {
      title: "Cannot Delete Genre",
      genre: await Genre.findById(req.params.id).exec(),
      genre_books: books,
    });
  } else {
    await Genre.findByIdAndDelete(req.body.id);
    res.redirect("/catalog/genres");
  }
});

// GET request to update a Genre.
exports.genre_update_get = asyncHandler(async (req, res) => {
  const genreToUpdate = await Genre.findById(req.params.id).exec();

  if (!genreToUpdate) {
    const error = new Error("Genre not found");
    error.status = 404;
    return next(error);
  }

  res.render("genre_form", { title: "Edit Genre", genre: genreToUpdate });
});

// POST request to update a Genre.
exports.genre_update_post = [
  body("name", "Genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const updatedGenre = new Genre({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      res.render("genre_form", {
        title: "Edit Genre",
        genre: updatedGenre,
        errors: errors.array(),
      });
      return;
    }

    await Genre.findByIdAndUpdate(req.params.id, updatedGenre);
    res.redirect(updatedGenre.url);
  }),
];
