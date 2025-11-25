import { Router } from 'express';
import { CustomRoleController } from '../controllers/customRoleController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// 사용자의 커스텀 역할 목록 조회 - 인증 필요
router.get('/', authenticateToken, CustomRoleController.getCustomRoles);

// 커스텀 역할 생성 - 인증 필요
router.post('/', authenticateToken, CustomRoleController.createCustomRole);

// 커스텀 역할 수정 - 인증 필요
router.put('/:id', authenticateToken, CustomRoleController.updateCustomRole);

// 커스텀 역할 삭제 - 인증 필요
router.delete('/:id', authenticateToken, CustomRoleController.deleteCustomRole);

export default router;

