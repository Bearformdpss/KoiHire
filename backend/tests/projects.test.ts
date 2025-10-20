import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/server';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client');

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('Projects Endpoints', () => {
  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    role: 'CLIENT'
  };

  const mockToken = jwt.sign({ userId: mockUser.id }, process.env.JWT_SECRET || 'test-secret');

  beforeEach(() => {
    jest.clearAllMocks();
    (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
  });

  describe('GET /api/projects', () => {
    it('should return projects list', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          title: 'Test Project',
          description: 'Test description',
          minBudget: 1000,
          maxBudget: 2000,
          status: 'OPEN',
          client: { username: 'client1', avatar: null, rating: 4.5 },
          category: { name: 'Web Development', slug: 'web-dev' },
          skills: [{ skill: { name: 'React' } }],
          _count: { applications: 3 }
        }
      ];

      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);
      (mockPrisma.project.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/projects')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.projects[0].title).toBe('Test Project');
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter projects by category', async () => {
      const mockProjects = [
        {
          id: 'project-1',
          title: 'Web Project',
          categoryId: 'web-category-id'
        }
      ];

      (mockPrisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);
      (mockPrisma.project.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/projects?category=web-category-id')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'web-category-id'
          })
        })
      );
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project for client', async () => {
      const projectData = {
        title: 'New Project',
        description: 'Project description goes here with enough detail',
        requirements: 'Must have React experience',
        minBudget: 1000,
        maxBudget: 2000,
        timeline: '4 weeks',
        categoryId: 'category-id-123',
        skills: ['skill-id-1', 'skill-id-2']
      };

      const mockProject = {
        id: 'project-123',
        ...projectData,
        clientId: mockUser.id,
        status: 'OPEN',
        client: mockUser,
        category: { name: 'Web Development' },
        skills: [
          { skill: { name: 'React' } },
          { skill: { name: 'Node.js' } }
        ]
      };

      (mockPrisma.project.create as jest.Mock).mockResolvedValue(mockProject);

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.project.title).toBe(projectData.title);
      expect(response.body.project.clientId).toBe(mockUser.id);
    });

    it('should require authentication', async () => {
      const projectData = {
        title: 'New Project',
        description: 'Project description',
        minBudget: 1000,
        maxBudget: 2000,
        timeline: '4 weeks',
        categoryId: 'category-id-123',
        skills: ['skill-id-1']
      };

      const response = await request(app)
        .post('/api/projects')
        .send(projectData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No token');
    });

    it('should validate required fields', async () => {
      const invalidProjectData = {
        title: 'Short', // Too short
        description: 'Short desc', // Too short
        minBudget: -100, // Invalid
        maxBudget: 50, // Less than minBudget
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${mockToken}`)
        .send(invalidProjectData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation error');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return project details', async () => {
      const mockProject = {
        id: 'project-123',
        title: 'Test Project',
        description: 'Test description',
        client: mockUser,
        category: { name: 'Web Development' },
        skills: [{ skill: { name: 'React' } }],
        applications: [],
        _count: { applications: 0 }
      };

      (mockPrisma.project.findUnique as jest.Mock).mockResolvedValue(mockProject);

      const response = await request(app)
        .get('/api/projects/project-123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.project.id).toBe('project-123');
      expect(response.body.project.title).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      (mockPrisma.project.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/projects/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Project not found');
    });
  });
});