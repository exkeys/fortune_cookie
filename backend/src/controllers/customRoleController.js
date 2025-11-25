import { CustomRoleService } from '../services/customRoleService.js';
import { validateUUID, validateUUIDs } from '../utils/validation.js';
import { asyncHandler } from '../utils/controllerWrapper.js';
import { successResponse } from '../utils/responseHelper.js';

export class CustomRoleController {
  // 사용자의 커스텀 역할 목록 조회
  static getCustomRoles = asyncHandler(async (req, res) => {
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    
    const result = await CustomRoleService.getCustomRoles(userId);
    return successResponse(res, result);
  });

  // 커스텀 역할 생성
  static createCustomRole = asyncHandler(async (req, res) => {
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    const { roleName } = req.body;
    
    const result = await CustomRoleService.createCustomRole(userId, roleName || '');
    return successResponse(res, result);
  });

  // 커스텀 역할 수정
  static updateCustomRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    const { roleName } = req.body;
    
    validateUUIDs({ id });
    
    const result = await CustomRoleService.updateCustomRole(id, userId, roleName);
    return successResponse(res, result);
  });

  // 커스텀 역할 삭제
  static deleteCustomRole = asyncHandler(async (req, res) => {
    const { id } = req.params;
    // userId는 인증 미들웨어에서 설정됨
    const userId = req.userId;
    
    validateUUID(id);
    
    const result = await CustomRoleService.deleteCustomRole(id, userId);
    return successResponse(res, result);
  });
}

