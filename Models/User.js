import mongoose from 'mongoose';
const newurl = "mongodb+srv://shaikhahsanali:brandsteps123@cluster0.0ikweun.mongodb.net/?retryWrites=true&w=majority"
const oldmongooseUrl = "mongodb+srv://samrajafri018:12345@cluster0.b8ydbpc.mongodb.net/"
const mongodbURI = process.env.mongodbURI || "mongodb+srv://shaikhahsanali:brandsteps123@cluster0.0ikweun.mongodb.net/?retryWrites=true&w=majority";
/////////////////////////////////////////////////////////////////////////////////////////////////

const userSchema = new mongoose.Schema({
  //username: String,
  firstname: String,
  lastname: String,
  email: String,
  phone: String,
  company: String,
  postal: String,
  vat: String,
  address: String,
  companyaddress: String,
  country: String,
  city: String,
  state: String,
  password: String,
  createdOn: { type: Date, default: Date.now },
});

const customerSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    phone: String,
    postal: String,
    address: String,
    country: String,
    city: String,
    state: String,
    password: String,
    createdOn: { type: Date, default: Date.now },
  });
  export const customerModel = mongoose.model('customers', customerSchema);


const productSchema = new mongoose.Schema({
    email : { type: String },
    name : { type: String },
    price: { type: String , required: true },
    description : { type: String, required: true },
    imageUrl: { type: String  ,  required: true },
    category: { type: String ,  required: true },
    createdOn: { type: Date, default: Date.now },
});
export const tweetModel = mongoose.model('ProductsAll', productSchema);
  
const orderSchema = new mongoose.Schema({
    email: String,
    username: String,
    phone: String,
    cardnumber: String,
    cardexp: String,
    cardcvc: String,
    address: String,
    state: String,
    zip: String,
    shipping: String,
    total: String,
    createdOn: { type: Date, default: Date.now },
  });
  export const orderModel = mongoose.model('orders', orderSchema);

const requestSchema = new mongoose.Schema({
    email : { type: String },
    name : { type: String },
    price: { type: String , required: true },
    category: { type: String ,  required: true },
    subcategory: { type: String ,  required: true },


    color: { type: String },
    material: { type: String },
    capacity: { type: String },
    shelves: { type: String },
    lid: { type: String },
    lightening: { type: String },
    noiselevel: { type: String },
    door: { type: String },
    Width: { type: String },
    depth: { type: String },
    height: { type: String },
    weight: { type: String },
    powerconsumption: { type: String },
    powersupply: { type: String },
    power: { type: String },
    temperature: { type: String },
    refrigerant: { type: String },
    cooling: { type: String },
    warranty: { type: String },

    //dishwashing
    castors: { type: String },
    tray: { type: String },
    pressure: { type: String },
    production: { type: String },
    innerheight: { type: String },
    basket: { type: String },
    programs: { type: String },
    volume: { type: String },
    watercycles: { type: String },
    waterpump: { type: String },
    rinsepower: { type: String },
    dispenser: { type: String },
    rinsefunc: { type: String },
    volumerinse: { type: String },

    //appliance
    version: { type: String },
    tap: { type: String },
    output: { type: String },

    //stanless steel
    productfeet: { type: String },
    bottomshelf: { type: String },
    bowlpos: { type: String },
    sinkbowl: { type: String },
    upstand: { type: String },
    assembled: { type: String },

    //cooking
    timer: { type: String },
    controls: { type: String },
    
    //food prep
    rpm: { type: String },
    speeds: { type: String },
    included: { type: String },
    weldingbar: { type: String },

    //beverage equipment
    bin: { type: String },
    waterconnection: { type: String },
    type: { type: String },

    //pizza and grill
    lock: { type: String },
    worksurface: { type: String },
    gasconsumption: { type: String },
    defrost: { type: String },

    //ovens
    steam: { type: String },

    //utensils
    pieces: { type: String },
    diameter: { type: String },
    length: { type: String },

    description : { type: String, required: true },
    imageUrl: { type: String  ,  required: true },
    isApproved: { type: Boolean, default: false },
    createdOn: { type: Date, default: Date.now },
});
export const requestModel = mongoose.model('RequestAll', requestSchema);


const User = mongoose.model('User', userSchema);
mongoose.connect(mongodbURI);
////////////////mongodb connected disconnected events///////////////////////////////////////////////
mongoose.connection.on('connected', function () {//connected
    console.log("Mongoose is connected");
});

mongoose.connection.on('disconnected', function () {//disconnected
    console.log("Mongoose is disconnected");
    process.exit(1);
});

mongoose.connection.on('error', function (err) {//any error
    console.log('Mongoose connection error: ', err);
    process.exit(1);
});

process.on('SIGINT', function () {/////this function will run jst before app is closing
    console.log("app is terminating");
    mongoose.connection.close(function () {
        console.log('Mongoose default connection closed');
        process.exit(0);
    });
});
////////////////mongodb connected disconnected events///////////////////////////////////////////////

export default User;
