const ProductsService = require('../services/productsService.js');
const service = new ProductsService();

async function getProducts(req, res, next) {
    try {
        const { name, category_id } = req.query;
        const products = await service.getProducts({ name, category_id });
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
        const updatedProduct = await service.putProduct(id, data);
        res.json(updatedProduct);
    } catch (error) {
        next(error);
    }
}

async function updateMinStock(req, res, next) {
    try {
        const id = req.params.id;
        const { min_stock } = req.body;
        const updated_by = req.userIdToken;
        const updatedProduct = await service.updateMinStock(id, min_stock, updated_by);
        res.json(updatedProduct);
    } catch (error) {
        next(error);
    }
}

async function deleteProduct(req, res, next) {
    try {
        const id = req.params.id;
        const data = { deleted_by: req.userIdToken}
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
        const newCategory = await service.postCategory(data);
        res.status(201).json(newCategory);
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

module.exports = { getProducts, getProductById, postProduct, putProduct, updateMinStock, deleteProduct, postCategory, getCategories }
