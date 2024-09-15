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
                type: 'array',
                items: {
                    type: 'record',
                    name: 'Pet',
                    fields: [
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
        const payload = {
            name: 'John Doe',
            pets: [{ kind: 'DOG', name: 'Buddy' }]
        };
        const errors = validateAvroPayload(schema, payload);
        expect(errors.length).toBe(0);
    });

    it('should return errors for missing required fields', () => {
        const payload = {
            pets: [{ kind: 'DOG', name: 'Buddy' }]
        };
        const errors = validateAvroPayload(schema, payload);
        expect(errors).toContain("Missing required field: 'name'");
    });

    it('should return errors for invalid nested field types', () => {
        const payload = {
            name: 'John Doe',
            pets: [{ kind: 'DOG', name: 123 }] // name should be a string
        };
        const errors = validateAvroPayload(schema, payload);
        expect(errors).toContain("Invalid type for field 'pets[0].name', expected: \"string\", received: number");
    });

    it('should handle default values properly', () => {
        const payload = {
            name: 'John Doe',
            pets: [] // 'age' and 'country' should use default values
        };
        const errors = validateAvroPayload(schema, payload);
        expect(errors.length).toBe(0);
    });

    it('should return errors for missing nested fields', () => {
        const payload = {
            name: 'John Doe',
            pets: [{}] // Missing 'kind' and 'name' in Pet record
        };
        const errors = validateAvroPayload(schema, payload);
        expect(errors).toContain("Missing required field: 'pets[0].kind'");
        expect(errors).toContain("Missing required field: 'pets[0].name'");
    });

    it('should handle null values correctly if allowed', () => {
        const payload = {
            name: 'John Doe',
            pets: [{ kind: 'CAT', name: null }] // name is null, but it's a string so it should be an error
        };
        const errors = validateAvroPayload(schema, payload);
        expect(errors).toContain("Field 'pets[0].name' is null, but null is not allowed");
    });

    it('should return errors for invalid field types in arrays', () => {
        const payload = {
            name: 'John Doe',
            pets: [{ kind: 'DOG', name: true }] // 'name' should be a string
        };
        const errors = validateAvroPayload(schema, payload);
        expect(errors).toContain("Invalid type for field 'pets[0].name', expected: \"string\", received: boolean");
    });

    it('should return errors for incorrect field type for an optional field', () => {
        const payload = {
            name: 'John Doe',
            age: 'not-an-int', // 'age' should be an int or null
            pets: []
        };
        const errors = validateAvroPayload(schema, payload);
        expect(errors).toContain("Invalid type for field 'age', expected: [\"null\",\"int\"], received: string");
    });
});
