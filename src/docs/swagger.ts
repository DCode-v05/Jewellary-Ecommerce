import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wymi API',
      version: '1.0.0',
      description: 'API documentation for Wymi Application',
    },
    servers: [
      {
        url: 'https://devapi.wymi.in', // ✅ Your live URL
      },
    ],
  },
  apis: ['./src/controllers/*.ts'], // ✅ Path to your controller files with JSDoc
};

const specs = swaggerJsdoc(options);

export { swaggerUi, specs };
