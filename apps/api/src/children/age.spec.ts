import { ageInMonths, ageStage, isValidDateOnly, todayInShanghai } from './age.js';

describe('ageInMonths', () => {
  it.each([
    ['2021-03-10', '2026-03-09', 59], // 生日前一天
    ['2021-03-10', '2026-03-10', 60], // 生日当天
    ['2021-01-31', '2026-02-28', 60], // 月末：2 月没有 31 号
    ['2026-01-31', '2026-02-28', 0],
    ['2020-02-29', '2026-02-28', 71], // 闰日生日
    ['2020-02-29', '2026-03-01', 72],
    ['2026-11-05', '2026-11-05', 0],
  ])('%s 到 %s = %i 个月', (birthday, today, expected) => {
    expect(ageInMonths(birthday, today)).toBe(expected);
  });
});

describe('ageStage', () => {
  it.each([
    [0, 'S1'], [59, 'S1'], [60, 'S2'], [83, 'S2'], [84, 'S3'], [107, 'S3'], [108, 'S4'], [200, 'S4'],
  ])('%i 个月 → %s', (months, stage) => {
    expect(ageStage(months as number)).toBe(stage);
  });
});

describe('isValidDateOnly', () => {
  it('拒绝不存在的日期和错误格式', () => {
    expect(isValidDateOnly('2023-02-30')).toBe(false);
    expect(isValidDateOnly('2023-2-3')).toBe(false);
    expect(isValidDateOnly('2023-02-28T00:00:00Z')).toBe(false);
    expect(isValidDateOnly('2024-02-29')).toBe(true);
  });
});

describe('todayInShanghai', () => {
  it('UTC 晚上 20 点已是北京时间次日', () => {
    expect(todayInShanghai(new Date('2026-11-04T20:00:00Z'))).toBe('2026-11-05');
  });
});
