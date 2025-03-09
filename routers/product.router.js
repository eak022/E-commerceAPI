const express = require("express");
const router = express.Router();
const productController = require("../controllers/Product.controller");
const { upload, uploadToFirebase } = require("../middlewares/file.middleware");
const authJwt = require("../middlewares/authJwt.middleware");

//http://localhost:5000/api/v1/product
router.post("/", upload, uploadToFirebase, productController.createProduct);
//http://localhost:5000/api/v1/post
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.get("/name/:name", productController.getProductByName); 
router.get("/author/:id", productController.getProductByAuthor);
router.delete("/:id", productController.deleteProduct);
router.put("/:id", upload, uploadToFirebase, productController.updateProduct);
module.exports = router;
