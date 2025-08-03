const express = require("express");
const Listing = require("../models/listing.js");
const router = express.Router();
const wrapAsync =require("../utils/wrapAsync.js");
const{isLoggedIn, isOwner,validateListing} = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer =require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({storage});

router.route("/")
 .get(wrapAsync(listingController.index))
 .post(
    isLoggedIn,
    validateListing,
    upload.single("listing[image]"),
    wrapAsync(listingController.createListing));

//New Route
router.get("/new",isLoggedIn,(req,res)=>{
    res.render("listings/new.ejs");
});

// search
router.get("/search", listingController.search);

router.route("/:id")
 .get(
    wrapAsync(listingController.showListing))
 .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing))
 .delete(
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.deleteListing));



//Edit Route
router.get("/:id/edit",
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.editListing));

module.exports= router;