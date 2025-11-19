// Set environment variables BEFORE importing the service
process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
process.env.AWS_REGION = 'us-east-1';

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Mock AWS SDK before importing the service
const mockSend = jest.fn();
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
  GetObjectCommand: jest.fn().mockImplementation((input) => ({ input })),
}));

const mockGetSignedUrl = jest.fn();
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: mockGetSignedUrl,
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

// Import after mocking
import {
  uploadToS3,
  getPresignedUrl,
  getPresignedUploadUrl,
} from '../s3';

describe('S3 Service', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env;
    
    // Set required environment variables
    process.env.AWS_S3_BUCKET_NAME = 'test-bucket';
    process.env.AWS_REGION = 'us-east-1';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('uploadToS3', () => {
    it('should upload file to S3 successfully', async () => {
      const file = Buffer.from('test file content');
      const filename = 'test.jpg';
      const contentType = 'image/jpeg';

      mockSend.mockResolvedValue({});

      const result = await uploadToS3(file, filename, contentType);

      expect(mockSend).toHaveBeenCalled();
      const commandInput = (PutObjectCommand as unknown as jest.Mock).mock.calls[0][0];
      expect(commandInput.Bucket).toBe('test-bucket');
      expect(commandInput.Key).toContain('products/test-uuid-123-test.jpg');
      expect(commandInput.Body).toBe(file);
      expect(commandInput.ContentType).toBe(contentType);
      expect(result.key).toContain('products/test-uuid-123-test.jpg');
      expect(result.url).toContain('test-bucket.s3.us-east-1.amazonaws.com');
    });

    it('should upload to correct folder', async () => {
      const file = Buffer.from('test file content');
      const filename = 'headshot.jpg';
      const contentType = 'image/jpeg';

      mockSend.mockResolvedValue({});

      const result = await uploadToS3(file, filename, contentType, 'headshots');

      const commandInput = (PutObjectCommand as unknown as jest.Mock).mock.calls[0][0];
      expect(commandInput.Key).toContain('headshots/');
      expect(result.key).toContain('headshots/');
    });

    it('should handle different folder types', async () => {
      const file = Buffer.from('test file content');
      const filename = 'logo.png';
      const contentType = 'image/png';

      mockSend.mockResolvedValue({});

      const folders = ['headshots', 'products', 'store-logos', 'steward-listings'] as const;
      
      for (const folder of folders) {
        jest.clearAllMocks();
        await uploadToS3(file, filename, contentType, folder);
        const commandInput = (PutObjectCommand as unknown as jest.Mock).mock.calls[0][0];
        expect(commandInput.Key).toContain(`${folder}/`);
      }
    });

    it('should throw error when upload fails', async () => {
      const file = Buffer.from('test file content');
      const filename = 'test.jpg';
      const contentType = 'image/jpeg';
      const mockError = new Error('S3 upload failed');

      mockSend.mockRejectedValue(mockError);

      await expect(uploadToS3(file, filename, contentType)).rejects.toThrow('S3 upload failed');
    });
  });

  describe('getPresignedUrl', () => {
    it('should generate presigned URL for reading', async () => {
      const key = 'products/test-file.jpg';
      const expiresIn = 3600;
      const mockPresignedUrl = 'https://test-bucket.s3.amazonaws.com/products/test-file.jpg?signature=abc123';

      mockGetSignedUrl.mockResolvedValue(mockPresignedUrl);

      const result = await getPresignedUrl(key, expiresIn);

      expect(result).toBe(mockPresignedUrl);
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(), // S3Client instance
        expect.anything(), // GetObjectCommand instance
        { expiresIn }
      );
      const commandInput = (GetObjectCommand as unknown as jest.Mock).mock.calls[0][0];
      expect(commandInput.Bucket).toBe('test-bucket');
      expect(commandInput.Key).toBe(key);
    });

    it('should use default expiration time', async () => {
      const key = 'products/test-file.jpg';
      const mockPresignedUrl = 'https://test-bucket.s3.amazonaws.com/products/test-file.jpg?signature=abc123';

      mockGetSignedUrl.mockResolvedValue(mockPresignedUrl);

      await getPresignedUrl(key);

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(), // S3Client instance
        expect.anything(), // GetObjectCommand instance
        { expiresIn: 3600 }
      );
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should generate presigned URL for uploading', async () => {
      const key = 'products/test-file.jpg';
      const contentType = 'image/jpeg';
      const expiresIn = 3600;
      const mockPresignedUrl = 'https://test-bucket.s3.amazonaws.com/products/test-file.jpg?signature=abc123';

      mockGetSignedUrl.mockResolvedValue(mockPresignedUrl);

      const result = await getPresignedUploadUrl(key, contentType, expiresIn);

      expect(result).toBe(mockPresignedUrl);
      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(), // S3Client instance
        expect.anything(), // PutObjectCommand instance
        { expiresIn }
      );
      const commandInput = (PutObjectCommand as unknown as jest.Mock).mock.calls[0][0];
      expect(commandInput.Bucket).toBe('test-bucket');
      expect(commandInput.Key).toBe(key);
      expect(commandInput.ContentType).toBe(contentType);
    });

    it('should use default expiration time', async () => {
      const key = 'products/test-file.jpg';
      const contentType = 'image/jpeg';
      const mockPresignedUrl = 'https://test-bucket.s3.amazonaws.com/products/test-file.jpg?signature=abc123';

      mockGetSignedUrl.mockResolvedValue(mockPresignedUrl);

      await getPresignedUploadUrl(key, contentType);

      expect(mockGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(), // S3Client instance
        expect.anything(), // PutObjectCommand instance
        { expiresIn: 3600 }
      );
    });
  });
});

