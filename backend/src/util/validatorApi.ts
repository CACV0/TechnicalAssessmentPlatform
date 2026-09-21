import path from 'path';
import * as OpenApiValidator from 'express-openapi-validator';

const openApiSpecificationFile = path.join(__dirname, '../../static/platafform_OAS.json');

export const OpenApiValidatorProvider = OpenApiValidator.middleware({
    apiSpec: openApiSpecificationFile,
    validateRequests: true,
    validateResponses: false
});
