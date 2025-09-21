import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TrakSure API",
      version: "1.0.0",
      description: `
        API completa para sistema de rastreamento GPS TrakSure.
        
        Esta API fornece endpoints para gerenciar empresas, dispositivos, 
        localizações, geocercas, alertas e dashboard analytics.
        
        ## Autenticação
        
        A API utiliza JWT (JSON Web Tokens) para autenticação. 
        Inclua o token no header: \`Authorization: Bearer <token>\`
        
        ## Funcionalidades Principais
        
        - **Autenticação**: Login, registro e gerenciamento de usuários
        - **Empresas**: CRUD de empresas e relacionamentos
        - **Dispositivos**: Gerenciamento de dispositivos GPS
        - **Localizações**: Histórico e dados em tempo real
        - **Geocercas**: Criação e monitoramento de áreas geográficas
        - **Alertas**: Sistema de notificações e alertas
        - **Dashboard**: Analytics e relatórios
      `,
      contact: {
        name: "TrakSure Support",
        email: "support@traksure.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Servidor de Desenvolvimento",
      },
      {
        url: "http://3.141.99.232:3000",
        description: "Servidor de Produção",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Token JWT para autenticação",
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Mensagem de erro",
            },
            details: {
              type: "object",
              description: "Detalhes adicionais do erro",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
              description: "Dados da resposta",
            },
            message: {
              type: "string",
              example: "Operação realizada com sucesso",
            },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "array",
              items: {},
            },
            pagination: {
              type: "object",
              properties: {
                page: {
                  type: "integer",
                  example: 1,
                },
                limit: {
                  type: "integer",
                  example: 10,
                },
                total: {
                  type: "integer",
                  example: 100,
                },
                pages: {
                  type: "integer",
                  example: 10,
                },
              },
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            name: {
              type: "string",
              example: "João Silva",
            },
            role: {
              type: "string",
              enum: ["ADMIN", "USER"],
              example: "USER",
            },
            companyId: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
          },
        },
        Company: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            name: {
              type: "string",
              example: "Empresa XYZ Ltda",
            },
            email: {
              type: "string",
              format: "email",
              example: "contato@empresa.com",
            },
            phone: {
              type: "string",
              example: "(11) 99999-9999",
            },
            address: {
              type: "string",
              example: "Rua das Flores, 123",
            },
            cnpj: {
              type: "string",
              example: "12.345.678/0001-90",
            },
            isActive: {
              type: "boolean",
              example: true,
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
          },
        },
        Device: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            imei: {
              type: "string",
              example: "123456789012345",
            },
            name: {
              type: "string",
              example: "Veículo 001",
            },
            model: {
              type: "string",
              example: "GT06N",
            },
            status: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE", "MAINTENANCE"],
              example: "ACTIVE",
            },
            companyId: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            lastSeen: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
          },
        },
        Location: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            deviceId: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            latitude: {
              type: "number",
              format: "double",
              example: -23.5505,
            },
            longitude: {
              type: "number",
              format: "double",
              example: -46.6333,
            },
            speed: {
              type: "number",
              format: "double",
              example: 45.5,
            },
            heading: {
              type: "number",
              format: "double",
              example: 180.0,
            },
            altitude: {
              type: "number",
              format: "double",
              example: 750.0,
            },
            batteryLevel: {
              type: "integer",
              example: 85,
            },
            gpsSignal: {
              type: "integer",
              example: 4,
            },
            timestamp: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
          },
        },
        Geofence: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            name: {
              type: "string",
              example: "Zona Centro",
            },
            type: {
              type: "string",
              enum: ["CIRCLE", "POLYGON"],
              example: "CIRCLE",
            },
            centerLatitude: {
              type: "number",
              format: "double",
              example: -23.5505,
            },
            centerLongitude: {
              type: "number",
              format: "double",
              example: -46.6333,
            },
            radius: {
              type: "number",
              format: "double",
              example: 1000.0,
            },
            coordinates: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  lat: {
                    type: "number",
                    format: "double",
                  },
                  lng: {
                    type: "number",
                    format: "double",
                  },
                },
              },
            },
            isActive: {
              type: "boolean",
              example: true,
            },
            companyId: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
          },
        },
        Alert: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            type: {
              type: "string",
              enum: ["SPEED", "GEOFENCE", "PANIC", "BATTERY", "OFFLINE"],
              example: "SPEED",
            },
            severity: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
              example: "HIGH",
            },
            message: {
              type: "string",
              example: "Velocidade acima do limite: 80 km/h",
            },
            deviceId: {
              type: "string",
              format: "uuid",
              example: "123e4567-e89b-12d3-a456-426614174000",
            },
            isRead: {
              type: "boolean",
              example: false,
            },
            isResolved: {
              type: "boolean",
              example: false,
            },
            metadata: {
              type: "object",
              description: "Dados adicionais do alerta",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              example: "2023-01-01T00:00:00.000Z",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
