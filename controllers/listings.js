const Listing = require("../models/listing.js");
const fetch = require("node-fetch");
module.exports.index = async(req,res)=>{
    const allListings = await Listing.find({});
    res.render("listings/index.ejs",{allListings});
};

module.exports.search =async (req, res) => {
    const { country } = req.query;

    try {
        const listings = await Listing.find({
            country: { $regex: new RegExp(country, "i") }
        });

        res.render("listings/index.ejs", {  allListings: listings  }); // ✅ FIX
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong while searching.");
        res.redirect("listings");
    }
};

module.exports.showListing =async(req,res)=>{
    let{id} = req.params;
    const listing = await Listing.findById(id).populate({
        path:"reviews",
        populate:{
        path:"author"
       },  
    }).populate("owner");
    if(!listing){
       req.flash("error","Listing you requested for does not exist!"); 
       res.redirect("/listings");
    }
    res.render("listings/show.ejs",{listing});
};

module.exports.createListing =async(req,res,next)=>{
    let url= req.file.path;
    let filename = req.file.filename;
    req.body.listing.price = parseFloat(req.body.listing.price);
    const location = req.body.listing.location;
    const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
        );
        const geoData = await geoRes.json();

        let lat = null;
        let lon = null;
        if (geoData.length > 0) {
            lat = parseFloat(geoData[0].lat);
            lon = parseFloat(geoData[0].lon);
        }
    // const newListing=new Listing(req.body.listing);
    // newListing.owner = req.user._id;
    // newListing.image = {url,filename};
    const newListing = new Listing({
            ...req.body.listing,
            coordinates: { lat, lon }, // store coordinates
            owner: req.user._id,
            image: { url, filename }
        });
    await newListing.save();
    req.flash("success","New Listing Created!");
    res.redirect("/listings");
};



module.exports.editListing =async (req,res)=>{
    let{id} = req.params;
    const listing = await Listing.findById(id); 
    if(!listing){
        req.flash("error","Listing you requested for does not exist!");
        re.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl=originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs",{listing,originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let updatedData = { ...req.body.listing };
    if (updatedData.location) {
        try {
            const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(updatedData.location)}`
            );
            const geoData = await geoRes.json();
            if (geoData.length > 0) {
                updatedData.coordinates = {
                    lat: parseFloat(geoData[0].lat),
                    lon: parseFloat(geoData[0].lon)
                };
            } else {
                updatedData.coordinates = { lat: null, lon: null }; // fallback
            }
        } catch (err) {
            console.error("Error updating coordinates:", err);
        }
    }

    let listing = await Listing.findByIdAndUpdate(id, updatedData, { new: true });

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing =async (req,res)=>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success"," Listing deleted!");
    res.redirect("/listings");
};