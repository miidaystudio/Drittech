import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app.js';
import env from '../src/config/env.js';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';

describe('Drittech API Endpoints Suite', () => {
  beforeAll(async () => {
    await mongoose.connect(env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('GET /api/health should return healthy system status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('healthy');
  });

  it('POST /api/v1/auth/login with valid doctor credentials should succeed', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'doctor.sarah@drittech.com',
      password: 'doctor123',
    });
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toEqual(true);
    expect(res.body.user.role).toEqual('doctor');
  });

  it('POST /api/v1/auth/login with invalid password should return 401', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'doctor.sarah@drittech.com',
      password: 'wrongpassword',
    });
    expect(res.statusCode).toEqual(401);
    expect(res.body.success).toEqual(false);
  });

  it('GET /api/v1/queue/track/:token should return public guest tracker data without sensitive patient PII', async () => {
    const res = await request(app).get('/api/v1/queue/track/track_james_wilson_demo_token_123');
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toEqual(true);
    expect(res.body.data.tokenNumber).toBeDefined();
    expect(res.body.data.phone).toBeUndefined();
  });
});
