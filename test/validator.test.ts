import { validateAvroPayload } from '../lib/validator';

const schema = {
    type: 'record',
    name: 'PetOwner',
    fields: [
        { name: 'name', type: 'string' },
        { name: 'age', type: ['null', 'int'], default: null },
        { name: 'country', type: 'string', default: 'Unknown' },
        {
            name: 'pets',
            type: {
                type: 'array', items: {
                    type: 'record', name: 'Pet', fields: [
                        { name: 'kind', type: { type: 'enum', name: 'PetKind', symbols: ['CAT', 'DOG'] } },
                        { name: 'name', type: 'string' }
                    ]
                }
            }
        }
    ]
};

describe('validateAvroPayload', () => {
    it('should pass validation for a valid payload', () => {
        const payload = { name: 'John Doe', pets: [{ kind: 'DOG', name: 'Buddy' }] };
        const errors = validateAvroPayload(schema, payload);
        expect(errors.length).toBe(0);
    });

    it('should return errors for missing required fields', () => {
        const payload = { pets: [{ kind: 'DOG', name: 'Buddy' }] };
        const errors = validateAvroPayload(schema, payload);
        expect(errors.length).toBeGreaterThan(0);
    });
});
