const employeesService = require('../services/EmployeesService');
const service = new employeesService();

async function getEmployees(req, res, next) {
    try {
        const employees = await service.getEmployees();
        res.json(employees);
    } catch (error) {
        next(error);
    }
}

async function getEmployeeById(req, res, next) {

    try {
        const id = req.params.id;
        const employee = await service.getEmployeeById(id);
        if (!employee) {
            const error = new Error('Employee not found');
            error.status = 404;
            throw error;
        }
        res.json(employee);
    } catch (error) {
        next(error);
    }
}

async function postEmployee(req, res, next) {
    try {
        const data = req.body;
        data.created_by = req.userIdToken;
        const newEmployee = await service.postEmployee(data);
        res.status(201).json(newEmployee);
    } catch (error) {
        next(error);
    }
}

async function putEmployee(req, res, next) {
    try {
        const id = req.params.id;
        const data = req.body;
        data.updated_by = req.userIdToken;
        const updatedEmployee = await service.putEmployee(id, data);
        res.json(updatedEmployee);
    } catch (error) {
        next(error);
    }
}

async function deleteEmployee(req, res, next) {
    try {
        const id = req.params.id;
        const data = { deleted_by: req.userIdToken}
        await service.deleteEmployee(id,data);
        res.status(204).send();
    } catch (error) {
        next(error);
    }  
}

module.exports = { getEmployees, getEmployeeById, postEmployee, putEmployee, deleteEmployee }
