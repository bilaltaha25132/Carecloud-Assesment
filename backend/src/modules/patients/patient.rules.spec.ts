import {
  formatDateOfBirth,
  isValidEmail,
  isValidName,
  normalizePhone,
  normalizeSex,
  normalizeState,
  normalizeZip,
  parseDateOfBirth,
} from './patient.rules';

describe('patient.rules', () => {
  describe('isValidName', () => {
    it.each(["O'Brien", 'Mary-Ann', 'José', 'De La Cruz'])('accepts %s', (name) => {
      expect(isValidName(name)).toBe(true);
    });

    it.each(['', 'J0hn', 'Smith!', 'a'.repeat(51), ' Lee'])('rejects %j', (name) => {
      expect(isValidName(name)).toBe(false);
    });
  });

  describe('normalizePhone', () => {
    it('strips formatting and a leading country code', () => {
      expect(normalizePhone('(415) 555-0142')).toBe('4155550142');
      expect(normalizePhone('+1 415 555 0142')).toBe('4155550142');
    });

    it.each(['123', '415555014', '0155550142', '4151550142', '41555501421'])(
      'rejects %s',
      (input) => {
        expect(normalizePhone(input)).toBeNull();
      },
    );
  });

  describe('parseDateOfBirth', () => {
    it('parses MM/DD/YYYY and ISO to UTC midnight', () => {
      expect(parseDateOfBirth('7/4/1990')?.toISOString()).toBe('1990-07-04T00:00:00.000Z');
      expect(parseDateOfBirth('1990-07-04')?.toISOString()).toBe('1990-07-04T00:00:00.000Z');
    });

    it('accepts today but nothing later', () => {
      const today = new Date();
      const iso = today.toISOString().slice(0, 10);
      expect(parseDateOfBirth(iso)).not.toBeNull();

      const tomorrow = new Date(today.getTime() + 86_400_000).toISOString().slice(0, 10);
      expect(parseDateOfBirth(tomorrow)).toBeNull();
    });

    it.each(['02/30/1990', '13/01/1990', '12/01/1899', 'July 4 1990', ''])(
      'rejects %j',
      (input) => {
        expect(parseDateOfBirth(input)).toBeNull();
      },
    );

    it('round-trips through formatDateOfBirth', () => {
      expect(formatDateOfBirth(parseDateOfBirth('03/09/1988')!)).toBe('03/09/1988');
    });
  });

  describe('normalizeState', () => {
    it('accepts codes in any case and full names', () => {
      expect(normalizeState('ca')).toBe('CA');
      expect(normalizeState('New York')).toBe('NY');
      expect(normalizeState('district of columbia')).toBe('DC');
    });

    it('rejects unknown values', () => {
      expect(normalizeState('ZZ')).toBeNull();
      expect(normalizeState('Ontario')).toBeNull();
    });
  });

  describe('normalizeZip', () => {
    it('accepts five digits and ZIP+4 in either spelling', () => {
      expect(normalizeZip('94105')).toBe('94105');
      expect(normalizeZip('94105-1234')).toBe('94105-1234');
      expect(normalizeZip('94105 1234')).toBe('94105-1234');
    });

    it.each(['9410', '941051', 'ABCDE'])('rejects %s', (input) => {
      expect(normalizeZip(input)).toBeNull();
    });
  });

  describe('normalizeSex', () => {
    it('maps spoken variants to the enum', () => {
      expect(normalizeSex('female')).toBe('FEMALE');
      expect(normalizeSex('Decline to answer')).toBe('DECLINE_TO_ANSWER');
      expect(normalizeSex('prefer not to say')).toBe('DECLINE_TO_ANSWER');
      expect(normalizeSex('DECLINE_TO_ANSWER')).toBe('DECLINE_TO_ANSWER');
    });

    it('rejects anything else', () => {
      expect(normalizeSex('robot')).toBeNull();
    });
  });

  describe('isValidEmail', () => {
    it('applies a pragmatic shape check', () => {
      expect(isValidEmail('jane@example.com')).toBe(true);
      expect(isValidEmail('jane@example')).toBe(false);
      expect(isValidEmail('not an email')).toBe(false);
    });
  });
});
