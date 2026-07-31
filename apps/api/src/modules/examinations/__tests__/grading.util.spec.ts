import { calculateGrade, calculatePercentage } from '../utils/grading.util';

describe('grading.util', () => {
  describe('calculateGrade', () => {
    // Exact boundaries matter most here — an off-by-one would silently
    // mis-grade every student sitting right at a cutoff.
    it.each([
      [100, 'A+'],
      [90, 'A+'],
      [89.99, 'A'],
      [80, 'A'],
      [79.99, 'B'],
      [70, 'B'],
      [69.99, 'C'],
      [60, 'C'],
      [59.99, 'D'],
      [50, 'D'],
      [49.99, 'F'],
      [0, 'F'],
    ])('grades %s%% as %s', (percentage, expectedGrade) => {
      expect(calculateGrade(percentage)).toBe(expectedGrade);
    });
  });

  describe('calculatePercentage', () => {
    it('computes a straightforward percentage', () => {
      expect(calculatePercentage(45, 50)).toBe(90);
    });

    it('does not divide by zero when max marks is 0', () => {
      expect(calculatePercentage(0, 0)).toBe(0);
    });
  });
});
