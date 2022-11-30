const { isValidObjectId } = require('mongoose')
const moment = require('moment')
const bookModel = require('../models/bookModel')
const userModel = require('../models/userModel')
const reviewModel = require('../models/reviewModel.js')
const { isValidString ,isValid} = require('../validations/validation')

const createBook = async function(req , res){

    try {

        let data = req.body
        let { title , excerpt , userId , ISBN , category , subcategory , releasedAt } = data

        if (!title || title.trim().length==0) return res.status(400).send({ status : false , message : "Title is required !!!" })
        if (!excerpt || excerpt.trim().length==0) return res.status(400).send({ status : false , message : "Excerpt is required !!!" })
        if (!userId || userId.trim().length==0) return res.status(400).send({ status : false , message : "UserId number is required !!!" })
        if (!ISBN || ISBN.trim().length==0) return res.status(400).send({ status : false , message : "ISBN is required !!!" })
        if (!category || category.trim().length==0) return res.status(400).send({ status : false , message : "Category is required !!!" })
        if (!subcategory || subcategory.trim().length==0) return res.status(400).send({ status : false , message : "Subcategory is required !!!" })
        if (!releasedAt || releasedAt.trim().length==0) return res.status(400).send({ status : false , message : "Released date is required !!!" })

        let titleCheck = await bookModel.findOne({title})
        if(titleCheck) return res.status(400).send({ status : false , message : "Title already in use !!!" })

        if(!isValidObjectId(userId)) res.status(400).send({ status : false , message : "UserId is not a valid ObjectId !!!" })
        let userIdCheck = await userModel.findById(userId)
        if(!userIdCheck) return res.status(404).send({ status : false , message : "UserId does not exist !!!" })

        let ISBNCheck = await bookModel.findOne({ISBN})
        if(ISBNCheck) return res.status(400).send({ status : false , message : "ISBN already in use !!!" })
        data.releasedAt = moment(data.releasedAt).format('YYYY-MM-DD')

        savedData = await bookModel.create(data)

        res.status(201).send({ status : true , message : "Success" , data : savedData })

    } catch (err) {
        res.status(500).send({ status : false , message : err.message })
    }
}

// ===============================getUsers==========================

const getAllBooks = async function (req , res) {

    try {

    let filter = req.query
    let { category , userId , subcategory } = filter

    if(category){
        if(!isValidString(category)) return res.status(400).send({ status : false , message : "Category is required !!!" })
    }

    if(userId){
        if(!isValidObjectId(userId)) res.status(400).send({ status : false , message : "UserId is not a valid ObjectId !!!" })
        let userIdCheck = await userModel.findById(userId)
        if (!userIdCheck) { return res.status(404).send({ status : false, message : "UserId does not exist." }) }
    }

    if(subcategory){
        if(!isValidString(category)) return res.status(400).send({ status : false , message : "Category is required !!!" })
    }

    filter.isDeleted = false

    let bookDetails = await bookModel.find(filter).select({ title : 1 , excerpt : 1 , userId : 1 , category : 1 , reviews : 1 , releasedAt : 1 }).sort({ title : 1 })

    if (bookDetails.length == 0) return res.status(404).send({ status : false, message : "No books available." })

    res.status(200).send({ status : true , message : "Book list" , data : bookDetails })

    } catch (err) {
        res.status(500).send({ status : false , message : err.message })
    }
}

// =========================get Book Bt Id=========================================================

const getBookById = async function(req , res){

    try {

        let bookId = req.params.bookId

        if(!isValidObjectId(bookId)) res.status(400).send({ status : false , message : "BookId is not a valid ObjectId !!!" })

        let bookData = await bookModel.findById(bookId).select({ ISBN : 0 , __v : 0 }).lean()
        if (!bookData) return res.status(404).send({ status : false, message : "BookId does not exist." })

        let reviewData = await reviewModel.find({ bookId })

        if(reviewData.length == 0) reviewData.push("No reviews available !!!")

        bookData.reviewsData = reviewData

        res.status(200).send({ status : true , message : "Book list" , data : bookData })

    } catch (err) {
        res.status(500).send({ status : false , message : err.message })
    }
}

const updatebooks = async function (req , res) {

    try {

    let bookId = req.params.bookId;
    let data = req.body
    let { title, excerpt, ISBN, releasedAt } = data

    if(!isValidObjectId(bookId)) return res.status(400).send({ status : false , message : "BookId is not a valid ObjectId !!!" })

    let bookData = await bookModel.findById(bookId)

    if(!bookData) return res.status(404).send({ status : false , message : "This book is not present !!!" })

    if(bookData.userId.toString() != req.loggedInUser) return res.status(403).send({ status : false, message : "You are not authorized to access this data !!!" })

    if(bookData.isDeleted === true) return res.status(404).send({ status : false, message : "This book is already deleted !!!" })

    if(Object.keys(data).length == 0) return res.status(404).send({ status : false, message : "Please enter valid keys for updation!!!!" })

    if(title){
        if (typeof title !== "string" && title.trim().length == 0) return res.status(400).send({ status : false, message : "Please enter valid title !!!" })

        let titleCheck = await bookModel.findOne({ title : title.trim() }) //.collation({ locale: 'en', strength: 2 })
        if (titleCheck) { return res.status(400).send({ status : false, message : " this title already exist " })}}

    if(excerpt){ 
        if(typeof excerpt !== "string" && excerpt.trim().length == 0) return res.status(400).send({ status : false, message : "please enter valid excerpt" })
    }

    if(ISBN){
        if (typeof ISBN !== "string") return res.status(400).send({ status : false, message : "ISBN should have string datatype !!!" })
        if (!/^\d{3}-?\d{10}/.test(ISBN.trim())) return res.status(400).send({ status : false, message : "Please enter a valid ISBN !!!" })

        let ISBNCheck = await bookModel.findOne({ ISBN : ISBN.trim() })
        if (ISBNCheck) return res.status(400).send({ status : false, message : "ISBN already exist !!!" })
    }

    if(releasedAt){
        if (typeof releasedAt === "string" && releasedAt.trim().length === 0) return res.status(400).send({ status : false, message : "Please enter valid releasedAt and Should be in String !!!" })

        let releasedAtt = /^^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(releasedAt.trim())
        if (!releasedAtt) return res.status(400).send({ status : false, message : "releasedAt YYYY/MM/DD Format or Enter A valied Date" })
    }

    let updateBookData = await bookModel.findOneAndUpdate({ _id : bookId , isDeleted : false } , data , { new : true })

    res.status(201).send({ status : true , message : "Success" , data : updateBookData })

    }catch (err) {
        res.status(500).send({ status : false, error : err.message });
    } }

// ==========================Delete Model=====================================

const deleteBook =async function(req , res){

    try{

    let bookId = req.params.bookId

    if(!isValidObjectId(bookId)) res.status(400).send({ status : false , message : "BookId is not a valid ObjectId !!!" })

    let bookDetails = await bookModel.findById(bookId)
    console.log(bookDetails)
    if(!bookDetails) return res.status(404).send({ status : false , message : "BookId is not exist !!!" })

    if(bookDetails.isDeleted === true) return res.status(200).send({ status : false , message : "Book is already deleted." })

    // bookDetails.isDeleted = true
    let deleteBookData = await bookModel.findOneAndUpdate({ _id : bookId } , { isDeleted : true } , { new : true })

    res.status(200).send({ status : true , message : deleteBookData })

}catch (err) {
    res.status(500).send({ status : false , message : err.message })
}
}
// ====================================CreateReviewS==========================================
// ## Review APIs
// ### POST /books/:bookId/review
// - Add a review for the book in reviews collection.
// - Check if the bookId exists and is not deleted before adding the review. Send an error response with appropirate status code like [this](#error-response-structure) if the book does not exist
// - Get review details like review, rating, reviewer's name in request body.
// - Update the related book document by increasing its review count
// - Return the updated book document with reviews data on successful operation. The response body should be in the form of JSON object like [this](#successful-response-structure)

// - Review Model (Books review)
// ```yaml
// {
//   bookId: {ObjectId, mandatory, refs to book model},
//   reviewedBy: {string, mandatory, default 'Guest', value: reviewer's name},
//   reviewedAt: {Date, mandatory},
//   rating: {number, min 1, max 5, mandatory},
//   review: {string, optional}
//   isDeleted: {boolean, default: false},
// }


// ``yaml
// {
//   "_id": ObjectId("88abc190ef0288abc190ef88"),
//   bookId: ObjectId("88abc190ef0288abc190ef55"),
//   reviewedBy: "Jane Doe",
//   reviewedAt: "2021-09-17T04:25:07.803Z",
//   rating: 4,
//   review: "An exciting nerving thriller. A gripping tale. A must read book."
// }
// ```
// ```

const createReview = async function (req, res) {
    try {
      let bookId = req.params.bookId;
      let data = req.body;
      console.log(bookId);
  
      let { review, reviewedBy, rating,reviewedAt } = data;
  
      if (!bookId) return res.status(400).send({ status: false, message: "bookId is not present" });
  
      if (!isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "this is not a valid book Id" });
      
  
      let findBook = await bookModel.findById( bookId );
      console.log(findBook);
      if (!findBook) return res.status(404).send({ status: false, message: "no books with this Books id" });
  
      if (findBook.isDeleted == true) return res.status(404).send({ status: false, message: "This book has been deleted" });
      
      if (!(rating <= 5 && rating >= 1)) return res.status(400).send({ status: false, message: "please provide a valid rating" });
  
    //   if (!isValid(review)) return res.status(400).send({ status: false, message: "review is a required field" });
  
    //   if (!isValid(reviewedBy)) return res.status(400).send({ status: false, message: "review is a required field" });
      
      data.bookId = bookId;
      data.reviewedAt = moment(reviewedAt).format('YYYY-MM-DD')

      let reviewCreated = await reviewModel.create(data);

      
      if (reviewCreated) {
        let updatedBook = await bookModel.findOneAndUpdate({ _id: bookId },{ $inc: { reviews: 1, } },{ new: true }).select({ ISBN : 0 , __v : 0 }).lean();

        let reviewData = await reviewModel.find({ bookId }).select({ isDeleted : 0 , createdAt : 0 , updatedAt : 0 , __v : 0 })

        if(reviewData.length == 0) reviewData.push("No reviews available !!!")

        updatedBook.reviewsData = reviewData

        return res.status(201).send({ status: true, message: "Review published", data: updatedBook });
    }
    } catch (err) {
      return res.status(500).send({ status: false, message: err.message});
  }
  }

module.exports = { createBook , getAllBooks , getBookById , updatebooks , deleteBook,createReview }

