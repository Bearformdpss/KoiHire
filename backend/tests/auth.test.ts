import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/server';
import { PrismaClient } from '@prisma/client';

jest.mock('@prisma/client');

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        role: 'CLIENT'
      };

      const mockUser = {
        id: 'user-id-123',
        ...userData,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock bcrypt
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed-password' as never);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it('should return 400 if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        username: 'existing',
        firstName: 'Test',
        lastName: 'User',
        password: 'password123',
        role: 'CLIENT'
      };

      (mockPrisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-user' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const mockUser = {
        id: 'user-id-123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        password: 'hashed-password',
        role: 'CLIENT',
        avatar: null,
        isVerified: true
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (mockPrisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      
      // Mock bcrypt
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.accessToken).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });
});