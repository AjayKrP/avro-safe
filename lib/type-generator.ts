const PRIMITIVES = new Set(['string', 'boolean', 'int', 'long', 'float', 'double', 'bytes', 'null']);

/**
 * Converts Avro schema to TypeScript types
 * @param {Object} schema - Avro schema
 * @returns {string} - TypeScript type definition
 */
function avroSchemaToTypeScript(schema: any): string {
    if (typeof schema === 'string') {
        // Primitive type, or a bare reference to an already-defined record/enum name
        return PRIMITIVES.has(schema) ? avroPrimitiveToTypeScript(schema) : schema;
    } else if (Array.isArray(schema)) {
        // Union types
        return schema.map(avroSchemaToTypeScript).join(' | ');
    }

    if (schema.logicalType) {
        const mapped = logicalTypeToTypeScript(schema.logicalType);
        if (mapped) return mapped;
        // Unrecognized logicalType: fall back to the underlying Avro type below
    }

    if (schema.type === 'record') {
        // Record type (interface)
        return schema.name;
    } else if (schema.type === 'enum') {
        // Enum type
        return schema.name;
    } else if (schema.type === 'array') {
        // Array type
        return `${avroSchemaToTypeScript(schema.items)}[]`;
    } else if (schema.type === 'map') {
        // Map type
        return `{ [key: string]: ${avroSchemaToTypeScript(schema.values)} }`;
    } else if (schema.type === 'fixed') {
        // Fixed byte array
        return 'Uint8Array';
    } else if (typeof schema.type === 'string') {
        // Primitive type wrapped in object form, e.g. { type: 'long' }
        return avroPrimitiveToTypeScript(schema.type);
    }

    throw new Error(`Unsupported Avro type: ${schema.type}`);
}

/**
 * Maps an Avro logicalType to its TypeScript representation.
 * Returns null when unrecognized so callers fall back to the base type.
 * @param {string} logicalType - Avro logicalType annotation
 * @returns {string | null} - TypeScript type, or null if unrecognized
 */
function logicalTypeToTypeScript(logicalType: string): string | null {
    switch (logicalType) {
        case 'timestamp-millis':
        case 'timestamp-micros':
        case 'local-timestamp-millis':
        case 'local-timestamp-micros':
        case 'date':
            return 'Date';
        case 'time-millis':
        case 'time-micros':
        case 'uuid':
            return 'string';
        case 'decimal':
            // Represented as a string to avoid precision loss.
            return 'string';
        default:
            return null;
    }
}

/**
 * Converts primitive Avro types to TypeScript types
 * @param {string} type - Primitive Avro type
 * @returns {string} - TypeScript type
 */
function avroPrimitiveToTypeScript(type: string): string {
    switch (type) {
        case 'string':
            return 'string';
        case 'boolean':
            return 'boolean';
        case 'int':
        case 'long':
        case 'float':
        case 'double':
            return 'number';
        case 'bytes':
            return 'Uint8Array';
        case 'null':
            return 'null';
        default:
            throw new Error(`Unsupported primitive type: ${type}`);
    }
}

/**
 * Generates a TypeScript enum from an Avro enum schema
 * @param {Object} schema - Avro enum schema
 * @returns {string} - TypeScript enum definition
 */
function generateEnum(schema: any): string {
    const enumName = schema.name;
    const enumValues = schema.symbols.map((symbol: string) => `'${symbol}'`).join(' | ');
    return `type ${enumName} = ${enumValues};`;
}

/**
 * Generates a TypeScript interface from an Avro record schema
 * @param {Object} schema - Avro record schema
 * @returns {string} - TypeScript interface definition
 */
function generateInterface(schema: any): string {
    const interfaceName = schema.name;
    const fields = schema?.fields?.map((field: any) => {
        const { type: fieldSchema, optional } = resolveFieldType(field.type);
        const fieldType = avroSchemaToTypeScript(fieldSchema);
        return `${field.name}${optional ? '?' : ''}: ${fieldType};`;
    }).join('\n  ');

    return `interface ${interfaceName} {\n  ${fields}\n}`;
}

/**
 * Unwraps a nullable union (e.g. ["null", "string"]) into its non-null
 * type plus an `optional` flag, so fields render as `field?: T` instead
 * of `field: T | null`.
 */
function resolveFieldType(fieldType: any): { type: any; optional: boolean } {
    if (!Array.isArray(fieldType) || !fieldType.includes('null')) {
        return { type: fieldType, optional: false };
    }
    const nonNull = fieldType.filter((t: any) => t !== 'null');
    return { type: nonNull.length === 1 ? nonNull[0] : nonNull, optional: true };
}

// Function to handle nested records and enums
function extractNestedDefinitions(schema: any, result: string[] = [], seen: Set<string> = new Set()): string[] {
    if (Array.isArray(schema)) {
        // Union: descend into each member
        schema.forEach((member) => extractNestedDefinitions(member, result, seen));
        return result;
    }
    if (typeof schema !== 'object' || schema === null) {
        // Primitive, or a bare reference to an already-emitted named type
        return result;
    }

    if (schema.type === 'record') {
        if (seen.has(schema.name)) return result;
        seen.add(schema.name);
        schema?.fields?.forEach((field: any) => extractNestedDefinitions(field.type, result, seen));
        result.push(generateInterface(schema));
    } else if (schema.type === 'enum') {
        if (seen.has(schema.name)) return result;
        seen.add(schema.name);
        result.push(generateEnum(schema));
    } else if (schema.type === 'array') {
        extractNestedDefinitions(schema.items, result, seen);
    } else if (schema.type === 'map') {
        extractNestedDefinitions(schema.values, result, seen);
    }
    return result;
}

module.exports = {
    avroSchemaToTypeScript,
    generateEnum,
    generateInterface,
    extractNestedDefinitions,
};