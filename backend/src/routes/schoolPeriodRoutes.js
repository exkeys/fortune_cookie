import { Router } from 'express';
import { SchoolPeriodController } from '../controllers/schoolPeriodController.js';

const router = Router();

// 학교 기간 생성
router.post('/', SchoolPeriodController.createSchoolPeriod);

// 모든 학교 기간 조회
router.get('/', SchoolPeriodController.getAllSchoolPeriods);

// 특정 날짜에 활성화된 학교 기간 조회
router.get('/active', SchoolPeriodController.getActiveSchoolPeriods);

// 특정 학교 기간 조회
router.get('/:id', SchoolPeriodController.getSchoolPeriod);

// 학교 기간 수정
router.put('/:id', SchoolPeriodController.updateSchoolPeriod);

// 학교 기간 삭제
router.delete('/:id', SchoolPeriodController.deleteSchoolPeriod);

export default router;



