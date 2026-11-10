import { matchNumber } from '../matchNumber';
import { TokenType } from '../../../enums/TokenType';

describe('matchNumber', () => {
    it('matches integer', () => {
        const formula = '123';
        const result = matchNumber(formula, 0);
        expect(result.token).toEqual({ type: TokenType.Number, value: '123' });
        expect(result.nextIdx).toBe(3);
    });

    it('matches decimal', () => {
        const formula = '45.67';
        const result = matchNumber(formula, 0);
        expect(result.token).toEqual({ type: TokenType.Number, value: '45.67' });
        expect(result.nextIdx).toBe(5);
    });

    it('returns null if not a number', () => {
        const formula = 'abc';
        const result = matchNumber(formula, 0);
        expect(result.token).toBeNull();
    });

    it('matches fenced integer', () => {
        const formula = '[123]';
        const result = matchNumber(formula, 0, '[', ']');
        expect(result.token).toEqual({ type: TokenType.Number, value: '123' });
        expect(result.nextIdx).toBe(5);
    });

    it('matches fenced decimal', () => {
        const formula = '[45.67]';
        const result = matchNumber(formula, 0, '[', ']');
        expect(result.token).toEqual({ type: TokenType.Number, value: '45.67' });
        expect(result.nextIdx).toBe(7);
    });

    it('returns error for invalid fenced number', () => {
        const formula = '[abc]';
        const result = matchNumber(formula, 0, '[', ']');
        expect(result.token).toBeNull();
        expect(result.error).toBeDefined();
    });

    it('falls back to normal number if no fencing', () => {
        const formula = '789';
        const result = matchNumber(formula, 0, '[', ']');
        expect(result.token).toEqual({ type: TokenType.Number, value: '789' });
        expect(result.nextIdx).toBe(3);
    });

    it('matches negative number after bracket', () => {
        const formula = '[-10, 20]';
        const result = matchNumber(formula, 1);

        expect(result.token).toEqual({ type: TokenType.Number, value: '-10' });
        expect(result.nextIdx).toBe(4);
    });

    it('does not treat subtraction minus as part of number', () => {
        const formula = 'x-10';
        const result = matchNumber(formula, 1);

        expect(result.token).toBeNull();
        expect(result.nextIdx).toBe(1);
    });
});