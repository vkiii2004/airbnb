const mongoose = require("mongoose");
const fetch = require("node-fetch");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
 .then(()=>{
    console.log("connected to db");
 })
 .catch((err)=>{
    console.log(err);
 });

async function main(){
    await mongoose.connect(MONGO_URL);
}



//  const initDB =async()=>{
//     await Listing.deleteMany({});
//     initData.data = initData.data.map((obj)=>({...obj,owner:"688609c60d5110c1de0e94a8"}));
//     await Listing.insertMany(initData.data);
//     console.log("data was initilized");
//  };


async function getCoordinates(location) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`
        );
        const data = await response.json();

        if (data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon)
            };
        }
    } catch (err) {
        console.error("Geocoding error:", err);
    }
    return { lat: null, lon: null };
}



// const initDB = async () => {
//     await Listing.deleteMany({});

//     for (let obj of initData.data) {
//         obj.owner = "688609c60d5110c1de0e94a8"; // fixed owner
//         const coords = await getCoordinates(obj.location); // get lat/lon
//         obj.coordinates = coords; // add coordinates to listing

//         await new Listing(obj).save();
//         console.log(`Inserted: ${obj.title} (${coords.lat}, ${coords.lon})`);

//         // Delay 1 second to respect Nominatim rate limit
//         await new Promise(resolve => setTimeout(resolve, 1000));
//     }

//     console.log("Data was initialized with coordinates");
//     mongoose.connection.close();
// };

//  initDB();


async function updateListings() {
    const listings = await Listing.find({
        $or: [
            { "coordinates.lat": null },
            { "coordinates.lon": null }
        ]
    });

    console.log(`Found ${listings.length} listings to update.`);

    for (let listing of listings) {
        if (!listing.location) continue;

        const coords = await getCoordinates(listing.location);
        listing.coordinates = coords;
        await listing.save();

        console.log(`Updated: ${listing.title} → (${coords.lat}, ${coords.lon})`);

        // 1-second delay to respect Nominatim's limit
        await new Promise(res => setTimeout(res, 1000));
    }

    console.log("All listings updated.");
    mongoose.connection.close();
}

main().then(updateListings);