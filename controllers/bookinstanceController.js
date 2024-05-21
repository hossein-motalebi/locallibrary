const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// List all BookInstances with details.
exports.bookinstance_list = asyncHandler(async (req, res) => {
  const bookInstances = await BookInstance.find().populate('book').exec();
  res.render("bookinstance_list", {
    title: "List of Book Instances",
    bookinstance_list: bookInstances,
  });
});

// Display details for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res) => {
  const bookInstanceDetail = await BookInstance.findById(req.params.id).populate('book').exec();

  if (!bookInstanceDetail) {
    const error = new Error("Book instance not found");
    error.status = 404;
    return next(error);
  }

  res.render("bookinstance_detail", {
    title: `Copy: ${bookInstanceDetail.book.title}`,
    bookinstance: bookInstanceDetail,
  });
});

// GET method for creating a BookInstance.
exports.bookinstance_create_get = asyncHandler(async (req, res) => {
  const books = await Book.find({}, 'title').sort('title').exec();
  res.render("bookinstance_form", {
    title: "Create Book Copy",
    book_list: books,
  });
});

// POST method for creating a BookInstance.
exports.bookinstance_create_post = [
  body("book", "Selection of a book is required.").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint is required").trim().isLength({ min: 1 }).escape(),
  body("status").escape(),
  body("due_back").optional({ checkFalsy: true }).isISO8601().toDate(),
  
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const newBookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      const books = await Book.find({}, 'title').sort('title').exec();
      res.render("bookinstance_form", {
        title: "Create Book Copy",
        book_list: books,
        bookinstance: newBookInstance,
        errors: errors.array(),
      });
    } else {
      await newBookInstance.save();
      res.redirect(newBookInstance.url);
    }
  }),
];

// GET method for deleting a BookInstance.
exports.bookinstance_delete_get = asyncHandler(async (req, res) => {
  const bookInstance = await BookInstance.findById(req.params.id).populate('book').exec();

  if (!bookInstance) {
    res.redirect("/catalog/bookinstances");
  }

  res.render("bookinstance_delete", {
    title: "Delete Book Copy",
    bookinstance: bookInstance,
  });
});

// POST method for deleting a BookInstance.
exports.bookinstance_delete_post = asyncHandler(async (req, res) => {
  await BookInstance.findByIdAndDelete(req.body.id);
  res.redirect("/catalog/bookinstances");
});

// GET method for updating a BookInstance.
exports.bookinstance_update_get = asyncHandler(async (req, res) => {
  const [bookInstance, books] = await Promise.all([
    BookInstance.findById(req.params.id).populate('book').exec(),
    Book.find().sort('title'),
  ]);

  if (!bookInstance) {
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_form", {
    title: "Edit Book Copy",
    book_list: books,
    selected_book: bookInstance.book._id,
    bookinstance: bookInstance,
  });
});

// POST method for updating a BookInstance.
exports.bookinstance_update_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre = req.body.genre ? [req.body.genre] : [];
    }
    next();
  },
  body("book", "Book selection is required").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint information is required").trim().isLength({ min: 1 }).escape(),
  body("status").escape(),
  body("due_back").optional({ checkFalsy: true }).isISO8601().toDate(),
  
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: reqparams.id, // This is required to avoid creating a new document
    });

    if (!errors.isEmpty()) {
      const books = await Book.find().sort('title');
      res.render("bookinstance_form", {
        title: "Edit Book Copy",
        book_list: books,
        bookinstance: bookInstance,
        errors: errors.array(),
      });
      return;
    } else {
      await BookInstance.findByIdAndUpdate(req.params.id, bookInstance);
      res.redirect(bookInstance.url);
    }
  }),
];
