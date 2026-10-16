import { isPrivateIp, isPrivateIpv4, isPrivateIpv6, validateUrl, SsrfError } from '../../src/utils/ssrf';

describe('SSRF Protection Utility', () => {
  describe('isPrivateIpv4', () => {
    it('should identify loopback IPs as private', () => {
      expect(isPrivateIpv4('127.0.0.1')).toBe(true);
      expect(isPrivateIpv4('127.0.0.2')).toBe(true);
    });

    it('should identify 10.0.0.0/8 IPs as private', () => {
      expect(isPrivateIpv4('10.0.0.1')).toBe(true);
      expect(isPrivateIpv4('10.255.255.254')).toBe(true);
    });

    it('should identify 192.168.0.0/16 IPs as private', () => {
      expect(isPrivateIpv4('192.168.1.1')).toBe(true);
      expect(isPrivateIpv4('192.168.0.100')).toBe(true);
    });

    it('should identify 172.16.0.0 - 172.31.255.255 IPs as private', () => {
      expect(isPrivateIpv4('172.16.0.1')).toBe(true);
      expect(isPrivateIpv4('172.24.10.5')).toBe(true);
      expect(isPrivateIpv4('172.31.255.255')).toBe(true);
    });

    it('should identify link-local AWS metadata IP 169.254.169.254 as private', () => {
      expect(isPrivateIpv4('169.254.169.254')).toBe(true);
      expect(isPrivateIpv4('169.254.1.1')).toBe(true);
    });

    it('should identify 0.0.0.0 as private', () => {
      expect(isPrivateIpv4('0.0.0.0')).toBe(true);
    });

    it('should permit public IPv4 addresses', () => {
      expect(isPrivateIpv4('8.8.8.8')).toBe(false);
      expect(isPrivateIpv4('1.1.1.1')).toBe(false);
      expect(isPrivateIpv4('142.250.190.46')).toBe(false);
      expect(isPrivateIpv4('172.15.0.1')).toBe(false);
      expect(isPrivateIpv4('172.32.0.1')).toBe(false);
    });
  });

  describe('isPrivateIpv6', () => {
    it('should identify IPv6 loopback and unspecified as private', () => {
      expect(isPrivateIpv6('::1')).toBe(true);
      expect(isPrivateIpv6('::')).toBe(true);
    });

    it('should identify unique local fc00::/7 and link-local fe80::/10 as private', () => {
      expect(isPrivateIpv6('fc00::1')).toBe(true);
      expect(isPrivateIpv6('fd12:3456:789a::1')).toBe(true);
      expect(isPrivateIpv6('fe80::1')).toBe(true);
    });

    it('should identify IPv4-mapped IPv6 loopback as private', () => {
      expect(isPrivateIpv6('::ffff:127.0.0.1')).toBe(true);
      expect(isPrivateIpv6('::ffff:10.0.0.1')).toBe(true);
      expect(isPrivateIpv6('::ffff:8.8.8.8')).toBe(false);
    });
  });

  describe('isPrivateIp', () => {
    it('should route IPv4 and IPv6 properly', () => {
      expect(isPrivateIp('127.0.0.1')).toBe(true);
      expect(isPrivateIp('::1')).toBe(true);
      expect(isPrivateIp('8.8.8.8')).toBe(false);
    });
  });

  describe('validateUrl', () => {
    it('should reject non-http and non-https schemes', async () => {
      await expect(validateUrl('file:///etc/passwd')).rejects.toThrow(SsrfError);
      await expect(validateUrl('ftp://example.com/file')).rejects.toThrow(SsrfError);
      await expect(validateUrl('gopher://example.com')).rejects.toThrow(SsrfError);
    });

    it('should reject localhost and internal hostnames', async () => {
      await expect(validateUrl('http://localhost:3000')).rejects.toThrow(SsrfError);
      await expect(validateUrl('http://app.internal/status')).rejects.toThrow(SsrfError);
      await expect(validateUrl('http://metadata.google.internal')).rejects.toThrow(SsrfError);
    });

    it('should reject direct private IP URLs', async () => {
      await expect(validateUrl('http://127.0.0.1:8080')).rejects.toThrow(SsrfError);
      await expect(validateUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow(SsrfError);
      await expect(validateUrl('http://10.0.0.5/secret')).rejects.toThrow(SsrfError);
    });
  });
});
