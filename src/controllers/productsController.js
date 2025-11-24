const ProductsService = require('../services/productsService.js');
const service = new ProductsService();

async function getProducts(req, res, next) {
    try {
        // Pass all query params to the service for filtering
        const products = await service.getProducts(req.query);
        res.json(products);
    } catch (error) {
        next(error);
    }
}

async function getProductById(req, res, next) {
    try {
        const id = req.params.id;
        const product = await service.getProductById(id);
        res.json(product);
    } catch (error) {
        next(error);
    }
}

async function postProduct(req, res, next) {
    try {
        const data = req.body;
        data.created_by = req.userIdToken;
        data.usernameToken = req.usernameToken;
        data.ipAddress = req.ip; 
        const newProduct = await service.postProduct(data);
        res.status(201).json(newProduct);
    } catch (error) {
        next(error);
    }
}

async function putProduct(req, res, next) {
    try {
        const id = req.params.id;
        const data = req.body;
        data.updated_by = req.userIdToken;
        data.usernameToken = req.usernameToken;
        data.ipAddress = req.ip; 
        const updatedProduct = await service.putProduct(id, data);
        res.json(updatedProduct);
    } catch (error) {
        next(error);
    }
}

async function restoreProduct(req, res, next) {
    try {
        const { id } = req.params;
        const data = {
            updated_by: req.userIdToken,
            usernameToken: req.usernameToken,
            ipAddress: req.ip
        };
        const result = await service.restoreProduct(id, data);
        res.json(result);
    } catch (error) {
        next(error);
    }
}

async function deleteProduct(req, res, next) {
    try {
        const id = req.params.id;
        const data = { deleted_by: req.userIdToken, usernameToken: req.usernameToken, ipAddress: req.ip }; 
        const result = await service.deleteProduct(id,data);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

async function postCategory(req, res, next) {
    try {
        const data = req.body;
        data.created_by = req.userIdToken;
        data.usernameToken = req.usernameToken;
        data.ipAddress = req.ip; 
        const newCategory = await service.postCategory(data);
        res.status(201).json(newCategory);
    } catch (error) {
        next(error);
    }
}

async function putCategory(req, res, next) {
    try {
        const { id } = req.params;
        const data = req.body;
        data.updated_by = req.userIdToken;
        data.usernameToken = req.usernameToken;
        data.ipAddress = req.ip;
        const result = await service.putCategory(id, data);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

async function deleteCategory(req, res, next) {
    try {
        const id = req.params.id;
        const data = { deleted_by: req.userIdToken, usernameToken: req.usernameToken, ipAddress: req.ip }; 
        const result = await service.deleteCategory(id,data);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}

async function getCategories(req, res, next) {
    try {
        const categories = await service.getCategories();
        res.json(categories);
    } catch (error) {
        next(error);
    }
}

async function getCategoryById(req, res, next) {
    try {
        const { id } = req.params;
        const result = await service.getCategoryById(id);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
}


module.exports = { getProducts, getProductById, postProduct, putProduct, deleteProduct, postCategory, putCategory, deleteCategory, getCategories, getCategoryById, restoreProduct }
