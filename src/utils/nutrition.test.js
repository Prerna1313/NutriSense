import { describe, it, expect } from 'vitest';
import { calculateBMR, calculateTDEE, calculateMacros } from './nutrition';

describe('Nutrition Utils', () => {
  describe('calculateBMR', () => {
    it('calculates BMR correctly for male', () => {
      // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
      expect(calculateBMR(80, 180, 30, 'male')).toBe(1780);
    });

    it('calculates BMR correctly for female', () => {
      // 10*65 + 6.25*165 - 5*28 - 161 = 650 + 1031.25 - 140 - 161 = 1380.25
      expect(calculateBMR(65, 165, 28, 'female')).toBe(1380);
    });

    it('returns 0 if any argument is missing', () => {
      expect(calculateBMR(80, 180, undefined, 'male')).toBe(0);
    });
  });

  describe('calculateTDEE', () => {
    it('calculates TDEE for moderate activity', () => {
      // 1780 * 1.55 = 2759
      expect(calculateTDEE(1780, 'moderate')).toBe(2759);
    });

    it('defaults to sedentary if level is invalid', () => {
      // 1780 * 1.2 = 2136
      expect(calculateTDEE(1780, 'invalid')).toBe(2136);
    });
  });

  describe('calculateMacros', () => {
    it('calculates macros for losing weight', () => {
      const result = calculateMacros(2500, 'lose');
      expect(result.calories).toBe(2000);
      expect(result.protein).toBe(150); // 2000 * 0.3 / 4
      expect(result.carbs).toBe(200);   // 2000 * 0.4 / 4
      expect(result.fat).toBe(67);      // 2000 * 0.3 / 9 = 66.66
    });

    it('calculates macros for gaining weight', () => {
      const result = calculateMacros(2500, 'gain');
      expect(result.calories).toBe(2800);
    });
  });
});
