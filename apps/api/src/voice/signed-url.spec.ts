import { AudioUrlSigner } from './signed-url.js';

describe('AudioUrlSigner', () => {
  const signer = new AudioUrlSigner('x'.repeat(32));
  const id = '11111111-1111-4111-8111-111111111111';
  const exp = Math.floor(Date.now() / 1000) + 60;

  it('签名有效', () => {
    expect(signer.verify(id, exp, signer.sign(id, exp))).toBe(true);
  });

  it('篡改 id、过期时间或签名都无效', () => {
    const sig = signer.sign(id, exp);
    expect(signer.verify('22222222-2222-4222-8222-222222222222', exp, sig)).toBe(false);
    expect(signer.verify(id, exp + 1, sig)).toBe(false);
    expect(signer.verify(id, exp, sig.slice(0, -1) + (sig.endsWith('A') ? 'B' : 'A'))).toBe(false);
    expect(signer.verify(id, exp, '')).toBe(false);
  });

  it('过期无效；不同密钥签的无效', () => {
    const past = Math.floor(Date.now() / 1000) - 1;
    expect(signer.verify(id, past, signer.sign(id, past))).toBe(false);
    expect(signer.verify(id, exp, new AudioUrlSigner('y'.repeat(32)).sign(id, exp))).toBe(false);
  });
});
