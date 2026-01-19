"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const taskController_1 = require("../controllers/taskController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/', taskController_1.getTasks);
router.post('/', (0, auth_1.authorizeRole)(['MANAGER', 'EMPLOYEE']), taskController_1.createTask);
router.put('/:id', taskController_1.updateTask); // Check permission inside
router.delete('/:id', taskController_1.deleteTask); // Permission inside
router.post('/:id/comments', taskController_1.addComment);
router.get('/:id/history', taskController_1.getTaskHistory);
exports.default = router;
//# sourceMappingURL=taskRoutes.js.map