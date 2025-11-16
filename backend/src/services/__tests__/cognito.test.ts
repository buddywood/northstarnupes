import {
  CognitoIdentityProviderClient,
  GetUserCommand,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import {
  verifyCognitoToken,
  getCognitoUser,
  authenticateUser,
  extractUserInfoFromToken,
  type CognitoTokenPayload,
} from '../cognito';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cognito-identity-provider');
jest.mock('jsonwebtoken');
jest.mock('jwks-rsa');

describe('Cognito Service', () => {
  const mockSend = jest.fn();
  const mockGetSigningKey = jest.fn();
  const mockClient = {
    getSigningKey: mockGetSigningKey,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock CognitoIdentityProviderClient
    (CognitoIdentityProviderClient as jest.Mock).mockImplementation(() => ({
      send: mockSend,
    }));

    // Mock jwksClient
    (jwksClient as jest.Mock).mockReturnValue(mockClient);
  });

  describe('verifyCognitoToken', () => {
    const mockToken = 'mock-jwt-token';
    const mockPayload: CognitoTokenPayload = {
      sub: 'test-sub-123',
      email: 'test@example.com',
      'cognito:username': 'test@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      token_use: 'access',
    };

    it('should verify a valid token', async () => {
      const mockKey = {
        getPublicKey: jest.fn().mockReturnValue('mock-public-key'),
      };
      mockGetSigningKey.mockImplementation((kid, callback) => {
        callback(null, mockKey);
      });

      (jwt.verify as jest.Mock).mockImplementation((token, getKey, options, callback) => {
        callback(null, mockPayload);
      });

      const result = await verifyCognitoToken(mockToken);

      expect(result).toEqual(mockPayload);
      expect(jwt.verify).toHaveBeenCalledWith(
        mockToken,
        expect.any(Function),
        expect.objectContaining({
          algorithms: ['RS256'],
        }),
        expect.any(Function)
      );
    });

    it('should return null for invalid token', async () => {
      const mockKey = {
        getPublicKey: jest.fn().mockReturnValue('mock-public-key'),
      };
      mockGetSigningKey.mockImplementation((kid, callback) => {
        callback(null, mockKey);
      });

      (jwt.verify as jest.Mock).mockImplementation((token, getKey, options, callback) => {
        callback(new Error('Invalid token'), null);
      });

      const result = await verifyCognitoToken(mockToken);

      expect(result).toBeNull();
    });

    it('should handle JWKS key retrieval errors', async () => {
      mockGetSigningKey.mockImplementation((kid, callback) => {
        callback(new Error('Key not found'), null);
      });

      (jwt.verify as jest.Mock).mockImplementation((token, getKey, options, callback) => {
        callback(new Error('Invalid token'), null);
      });

      const result = await verifyCognitoToken(mockToken);

      expect(result).toBeNull();
    });
  });

  describe('getCognitoUser', () => {
    it('should get user information from Cognito', async () => {
      const mockAccessToken = 'mock-access-token';
      const mockUserResponse = {
        Username: 'test@example.com',
        UserAttributes: [
          { Name: 'email', Value: 'test@example.com' },
          { Name: 'sub', Value: 'test-sub-123' },
        ],
      };

      mockSend.mockResolvedValue(mockUserResponse);

      const result = await getCognitoUser(mockAccessToken);

      expect(result).toEqual(mockUserResponse);
      expect(mockSend).toHaveBeenCalledWith(
        expect.any(GetUserCommand)
      );
      expect(mockSend.mock.calls[0][0].input.AccessToken).toBe(mockAccessToken);
    });

    it('should throw error when Cognito request fails', async () => {
      const mockAccessToken = 'invalid-token';
      const mockError = new Error('Unauthorized');

      mockSend.mockRejectedValue(mockError);

      await expect(getCognitoUser(mockAccessToken)).rejects.toThrow('Unauthorized');
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate user with email and password', async () => {
      const email = 'test@example.com';
      const password = 'TestPassword123!';
      const mockAuthResponse = {
        AuthenticationResult: {
          AccessToken: 'mock-access-token',
          IdToken: 'mock-id-token',
          RefreshToken: 'mock-refresh-token',
        },
      };

      mockSend.mockResolvedValue(mockAuthResponse);

      const result = await authenticateUser(email, password);

      expect(result).toEqual(mockAuthResponse);
      expect(mockSend).toHaveBeenCalledWith(
        expect.any(InitiateAuthCommand)
      );
      const commandInput = mockSend.mock.calls[0][0].input;
      expect(commandInput.AuthParameters.USERNAME).toBe(email);
      expect(commandInput.AuthParameters.PASSWORD).toBe(password);
    });

    it('should throw error when authentication fails', async () => {
      const email = 'test@example.com';
      const password = 'WrongPassword';
      const mockError = new Error('Incorrect username or password');

      mockSend.mockRejectedValue(mockError);

      await expect(authenticateUser(email, password)).rejects.toThrow('Incorrect username or password');
    });
  });

  describe('extractUserInfoFromToken', () => {
    it('should extract user info from token payload with email', () => {
      const payload: CognitoTokenPayload = {
        sub: 'test-sub-123',
        email: 'test@example.com',
        'cognito:username': 'test@example.com',
        'cognito:groups': ['members'],
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        token_use: 'access',
      };

      const result = extractUserInfoFromToken(payload);

      expect(result).toEqual({
        cognitoSub: 'test-sub-123',
        email: 'test@example.com',
        groups: ['members'],
      });
    });

    it('should use cognito:username as fallback when email is missing', () => {
      const payload: CognitoTokenPayload = {
        sub: 'test-sub-123',
        email: '',
        'cognito:username': 'testuser',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        token_use: 'access',
      };

      const result = extractUserInfoFromToken(payload);

      expect(result).toEqual({
        cognitoSub: 'test-sub-123',
        email: 'testuser',
        groups: [],
      });
    });

    it('should handle missing groups', () => {
      const payload: CognitoTokenPayload = {
        sub: 'test-sub-123',
        email: 'test@example.com',
        'cognito:username': 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        token_use: 'access',
      };

      const result = extractUserInfoFromToken(payload);

      expect(result.groups).toEqual([]);
    });
  });
});

