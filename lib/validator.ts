import * as avro from 'avsc';

/**
 * Recursively validates a payload against an Avro schema, handling optional fields, default values, and required fields.
 * If a field has a default value and is missing in the payload, it is ignored. If present, its type is validated.
 * Handles null and undefined values appropriately.
 * @param {Object} schema - Avro schema
 * @param {Object} payload - The payload to validate
 * @param {string} [parentField] - The parent field name for nested validation
 * @returns {string[]} - A list of validation errors
 */
export function validateAvroPayload(schema: any, payload: any, parentField: string = ''): string[] {
    const type = avro.Type.forSchema(schema);
    const errors: string[] = [];

    function validateField(field: any, fieldValue: any, fieldName: string): string[] {
        const fieldType = avro.Type.forSchema(field.type);
        const fieldErrors: string[] = [];

        // Check if the field is optional (union with "null")
        const isOptional = Array.isArray(field.type) && field.type.includes('null');
        const hasDefault = field.default !== undefined;

        if (fieldValue === undefined) {
            if (!isOptional && !hasDefault) {
                fieldErrors.push(`Missing required field: '${fieldName}'`);
            }
        } else if (fieldValue === null) {
            if (!isOptional) {
                fieldErrors.push(`Field '${fieldName}' is null, but null is not allowed`);
            }
        } else {
            // Validate field value against its type
            if (fieldType instanceof avro.types.RecordType) {
                // Recursive validation for nested records
                fieldErrors.push(...validateAvroPayload(field.type, fieldValue, fieldName));
            } else if (fieldType instanceof avro.types.ArrayType) {
                // Validate items in arrays
                if (!Array.isArray(fieldValue)) {
                    fieldErrors.push(`Invalid type for field '${fieldName}', expected: array, received: ${typeof fieldValue}`);
                } else {
                    fieldValue.forEach((item: any, index: number) => {
                        fieldErrors.push(...validateField({ type: field.type.items }, item, `${fieldName}[${index}]`));
                    });
                }
            } else {
                // Validate field value against its type
                if (!fieldType.isValid(fieldValue)) {
                    fieldErrors.push(`Invalid type for field '${fieldName}', expected: ${fieldType.toString()}, received: ${typeof fieldValue}`);
                }
            }
        }

        return fieldErrors;
    }

    // Validate each field in the schema
    schema.fields.forEach((field: any) => {
        const fieldName = parentField ? `${parentField}.${field.name}` : field.name;
        const fieldValue = payload[field.name];
        errors.push(...validateField(field, fieldValue, fieldName));
    });

    return errors;
}
