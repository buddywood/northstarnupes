// Set environment variables BEFORE importing the service
process.env.FROM_EMAIL = 'no-reply@holdsync.com';
process.env.FRONTEND_URL = 'http://localhost:3000';

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Mock AWS SDK before importing the service
const mockSend = jest.fn();
const mockSendEmailCommand = jest.fn().mockImplementation((input) => input);
jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: mockSend,
  })),
  SendEmailCommand: jest.fn().mockImplementation((input) => {
    mockSendEmailCommand(input);
    return input;
  }),
}));

// Import after mocking
import {
  sendWelcomeEmail,
  sendSellerApplicationSubmittedEmail,
  sendSellerApprovedEmail,
} from '../email';

describe('Email Service', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env;
    
    // Set required environment variables
    process.env.FROM_EMAIL = 'no-reply@holdsync.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const email = 'newuser@example.com';
      const name = 'John Doe';

      mockSend.mockResolvedValue({ MessageId: 'test-message-id' });

      await sendWelcomeEmail(email, name);

      expect(mockSend).toHaveBeenCalled();
      const command = mockSendEmailCommand.mock.calls[0][0];
      expect(command.Source).toBe('no-reply@holdsync.com');
      expect(command.Destination.ToAddresses).toEqual([email]);
      expect(command.Message.Subject.Data).toBe('Welcome to 1Kappa!');
      expect(command.Message.Body.Html.Data).toContain(name);
      expect(command.Message.Body.Html.Data).toContain('Welcome to 1Kappa');
      expect(command.Message.Body.Text.Data).toContain(name);
    });

    it('should throw error when email sending fails', async () => {
      const email = 'newuser@example.com';
      const name = 'John Doe';
      const mockError = new Error('SES error');

      mockSend.mockRejectedValue(mockError);

      await expect(sendWelcomeEmail(email, name)).rejects.toThrow('SES error');
    });

    it('should include logo URL in email HTML', async () => {
      const email = 'newuser@example.com';
      const name = 'John Doe';

      mockSend.mockResolvedValue({ MessageId: 'test-message-id' });

      await sendWelcomeEmail(email, name);

      const command = mockSendEmailCommand.mock.calls[0][0];
      expect(command.Message.Body.Html.Data).toContain('http://localhost:3000/horizon-logo.png');
    });
  });

  describe('sendSellerApplicationSubmittedEmail', () => {
    it('should send seller application submitted email successfully', async () => {
      const email = 'seller@example.com';
      const name = 'Jane Seller';

      mockSend.mockResolvedValue({ MessageId: 'test-message-id' });

      await sendSellerApplicationSubmittedEmail(email, name);

      expect(mockSend).toHaveBeenCalled();
      const command = mockSendEmailCommand.mock.calls[0][0];
      expect(command.Source).toBe('no-reply@holdsync.com');
      expect(command.Destination.ToAddresses).toEqual([email]);
      expect(command.Message.Subject.Data).toBe('Seller Application Received - 1Kappa');
      expect(command.Message.Body.Html.Data).toContain(name);
      expect(command.Message.Body.Html.Data).toContain('Application Received');
      expect(command.Message.Body.Text.Data).toContain(name);
    });

    it('should not throw error when email sending fails', async () => {
      const email = 'seller@example.com';
      const name = 'Jane Seller';
      const mockError = new Error('SES error');

      mockSend.mockRejectedValue(mockError);

      // Should not throw - email failure shouldn't break application submission
      await expect(sendSellerApplicationSubmittedEmail(email, name)).resolves.not.toThrow();
    });
  });

  describe('sendSellerApprovedEmail', () => {
    it('should send seller approved email with invitation token', async () => {
      const email = 'seller@example.com';
      const name = 'Jane Seller';
      const invitationToken = 'invitation-token-123';

      mockSend.mockResolvedValue({ MessageId: 'test-message-id' });

      await sendSellerApprovedEmail(email, name, invitationToken);

      expect(mockSend).toHaveBeenCalled();
      const command = mockSendEmailCommand.mock.calls[0][0];
      expect(command.Source).toBe('no-reply@holdsync.com');
      expect(command.Destination.ToAddresses).toEqual([email]);
      expect(command.Message.Subject.Data).toBe('Congratulations! Your Seller Application Has Been Approved - 1Kappa');
      expect(command.Message.Body.Html.Data).toContain(name);
      expect(command.Message.Body.Html.Data).toContain('Application Approved');
      expect(command.Message.Body.Html.Data).toContain('invitation-token-123');
      expect(command.Message.Body.Html.Data).toContain('seller-setup?token=');
    });

    it('should send seller approved email without invitation token', async () => {
      const email = 'seller@example.com';
      const name = 'Jane Seller';

      mockSend.mockResolvedValue({ MessageId: 'test-message-id' });

      await sendSellerApprovedEmail(email, name);

      const command = mockSendEmailCommand.mock.calls[0][0];
      expect(command.Message.Body.Html.Data).not.toContain('seller-setup?token=');
      // Check for login link - it could be '/login' or full URL with '/login'
      expect(command.Message.Body.Html.Data).toMatch(/\/login/);
    });

    it('should not throw error when email sending fails', async () => {
      const email = 'seller@example.com';
      const name = 'Jane Seller';
      const mockError = new Error('SES error');

      mockSend.mockRejectedValue(mockError);

      // Should not throw - email failure shouldn't break approval process
      await expect(sendSellerApprovedEmail(email, name)).resolves.not.toThrow();
    });
  });
});

