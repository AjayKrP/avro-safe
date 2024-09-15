# avro-safe

**avro-safe** is a robust and flexible Avro schema validation package designed to handle complex validation cases with ease. Whether you're dealing with required fields, optional fields, or fields with default values, **avro-safe** ensures your payloads conform to the Avro schema while providing clear and concise error reporting.

### Features
- **Default Values**: Fields with default values are automatically handled. If a field is missing from the payload, the default is used. If present, the field’s type is validated.
- **Null & Undefined Handling**: Supports `null` and `undefined` values gracefully, following the schema’s requirements.
- **Required Fields**: Ensures all required fields are present and correctly typed.
- **Comprehensive Error Reporting**: Clear and actionable error messages for missing or mismatched fields.
- **Nested Fields Validation**: Supports recursive validation for nested records and arrays.

### Installation

To install **avro-safe**, use npm:

```bash
npm install avro-safe
```

### Usage (TypeScript)

Here's how to use **avro-safe** to validate a payload against an Avro schema:

```typescript
import { validateAvroPayload } from 'avro-safe';

const schema = {
  type: 'record',
  name: 'PetOwner',
  fields: [
    { name: 'name', type: 'string' },
    { name: 'age', type: ['null', 'int'], default: null }, // Optional field with default value
    { name: 'country', type: 'string', default: 'Unknown' }, // Field with default value
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

const payload = {
  name: 'John Doe',
  pets: [
    { kind: 'DOG', name: 'Buddy' },
    { kind: 'CAT', name: 'Whiskers' }
  ]
};

const errors: string[] = validateAvroPayload(schema, payload);

if (errors.length > 0) {
  console.log('Validation failed:', errors);
} else {
  console.log('Validation successful!');
}
```

### Validation Logic

1. **Required Fields**: If a required field is missing, an error is generated.
2. **Default Values**: Fields with default values are automatically validated or ignored if absent.
3. **Optional Fields**: If a field is `null` or `undefined` and the schema allows it, validation passes.
4. **Nested Fields**: Handles validation for nested records and arrays.
5. **Clear Error Messages**: Any type mismatches or missing fields will produce detailed error messages.

### Examples

#### Valid Payload

```typescript
const validPayload = {
  name: 'Jane Doe',
  pets: [
    { kind: 'CAT', name: 'Mittens' },
    { kind: 'DOG', name: 'Rover' }
  ]
};

const validErrors: string[] = validateAvroPayload(schema, validPayload);
console.log(validErrors);  // []
```

#### Invalid Payload

```typescript
const invalidPayload = {
  name: 'Jane Doe',
  country: null,  // Invalid, should be string
  pets: [
    { name: 'Buddy' }  // Missing 'kind'
  ]
};

const invalidErrors: string[] = validateAvroPayload(schema, invalidPayload);
console.log(invalidErrors);  // ["Field 'country' is null, but null is not allowed", "Missing required field: 'kind'"]
```

### Contribute

Feel free to open issues and submit pull requests for feature enhancements, bug fixes, or improvements!

### Changes:
- **Added Nested Fields**: Included in the features section.
- **Updated Usage Examples**: Provided examples for valid and invalid payloads.
- **Enhanced Validation Logic**: Detailed how nested fields are validated and how different field types are handled.
