import { describe, it, expect } from 'vitest';
import { getColorFromDistance, computeYellowOpacity } from '../attribution/transitions';

describe('getColorFromDistance', () => {
  it('returns red for distance < 0.2', () => {
    expect(getColorFromDistance(0)).toBe('red');
    expect(getColorFromDistance(0.1)).toBe('red');
    expect(getColorFromDistance(0.19)).toBe('red');
  });
  it('returns yellow for distance 0.2 to 0.69', () => {
    expect(getColorFromDistance(0.2)).toBe('yellow');
    expect(getColorFromDistance(0.5)).toBe('yellow');
    expect(getColorFromDistance(0.69)).toBe('yellow');
  });
  it('returns green for distance >= 0.7', () => {
    expect(getColorFromDistance(0.7)).toBe('green');
    expect(getColorFromDistance(0.9)).toBe('green');
    expect(getColorFromDistance(1.0)).toBe('green');
  });
});

describe('computeYellowOpacity', () => {
  it('returns 0.4 at distance 0.2', () => {
    expect(computeYellowOpacity(0.2)).toBeCloseTo(0.4);
  });
  it('returns 0.1 at distance 0.7', () => {
    expect(computeYellowOpacity(0.7)).toBeCloseTo(0.1);
  });
  it('clamps below 0.2', () => {
    expect(computeYellowOpacity(0.1)).toBeCloseTo(0.4);
  });
  it('clamps above 0.7', () => {
    expect(computeYellowOpacity(0.9)).toBeCloseTo(0.1);
  });
  it('midpoint is 0.25', () => {
    // at 0.45: clamped=0.45, (0.45-0.2)/0.5 = 0.5, 0.4 - 0.5*0.3 = 0.25
    expect(computeYellowOpacity(0.45)).toBeCloseTo(0.25);
  });
});
