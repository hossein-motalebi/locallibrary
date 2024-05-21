const Book = require("../models/book");
const Author = require("../models/author");
const Genre = require("../models/genre");
const BookInstance = require("../models/bookinstance");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

exports.index = asyncHandler(async (req, res) => {
  const counts = await Promise.all([
    Book.countDocuments().exec(),
    BookInstance.countDocuments().exec(),
    BookInstance.countDocuments({ status: "Available" }).exec(),
    Author.countDocuments().exec(),
    Genre.countDocuments().exec(),
  ]);

  res.render("index", {
    title: "Library Home",
    book_count: counts[0],
    book_instance_count: counts[1],
    book_instance_available_count: counts[2],
    author_count: counts[3],
    genre_count: counts[4],
  });
});

exports.book_list = asyncHandler(async (req, res) => {
  const books = await Book.find({}, "title author")
    .sort({ title: 1 })
    .populate("author")
    .exec();

  res.render("book_list", { title: "All Books", book_list: books });
});

exports.book_detail = asyncHandler(async (req, res) => {
  const [specificBook, itsInstances] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);

  if (!specificBook) {
    const error = new Error("Book not found");
    error.status = 404;
    return next(error);
  }

  res.render("book_detail", {
    title: specificBook.title,
    book: specificBook,
    book_instances: itsInstances,
  });
});

exports.book_create_get = asyncHandler(async (req, res) => {
  const [authors, genres] = await Promise.all([
    Author.find().sort({ family_name: 1 }).exec(),
    Genre.find().sort({ name: 1 }).exec(),
  ]);

  res.render("book_form", {
    title: "New Book",
    authors,
    genres,
  });
});

exports.book_create_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = req.body.genre ? [req.body.genre] : [];
    }
    next();
  },

  body("title", "Title required").trim().isLength({ min: 1 }).escape(),
  body("author", "Author required").trim().isLength({ min: 1 }).escape(),
  body("summary", "Summary required").trim().isLength({ min: 1 }).escape(),
  body("isbn", "ISBN required").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const book = new Book({ ...req.body });

    if (!errors.isEmpty()) {
      const [authors, genres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ]);

      res.render("book_form", {
        title: "New Book",
        authors,
        genres,
        book,
        errors: errors.array(),
      });
    } else {
      await book.save();
      res.redirect(book.url);
    }
  }),
];

exports.book_delete_get = asyncHandler(async (req, res) => {
  const [book, instances] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);

  if (!book) {
    res.redirect("/catalog/books");
  }

  res.render("book_delete", {
    title: "Remove Book",
    book,
    book_instances: instances,
  });
});

exports.book_delete_post = asyncHandler(async (req, res) => {
  const [book, instances] = await Promise.all([
    Book.findById(req.params.id).exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);

  if (instances.length > 0) {
    res.render("book_delete", {
      title: "Cannot Remove Book",
      book,
      book_instances: instances,
    });
  } else {
    await Book.findByIdAndDelete(req.body.id);
    res.redirect("/catalog/books");
  }
});

exports.book_update_get = asyncHandler(async (req, res) => {
  const [bookToUpdate, authors, genres] = await Promise.all([
    Book.findById(req.params.id).populate("author").populate("genre").exec(),
    Author.find().sort({ family_name: 1 }).exec(),
   Genre.find().sort({ name: 1 }).exec(),
  ]);

  if (!bookToUpdate) {
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }

  genres.forEach(genre => {
    genre.checked = bookToUpdate.genre.includes(genre._id) ? "true" : "false";
  });

  res.render("book_form", {
    title: "Edit Book",
    book: bookToUpdate,
    authors,
    genres,
  });
});

exports.book_update_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = req.body.genre ? [req.body.genre] : [];
    }
    next();
  },

  body("title", "A title is required.").trim().isLength({ min: 1 }).escape(),
  body("author", "An author is required.").trim().isLength({ min: 1 }).escape(),
  body("summary", "A summary is required.").trim().isLength({ min: 1 }).escape(),
  body("isbn", "ISBN is necessary").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const updatedBook = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      const [authors, genres] = await Promise.all([
        Author.find().sort({ family_name: 1 }).exec(),
        Genre.find().sort({ name: 1 }).exec(),
      ]);

      genres.forEach(genre => {
        if (updatedBook.genre.includes(genre._id)) {
          genre.checked = "true";
        }
      });

      res.render("book_form", {
        title: "Edit Book",
        authors,
        genres,
        book: updatedBook,
        errors: errors.array(),
      });
      return;
    } else {
      await Book.findByIdAndUpdate(req.params.id, updatedBook, {});
      res.redirect(updatedBook.url);
    }
  }),
];
