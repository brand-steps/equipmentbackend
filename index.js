import express from "express";
import User from "./Models/User.js"; // Adjust the path based on your directory structure
import bcrypt from "bcrypt";
import crypto from "crypto"; // Import the 'crypto' module
import jwt from "jsonwebtoken"; // Import the jsonwebtoken library
import nodemailer from "nodemailer";
const app = express();
const port = process.env.PORT || 8000; // Use process.env.PORT for flexibility
import cors from "cors";
const SECRET = process.env.SECRET || "topsecret";
import cookieParser from "cookie-parser";
import multer from "multer";
import bucket from "./Bucket/Firebase.js";
import fs from "fs";
import path from "path";
import { tweetModel } from "./Models/User.js";
import { requestModel } from "./Models/User.js";

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use(cors({origin: true, credentials: true}));
{/*}
app.use(
  cors({
    origin: ["https://www.equipmentsuppliers.co.uk", "*"],
    credentials: true,
  })
); 
*/}


const storage = multer.diskStorage({
  destination: "/tmp",
  filename: function (req, file, cb) {
    console.log("mul-file: ", file);
    cb(null, `${new Date().getTime()}-${file.originalname}`);
  },
});
const upload = multer({ storage });
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Ahemd Raza ");
});
app.get("/api/search", async (req, res) => {
  const searchTerm = req.query.q;
  try {
    const results = await requestModel.find({
      name: new RegExp(searchTerm, "i"),
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.get("/api/v1/paginatpost", async (req, res) => {
  try {
    let query = requestModel.find({isApproved : true});

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * pageSize;
    const total = await requestModel.countDocuments();

    const pages = Math.ceil(total / pageSize);

    query = query.skip(skip).limit(pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }

    const result = await query;
    console.log(result);
    res.status(200).json({
      status: "success",
      count: result.length,
      page,
      pages: pages,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});
app.get("/api/v1/products", async (req, res) => {
  try {
    const result = await tweetModel.find().exec(); // Using .exec() to execute the query
    // console.log(result);
    res.send({
      message: "Got all products successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Server error",
    });
  }
});

app.get("/api/v1/AllUser", async (req, res) => {
  try {
    const result1 = await User.find().exec(); // Using .exec() to execute the query
    // console.log(result);
    res.send({
      message: "Got all users successfully",
      data: result1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Server error",
    });
  }
});


app.delete("/api/v1/customer/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const deletedData = await tweetModel.deleteOne({ _id: id });

    if (deletedData.deletedCount !== 0) {
      res.send({
        message: "Product has been deleted successfully",
      });
    } else {
      res.status(404).send({
        message: "No Product found with this id: " + id,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Server error",
    });
  }
});
app.delete("/api/v1/request/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const deletedData = await requestModel.deleteOne({ _id: id });

    if (deletedData.deletedCount !== 0) {
      res.send({
        message: "request has been deleted successfully",
      });
    } else {
      res.status(404).send({
        message: "No request found with this id: " + id,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Server error",
    });
  }
});


app.delete("/api/v1/user/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const deletedData = await User.deleteOne({ _id: id });

    if (deletedData.deletedCount !== 0) {
      res.send({
        message: "user has been deleted successfully",
      });
    } else {
      res.status(404).send({
        message: "No User found with this id: " + id,
      });
    }
  } catch (err) {
    res.status(500).send({
      message: "Server error",
    });
  }
});

app.post("/api/v1/AddProduct", upload.any(), (req, res) => {
  try {
    const body = req.body;

    if (
      // validation
      !body.email ||
      !body.name ||
      !body.price ||
      !body.description
    ) {
      res.status(400).send({
        message: "required parameters missing",
      });
      return;
    }

    console.log("req.body: ", req.body);
    console.log("req.files: ", req.files);

    console.log("uploaded file name: ", req.files[0].originalname);
    console.log("file type: ", req.files[0].mimetype);
    console.log("file name in server folders: ", req.files[0].filename);
    console.log("file path in server folders: ", req.files[0].path);

    bucket.upload(
      req.files[0].path,
      {
        destination: `tweetPictures/${req.files[0].filename}`, // give destination name if you want to give a certain name to file in bucket, include date to make name unique otherwise it will replace previous file with the same name
      },
      function (err, file, apiResponse) {
        if (!err) {
          file
            .getSignedUrl({
              action: "read",
              expires: "03-09-2999",
            })
            .then((urlData, err) => {
              if (!err) {
                console.log("public downloadable url: ", urlData[0]); // this is public downloadable url

                try {
                  fs.unlinkSync(req.files[0].path);
                  //file removed
                } catch (err) {
                  console.error(err);
                }

                let addPRoduct = new tweetModel({
                  email: body.email,
                  name: body.name,
                  price: body.price,
                  imageUrl: urlData[0],
                  description: body.description,
                  category: body.value,
                });

                addPRoduct.save().then((res) => {
                  // res.send(res)

                  console.log(res, "ProDUCT ADD");
                });

                // tweetModel.create({
                //     name : body.Name,
                //     price: body.Price,
                //     imageUrl: urlData[0],
                //     description : body.Description,
                // },
                //     (err, saved) => {
                //         if (!err) {
                //             console.log("saved: ", saved);

                //             res.send({
                //                 message: "tweet added successfully"
                //             });
                //         } else {
                //             console.log("err: ", err);
                //             res.status(500).send({
                //                 message: "server error"
                //             })
                //         }
                //     })
              }
            });
        } else {
          console.log("err: ", err);
          res.status(500).send();
        }
      }
    );
  } catch (error) {
    console.log("error: ", error);
  }
});
app.post("/signup", async (req, res) => {
  try {
    const { username, email, phone , password } = req.body;

    // Check if user with the given email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Create a new user
    const newUser = new User({
      username,
      email,
      phone,
      password,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/register", async (req, res) => {
  try {
    const { firstname, lastname, email, phone ,company,postal,vat,address,companyaddress,country,city,state, password } = req.body;

    // Check if user with the given email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Create a new user
    const newUser = new User({
      firstname,
      lastname,
      email,
      phone,
      company,
      postal,
      vat,
      address,
      companyaddress,
      country,
      city,
      state,
      password,
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  try {
    let body = req.body;
    body.email = body.email.toLowerCase();

    if (!body.email || !body.password) {
      res.status(400).send(`required fields missing, request example: ...`);
      return;
    }

    // check if user exists
    const data = await User.findOne(
      { email: body.email },
      "username email password"
    );

    if (data && body.password === data.password) {
      // user found
      console.log("User Successfully Logged In !");
      console.log("data: ", data);

      const token = jwt.sign(
        {
          _id: data._id,
          email: data.email,
          iat: Math.floor(Date.now() / 1000) - 30,
          exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
        },
        SECRET
      );

      console.log("token: ", token);

      res.cookie("Token", token, {
        maxAge: 86_400_000,
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });

      res.send({
        message: "login successful",
        profile: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          age: data.age,
          _id: data._id,
        },
      });

      return;
    } else {
      // user not found
      console.log("user not found");
      res.status(401).send({ message: "Incorrect email or password" });
    }
  } catch (error) {
    console.log("error: ", error);
    res.status(500).send({ message: "login failed, please try later" });
  }
});
app.use("/api/v1", (req, res, next) => {
  console.log("req.cookies: ", req.cookies.Token);

  if (!req?.cookies?.Token) {
    res.status(401).send({
      message: "include http-only credentials with every request",
    });
    return;
  }

  jwt.verify(req.cookies.Token, SECRET, function (err, decodedData) {
    if (!err) {
      console.log("decodedData: ", decodedData);

      const nowDate = new Date().getTime() / 1000;

      if (decodedData.exp < nowDate) {
        res.status(401);
        res.cookie("Token", "", {
          maxAge: 1,
          httpOnly: true,
          sameSite: "none",
          secure: true,
        });
        res.send({ message: "token expired" });
      } else {
        console.log("token approved");

        req.body.token = decodedData;
        next();
      }
    } else {
      res.status(401).send("invalid token");
    }
  });
});
app.get("/api/v1/profile", (req, res) => {
  const _id = req.body.token._id;
  const getData = async () => {
    try {
      const user = await User.findOne(
        { _id: _id },
        "email password firstname -_id"
      ).exec();
      if (!user) {
        res.status(404).send({});
        return;
      } else {
        res.set({
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Surrogate-Control": "no-store",
        });
        res.status(200).send(user);
      }
    } catch (error) {
      console.log("error: ", error);
      res.status(500).send({
        message: "something went wrong on server",
      });
    }
  };
  getData();
});
app.post("/logout", (req, res) => {
  try {
    //   res.clearCookie('Token', {
    //     httpOnly: true,
    //     samesite: "none",
    //     secure: true
    // });
    // res.send({ message: "logged out successful" })

    res.cookie("Token", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: "none", // Change to 'strict' if not using HTTPS
      secure: true, // Remove this line if not using HTTPS
      path: "/", // Make sure the path matches the one used when setting the token cookie
      domain: "http://localhost:3000/", // Make sure the domain matches the one used when setting the token cookie
    });
    res.send({ message: "Logged out successful" });
    
  } catch (error) {
    console.error("Error clearing cookie:", error);
    res.status(500).send({ message: "Logout failed, please try later" });
  }
});


app.put("/EditProduct/:id", async (req,res) => {

    const productId = req.params.id;
    const product = await tweetModel.findOne({_id:productId});

    if (!product) {

       email = req.body.email;
        product.name = req.body.name;
        price = req.body.price;
        description = req.body.descryption;
        imageUrl = req.body.image;
        category = req.body.category;

        const savedProduct = await product.save();
        res.send({message: "product editted", product : savedProduct})

    }
    else {
        res.send({message: "product not editted", product : savedProduct})

    }

});


app.get("/singleproducts/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const result = await requestModel.find({_id : productId}).exec(); // Using .exec() to execute the query
    // console.log(result);
    res.send({
      message: "Got all products successfully",
      data: result,
    });
    console.log(result);
console.log(productId);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Server error",
    });
  }
});

app.get("/selectproducts/:email", async (req, res) => {
  let body = req.body;
  const Email = req.params.email;
  try {
    const result = await requestModel.find({email : Email}).exec(); // Using .exec() to execute the query
    console.log(Email);
    res.send({
      message: "Got all products successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Server error",
    });
  }
});

// admin product request api

app.post("/productrequest", upload.any(), (req, res) => {
  try {
    const body = req.body;

    if (
      // validation
      !body.email ||
      !body.name ||
      !body.price ||
      !body.subcategory ||
      !body.description
    ) {
      res.status(400).send({
        message: "required parameters missing",
      });
      return;
    }

    console.log("req.body: ", req.body);
    console.log("req.files: ", req.files);

    console.log("uploaded file name: ", req.files[0].originalname);
    console.log("file type: ", req.files[0].mimetype);
    console.log("file name in server folders: ", req.files[0].filename);
    console.log("file path in server folders: ", req.files[0].path);

    bucket.upload(
      req.files[0].path,
      {
        destination: `tweetPictures/${req.files[0].filename}`, // give destination name if you want to give a certain name to file in bucket, include date to make name unique otherwise it will replace previous file with the same name
      },
      function (err, file, apiResponse) {
        if (!err) {
          file
            .getSignedUrl({
              action: "read",
              expires: "03-09-2999",
            })
            .then((urlData, err) => {
              if (!err) {
                console.log("public downloadable url: ", urlData[0]); // this is public downloadable url

                try {
                  fs.unlinkSync(req.files[0].path);
                  //file removed
                } catch (err) {
                  console.error(err);
                }

                let addPRoduct = new requestModel({
                  email: body.email,
                  name: body.name,
                  price: body.price,
                  category: body.value,
                  subcategory : body.subcategory,
                  imageUrl: urlData[0],
                  description: body.description,

                });

                addPRoduct.save().then((res) => {
                  // res.send(res)

                  console.log(res, "ProDUCT ADD");
                });

                
              }
            });
        } else {
          console.log("err: ", err);
          res.status(500).send();
        }
      }
    );
  } catch (error) {
    console.log("error: ", error);
  }
});

app.post("/productrequestnew", upload.any(), (req, res) => {
  try {
    const body = req.body;

    if (
      // validation
      !body.email ||
      !body.name ||
      !body.price ||
      !body.subcategory ||
      !body.description
    ) {
      res.status(400).send({
        message: "required parameters missing",
      });
      return;
    }

    console.log("req.body: ", req.body);
    console.log("req.files: ", req.files);

    console.log("uploaded file name: ", req.files[0].originalname);
    console.log("file type: ", req.files[0].mimetype);
    console.log("file name in server folders: ", req.files[0].filename);
    console.log("file path in server folders: ", req.files[0].path);

    bucket.upload(
      req.files[0].path,
      {
        destination: `tweetPictures/${req.files[0].filename}`, // give destination name if you want to give a certain name to file in bucket, include date to make name unique otherwise it will replace previous file with the same name
      },
      function (err, file, apiResponse) {
        if (!err) {
          file
            .getSignedUrl({
              action: "read",
              expires: "03-09-2999",
            })
            .then((urlData, err) => {
              if (!err) {
                console.log("public downloadable url: ", urlData[0]); // this is public downloadable url

                try {
                  fs.unlinkSync(req.files[0].path);
                  //file removed
                } catch (err) {
                  console.error(err);
                }

                let addPRoduct = new requestModel({
                  email: body.email,
                  name: body.name,
                  price: body.price,
                  category: body.value,
                  subcategory : body.subcategory,
                  imageUrl: urlData[0],
                  description: body.description,
                  
                  color: body.color,
                  material: body.material,
                  capacity : body.capacity,
                  shelves: body.shelves,
                  lid: body.lid,
                  lightening: body.lightening,
                  noiselevel : body.level,
                  door: body.door,
                  Width: body.Width,
                  depth: body.depth,
                  height : body.height,
                  weight: body.weight,
                  powerconsumption: body.consumption,
                  powersupply : body.supply,
                  power: body.power,
                  temperature: body.temperature,
                  refrigerant: body.refrigerant,
                  cooling : body.cooling,
                  warranty: body.warranty,

                  //dishwashing
                  castors: body.castors,
                  tray: body.tray,
                  pressure : body.pressure,
                  production: body.production,
                  innerheight: body.innerheight,
                  basket: body.basket,
                  programs : body.programs,
                  volume: body.volume,
                  watercycles: body.cycles,
                  waterpump : body.pump,
                  rinsepower: body.rinsepower,
                  dispenser: body.dispenser,
                  rinsefunc: body.rinsefunc,
                  volumerinse : body.volumerinse,

                  //appliance
                  version: body.version,
                  tap: body.tap,
                  output : body.output,

                  //stanless steel
                  productfeet: body.feet,
                  bottomshelf: body.bottomshelf,
                  bowlpos : body.bowlpos,
                  sinkbowl: body.sinkbowl,
                  upstand: body.upstand,
                  assembled : body.assembly,

                  //cooking
                  timer: body.timer,
                  controls : body.controls,

                  // food prep
                  rpm: body.rpm,
                  speeds : body.speeds,
                  included: body.included,
                  weldingbar : body.weldingbar,

                  //beverage equipment
                  bin : body.bin,
                  waterconnection: body.waterconnection,
                  type : body.type,

                  //pizza and grill
                  lock: body.lock,
                  worksurface : body.worksurface,
                  gasconsumption: body.gasconsumption,
                  defrost : body.defrost,

                      //ovens
                      steam: body.steam,

                      //utensils
                      pieces : body.pieces,
                      diameter: body.diameter,
                      length : body.length,

                });

                addPRoduct.save().then((res) => {
                  // res.send(res)

                  console.log(res, "ProDUCT ADD");
                });

                
              }
            });
        } else {
          console.log("err: ", err);
          res.status(500).send();
        }
      }
    );
  } catch (error) {
    console.log("error: ", error);
  }
});



app.get("/productrequestall", async (req, res) => {
  try {
    const result = await requestModel.find({isApproved : false}).exec(); // Using .exec() to execute the query
    // console.log(result);
    res.send({
      message: "Got all products successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Server error",
    });
  }
});

app.get("/productrequestalltrue", async (req, res) => {
  try {
    const result = await requestModel.find({isApproved : true}).exec(); // Using .exec() to execute the query
    // console.log(result);
    res.send({
      message: "Got all products successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Server error",
    });
  }
});

app.delete("/productreq/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const deletedData = await requestModel.deleteOne({ _id: id });

    if (deletedData.deletedCount !== 0) {
      res.send({
        message: "Product has been deleted successfully",
      });
    } else {
      res.status(404).send({
        message: "No Product found with this id: " + id,
      });
    }
    console.log("id",id);
  } catch (err) {
    res.status(500).send({
      message: "Server error",
    });
  }
});

app.get("/productreqedit/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const FindData = await requestModel.findById({ _id: id });

    if (FindData) {
     // FindData.isApproved = true;
   await FindData.updateOne({ isApproved: true });
      res.send({
        message: "Product has been approved successfully",
        data : FindData,
      });
    } else {
      res.status(404).send({
        message: "No Product found with this id: " + id,
      });
    }
    console.log("data",FindData);
    console.log("id",id);
  } catch (err) {
    res.status(500).send({
      message: "Server error",
    });
  }

});


//edit prodcut checking
app.get("/singleproduct/:id", async (req,res) => {     //chane name into id

  const productId = req.params.id;
  const product = await requestModel.findOne({_id:productId});

  res.send({message: "product found", Product : product})


});

app.put("/editsProducts/:id", async (req,res) => {

  const productId = req.params.id;
  const updatedProductData = req.body;

  try{
  const product = await requestModel.findByIdAndUpdate(productId, updatedProductData, {
    new: true, // Return the updated product
  });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json(product);
}
catch {
  res.status(500).json({ message: 'Server Error' });
}


});

//edit user 

app.get("/edituser/:id", async (req,res) => {     

  const UserId = req.params.id;
  const users = await User.findOne({_id:UserId});

  res.send({message: "User found", Product : users})
});



app.put("/edittedUsers/:id", async (req,res) => {

  const UserID = req.params.id;
  const updatedUserData = req.body;

  try{
  const product = await User.findByIdAndUpdate(UserID, updatedUserData, {
    new: true, 
  });
  if (!product) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(product);
}
catch {
  res.status(500).json({ message: 'Server Error' });
}
});

//checking user product display in user dashboard
app.get("/productsdisplay/:email", async (req, res) => {
  const Email = req.params.email;
  try {
    const result = await requestModel.find({email : Email}).exec(); // Using .exec() to execute the query
    // console.log(result);
    res.send({
      message: "Got all products successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send({
      message: "Server error",
    });
  }
console.log("email",Email);
});

// category displays

app.get("/Refrigration", async (req, res) => {
  try {
    let query = requestModel.find({category : "Refrigeration"});

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * pageSize;
    const total = await requestModel.countDocuments();

    const pages = Math.ceil(total / pageSize);

    query = query.skip(skip).limit(pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }

    const result = await query;
    console.log(result);
    res.status(200).json({
      status: "success",
      count: result.length,
      page,
      pages: pages,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});

app.get("/Diswashing", async (req, res) => {
  try {
    let query = requestModel.find({category : "Diswashing"});

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * pageSize;
    const total = await requestModel.countDocuments();

    const pages = Math.ceil(total / pageSize);

    query = query.skip(skip).limit(pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }

    const result = await query;
    console.log(result);
    res.status(200).json({
      status: "success",
      count: result.length,
      page,
      pages: pages,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});
app.get("/Appliances", async (req, res) => {
  try {
    let query = requestModel.find({category : "Appliances"});

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * pageSize;
    const total = await requestModel.countDocuments();

    const pages = Math.ceil(total / pageSize);

    query = query.skip(skip).limit(pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }

    const result = await query;
    console.log(result);
    res.status(200).json({
      status: "success",
      count: result.length,
      page,
      pages: pages,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});

app.get("/StainlessSteel", async (req, res) => {
  try {
    let query = requestModel.find({category : "Stainless Steel"});

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * pageSize;
    const total = await requestModel.countDocuments();

    const pages = Math.ceil(total / pageSize);

    query = query.skip(skip).limit(pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }

    const result = await query;
    console.log(result);
    res.status(200).json({
      status: "success",
      count: result.length,
      page,
      pages: pages,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});

app.get("/Cooking", async (req, res) => {
  try {
    let query = requestModel.find({category : "Cooking"});

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * pageSize;
    const total = await requestModel.countDocuments();

    const pages = Math.ceil(total / pageSize);

    query = query.skip(skip).limit(pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }

    const result = await query;
    console.log(result);
    res.status(200).json({
      status: "success",
      count: result.length,
      page,
      pages: pages,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});

app.get("/Foodprep", async (req, res) => {
  try {
    let query = requestModel.find({category : "Food prep"});

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * pageSize;
    const total = await requestModel.countDocuments();

    const pages = Math.ceil(total / pageSize);

    query = query.skip(skip).limit(pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }

    const result = await query;
    console.log(result);
    res.status(200).json({
      status: "success",
      count: result.length,
      page,
      pages: pages,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});

app.get("/Beverage", async (req, res) => {
  try {
    let query = requestModel.find({category : "Beverage Equipment"});

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * pageSize;
    const total = await requestModel.countDocuments();

    const pages = Math.ceil(total / pageSize);

    query = query.skip(skip).limit(pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }

    const result = await query;
    console.log(result);
    res.status(200).json({
      status: "success",
      count: result.length,
      page,
      pages: pages,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});

app.get("/pizzeria", async (req, res) => {
  try {
    let query = requestModel.find({category : "Pizzeria & Grill"});

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * pageSize;
    const total = await requestModel.countDocuments();

    const pages = Math.ceil(total / pageSize);

    query = query.skip(skip).limit(pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }

    const result = await query;
    console.log(result);
    res.status(200).json({
      status: "success",
      count: result.length,
      page,
      pages: pages,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});

app.get("/ovens", async (req, res) => {
  try {
    let query = requestModel.find({category : "Oven & Steamers"});

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * pageSize;
    const total = await requestModel.countDocuments();

    const pages = Math.ceil(total / pageSize);

    query = query.skip(skip).limit(pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }

    const result = await query;
    console.log(result);
    res.status(200).json({
      status: "success",
      count: result.length,
      page,
      pages: pages,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});

app.get("/Utensils", async (req, res) => {
  try {
    let query = requestModel.find({category : "Utensils"});

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * pageSize;
    const total = await requestModel.countDocuments();

    const pages = Math.ceil(total / pageSize);

    query = query.skip(skip).limit(pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }

    const result = await query;
    console.log(result);
    res.status(200).json({
      status: "success",
      count: result.length,
      page,
      pages: pages,
      data: result,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
});

app.get("/subcategory/:subcat", async (req, res) => {
  const subcat = req.params.subcat;
  try {
    let query = requestModel.find({subcategory : subcat});

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * pageSize;
    const total = await requestModel.countDocuments();

    const pages = Math.ceil(total / pageSize);

    query = query.skip(skip).limit(pageSize);

    if (page > pages) {
      return res.status(404).json({
        status: "fail",
        message: "No page found",
      });
    }

    const result = await query;
    console.log("res",result);
    res.status(200).json({
      status: "success",
      count: result.length,
      page,
      pages: pages,
      data: result,
    });
  }
 
  catch (error) {
    console.log(error);
    res.status(500).json({
      status: "error",
      message: "Server Error",
    });
  }
  console.log("subcat", subcat);
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
