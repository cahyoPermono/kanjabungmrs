"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const goalController_1 = require("../controllers/goalController");
const router = (0, express_1.Router)();
router.use(auth_1.authenticateToken);
router.get('/', (0, auth_1.authorizeRole)(['MANAGER', 'EMPLOYEE']), goalController_1.getGoals); // Both can view goals
router.get('/employees', (0, auth_1.authorizeRole)(['MANAGER']), goalController_1.getDivisionEmployees); // Manager sees employees
router.get('/team-overview', (0, auth_1.authorizeRole)(['MANAGER']), goalController_1.getTeamOverview); // Manager sees hierarchical team view
router.post('/', (0, auth_1.authorizeRole)(['MANAGER']), goalController_1.createGoal);
router.delete('/:id', (0, auth_1.authorizeRole)(['MANAGER', 'ADMIN']), goalController_1.deleteGoal);
exports.default = router;
//# sourceMappingURL=goalRoutes.js.map