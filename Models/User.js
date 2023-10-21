import mongoose from 'mongoose';

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
  
const requestSchema = new mongoose.Schema({
    email : { type: String },
    name : { type: String },
    price: { type: String , required: true },
    category: { type: String ,  required: true },
    subcategory: { type: String ,  required: true },
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
