const multer = require("multer");
const path = require("path");
const {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} = require("firebase/storage");
const { initializeApp } = require("firebase/app");
const firebaseConfig = require("../configs/firebase.config");

//init firebase
const app = initializeApp(firebaseConfig);
const firebaseStorage = getStorage(app);

// Set up storage configuration
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB limit
  fileFilter: (req, file, cb) => {
    checkFileType(file, cb); // Check file extension
  },
}).single("file"); // input name

// Function to check file type
function checkFileType(file, cb) {
  const fileTypes = /jpeg|jpg|png|gif|webp/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Error: Only image files are allowed!")); // Use Error object
  }
}

//upload to firebase storage
async function uploadToFirebase(req, res, next) {
  if (!req.file) {
    next();
    return;
  }
  const storageRef = ref(
    firebaseStorage,
    `SE-Shop/boy/${req?.file?.originalname}`
  );
  const metadata = {
    contentType: req?.file?.mimetype,
  };
  try {
    //uploading.....
    const snapshot = await uploadBytesResumable(
      storageRef,
      req?.file?.buffer,
      metadata
    );
    req.file.firebaseUrl = await getDownloadURL(snapshot.ref);
    next();
    return;
  } catch (error) {
    res.status(500).json({
      message:
        error.message || "Something wen wrong while uploading to firebase",
    });
  }
}

module.exports = { upload, uploadToFirebase };