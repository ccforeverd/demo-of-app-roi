import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "App ROI Dashboard API",
      version: "1.0.0",
      description: "应用 ROI 数据看板后端 API",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "开发服务器",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
