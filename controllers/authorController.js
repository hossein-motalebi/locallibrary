const Author = require("../models/author");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");
const asyncHandler = require("express-async-handler");

// List all authors with a sorted order
exports.author_list = asyncHandler(async (req, res) => {
  const authorsSorted = await Author.find().sort({ family_name: 'asc' }).exec();
  res.render("author_list", {
    title: "List of Authors",
    author_list: authorsSorted,
  });
});

// Detail page for an author
exports.author_detail = asyncHandler(async (req, res) => {
  const [foundAuthor, booksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (!foundAuthor) {
    const error = new Error("No Author Found");
    error.status = 404;
    return next(error);
  }

  res.render("author_detail", {
    title: "Detailed Author View",
    author: foundAuthor,
    author_books: booksByAuthor,
  });
});

// GET request to create an Author
exports.author_create_get = (req, res) => {
  res.render("author_form", { title: "Add New Author" });
};

// POST request to create an Author
exports.author_create_post = [
  body("first_name").trim().isLength({ min: 1 }).escape().withMessage("First name is required.").isAlphanumeric().withMessage("First name must be alphanumeric."),
  body("family_name").trim().isLength({ min: 1 }).escape().withMessage("Family name is required.").isAlphanumeric().withMessage("Family name must be alphanumeric."),
  body("date_of_birth").optional({ checkFalsy: true }).isISO8601().toDate(),
  body("date_of_death").optional({ checkFalsy: true }).isISO8601().toDate(),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const newAuthor = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "Add New Author",
        author: newAuthor,
        errors: errors.array(),
      });
    } else {
      await newAuthor.save();
      res.redirect(newAuthor.url);
    }
  }),
];

// GET request to delete an Author
exports.author_delete_get = asyncHandler(async (req, res) => {
  const [author, booksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (!author) {
    res.redirect("/catalog/authors");
  } else {
    res.render("author_delete", {
      title: "Remove Author",
      author: author,
      author_books: booksByAuthor,
    });
  }
});

// POST request to delete an Author
exports.author_delete_post = asyncHandler(async (req, res) => {
  const [authorDetails, booksDetails] = await Promise.all([
    Author.findById(req.body.authorid).exec(),
    Book.find({ author: req.body.authorid }, "title summary").exec(),
  ]);

  if (booksDetails.length > 0) {
    res.render("author_delete", {
      title: "Cannot Delete Author",
      author: authorDetails,
      author_books: booksDetails,
    });
  } else {
    await Author.findByIdAndDelete(req.body.authorid);
    res.redirect("/catalog/authors");
  }
});

// GET and POST handlers for updating an Author
exports.author_update_get = asyncHandler(async (req, res) => {
  const authorToUpdate = await Author.findById(req.params.id).exec();
  if (!authorToUpdate) {
    const error = new Error("Author not found");
    error.status = 404;
    return next(error);
  }

  res.render("author_form", { title: "Edit Author", author: authorToUpdate });
});

exports.author_update_post = [
  body("first_name").trim().isLength({ min: 1 }).escape().withMessage("Please specify a first name.").isAlphanumeric().withMessage("First name should only contain letters and numbers."),
  body("family_name").trim().isLength({ min: 1 }).escape().withMessage("Please specify a family name.").isAlphanumeric().withMessage("Family name should only contain letters and numbers."),
  body("date_of_birth").optional({ checkFalsy: true }).isISO8601().toDate(),
  body("date_of_death").optional({ checkFalsy: true }).isISO8601().toDate(),

  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    const updatedAuthor = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id  // Ensuring the ID is not changed
    });

    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "Edit Author",
        author: updatedAuthor,
        errors: errors.array()
      });
    } else {
      await Author.findByIdAndUpdate(req.params.id, updatedAuthor, {});
      res.redirect(updatedAuthor.url);
    }
  }),
];
