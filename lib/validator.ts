import * as avro from "avsc";
/**
 * Validates a payload against an Avro schema, handling optional fields, default values, and required fields.
 * If a field has a default value and is missing in the payload, it is ignored. If present, its type is validated.
 * Handles null and undefined values appropriately.
 * @param {Object} schema - Avro schema
 * @param {Object} payload - The payload to validate
 * @returns {string[]} - A list of validation errors
 */
export function validateAvroPayload(schema: any, payload: any): string[] {
    const type = avro.Type.forSchema(schema);
    const errors: string[] = [];

    // Check overall validity
    if (!type.isValid(payload)) {
        // Check each field
        schema.fields.forEach((field: any) => {
            const fieldValue = payload[field.name];
            const fieldType = avro.Type.forSchema(field.type);

            // Check if the field is optional (union with "null")
            const isOptional = Array.isArray(field.type) && field.type.includes('null');
            const hasDefault = field.default !== undefined;

            if (fieldValue === undefined) {
                if (!isOptional && !hasDefault) {
                    // If field is missing, not optional, and doesn't have a default, report an error
                    errors.push(`Missing required field: '${field.name}'`);
                }
                // If field is optional or has a default, we skip validation as the field can be absent
            } else if (fieldValue === null) {
                // If field is explicitly null, we check if null is allowed
                if (!isOptional) {
                    errors.push(`Field '${field.name}' is null, but null is not allowed`);
                }
            } else {
                // Validate field value against its type
                if (!fieldType.isValid(fieldValue)) {
                    errors.push(`Invalid type for field '${field.name}', expected: ${fieldType}, received: ${typeof fieldValue}`);
                }
            }
        });
    }

    return errors;
}
