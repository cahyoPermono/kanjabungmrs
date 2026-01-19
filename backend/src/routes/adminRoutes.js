"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const adminController_1 = require("../controllers/adminController");
const router = (0, express_1.Router)();
// Protect all admin routes
router.use(auth_1.authenticateToken, (0, auth_1.authorizeRole)(['ADMIN']));
// Division Routes
router.get('/divisions', adminController_1.getDivisions);
router.post('/divisions', adminController_1.createDivision);
router.put('/divisions/:id', adminController_1.updateDivision);
router.delete('/divisions/:id', adminController_1.deleteDivision);
// User Routes
router.get('/users', adminController_1.getUsers);
router.post('/users', adminController_1.createUser);
router.put('/users/:id', adminController_1.updateUser);
router.delete('/users/:id', adminController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map