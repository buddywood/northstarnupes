'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { fetchChapters } from '@/lib/api';
import type { Chapter } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import SearchableSelect from '../components/SearchableSelect';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import VerificationCodeInput from '../components/VerificationCodeInput';
import { SkeletonLoader } from '../components/Skeleton';
import { fetchIndustries } from '@/lib/api';
import type { Industry } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FormData {
  // Step 1: Cognito Auth
  email: string;
  password: string;
  confirmPassword: string;
  verificationCode: string;
  cognitoSub: string | null; // Cognito user ID after registration
  
  // Step 2: Basic Information
  name: string;
  membership_number: string;
  headshot: File | null;
  headshotPreview: string | null;
  
  // Step 3: Initiation Information
  initiated_chapter_id: string;
  initiated_season: string;
  initiated_year: string;
  ship_name: string;
  line_name: string;
  
  // Step 4: Location & Contact
  location: string;
  address: string;
  address_is_private: boolean;
  phone_number: string;
  phone_is_private: boolean;
  
  // Step 5: Professional Information
  industry: string;
  job_title: string;
  bio: string;
  
  // Step 6: Social Links
  social_links: {
    instagram: string;
    twitter: string;
    linkedin: string;
    website: string;
  };
}

export default function RegisterPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cognitoStep, setCognitoStep] = useState<'signup' | 'verify'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendTimer, setResendTimer] = useState(0); // Timer in seconds
  const [showWelcomeBack, setShowWelcomeBack] = useState(false); // Show welcome back message
  const [detectingLocation, setDetectingLocation] = useState(false); // Location detection state

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: '',
    cognitoSub: null,
    name: '',
    membership_number: '',
    headshot: null,
    headshotPreview: null,
    initiated_chapter_id: '',
    initiated_season: '',
    initiated_year: '',
    ship_name: '',
    line_name: '',
    location: '',
    address: '',
    address_is_private: false,
    phone_number: '',
    phone_is_private: false,
    industry: '',
    job_title: '',
    bio: '',
    social_links: {
      instagram: '',
      twitter: '',
      linkedin: '',
      website: '',
    },
  });

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [resendTimer]);

  // Start timer when verification step is shown (only if timer is not already running)
  useEffect(() => {
    if (cognitoStep === 'verify' && resendTimer === 0 && formData.cognitoSub) {
      setResendTimer(60); // 60 seconds timer
    }
  }, [cognitoStep, formData.cognitoSub]);

  // Check onboarding status and redirect accordingly
  // If user has cognitoSub and incomplete onboarding, skip to step 2
  useEffect(() => {
    if (sessionStatus === 'loading') return; // Wait for session to load
    
    if (session && session.user) {
      const onboardingStatus = (session.user as any)?.onboarding_status;
      const cognitoSub = (session.user as any)?.cognitoSub;
      const userEmail = (session.user as any)?.email;
      
      // If user has completed onboarding, redirect to home
      if (onboardingStatus === 'ONBOARDING_FINISHED') {
        router.push('/');
        return;
      }
      
      // If user has cognitoSub (Cognito is verified), skip step 1 and go to step 2
      if (cognitoSub && onboardingStatus !== 'ONBOARDING_FINISHED') {
        // Set cognitoSub, email, and name (if available from session) in form data
        const userName = (session.user as any)?.name || '';
        setFormData(prev => ({ 
          ...prev, 
          cognitoSub: cognitoSub,
          email: userEmail || prev.email,
          name: prev.name || userName // Prepopulate name if not already set and available from session
        }));
        
        // Skip to step 2 (Basic Information)
        setCurrentStep(2);
        setCognitoStep('verify'); // Mark Cognito as verified
        setShowWelcomeBack(true); // Show welcome back message
        
        // Load draft data from backend if it exists
        fetch(`${API_URL}/api/members/draft/${cognitoSub}`)
          .then(res => res.ok ? res.json() : null)
          .then(backendDraft => {
            if (backendDraft) {
              setFormData(prev => ({
                ...prev,
                cognitoSub: cognitoSub,
                email: backendDraft.email || prev.email || userEmail,
                name: backendDraft.name || prev.name,
                membership_number: backendDraft.membership_number || prev.membership_number,
                initiated_chapter_id: backendDraft.initiated_chapter_id?.toString() || prev.initiated_chapter_id,
                initiated_season: backendDraft.initiated_season || prev.initiated_season,
                initiated_year: backendDraft.initiated_year?.toString() || prev.initiated_year,
                ship_name: backendDraft.ship_name || prev.ship_name,
                line_name: backendDraft.line_name || prev.line_name,
                location: backendDraft.location || prev.location,
                address: backendDraft.address || prev.address,
                address_is_private: backendDraft.address_is_private ?? prev.address_is_private,
                phone_number: backendDraft.phone_number || prev.phone_number,
                phone_is_private: backendDraft.phone_is_private ?? prev.phone_is_private,
                industry: backendDraft.industry || prev.industry,
                job_title: backendDraft.job_title || prev.job_title,
                bio: backendDraft.bio || prev.bio,
                social_links: backendDraft.social_links || prev.social_links,
                headshotPreview: backendDraft.headshot_url || prev.headshotPreview,
              }));
            }
          })
          .catch(console.error);
      }
    }
  }, [session, sessionStatus, router, API_URL]);

  useEffect(() => {
    Promise.all([
      fetchChapters().catch(console.error),
      fetchIndustries().catch(console.error)
    ]).then(([chaptersData, industriesData]) => {
      if (chaptersData) setChapters(chaptersData);
      if (industriesData) setIndustries(industriesData);
    }).finally(() => setLoading(false));

    // Load draft from localStorage on mount (only if not logged in)
    if (!session || !session.user) {
      const savedDraft = localStorage.getItem('memberRegistrationDraft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          setFormData(prev => ({ ...prev, ...draft }));
          if (draft.cognitoSub) {
            setFormData(prev => ({ ...prev, cognitoSub: draft.cognitoSub }));
            setCurrentStep(2); // Skip to step 2 if Cognito is already verified
            
            // Also try to load from backend
            fetch(`${API_URL}/api/members/draft/${draft.cognitoSub}`)
              .then(res => res.ok ? res.json() : null)
              .then(backendDraft => {
                if (backendDraft) {
                  setFormData(prev => ({
                    ...prev,
                    name: backendDraft.name || prev.name,
                    membership_number: backendDraft.membership_number || prev.membership_number,
                    initiated_chapter_id: backendDraft.initiated_chapter_id?.toString() || prev.initiated_chapter_id,
                    initiated_season: backendDraft.initiated_season || prev.initiated_season,
                    initiated_year: backendDraft.initiated_year?.toString() || prev.initiated_year,
                    ship_name: backendDraft.ship_name || prev.ship_name,
                    line_name: backendDraft.line_name || prev.line_name,
                    location: backendDraft.location || prev.location,
                    address: backendDraft.address || prev.address,
                    address_is_private: backendDraft.address_is_private ?? prev.address_is_private,
                    phone_number: backendDraft.phone_number || prev.phone_number,
                    phone_is_private: backendDraft.phone_is_private ?? prev.phone_is_private,
                    industry: backendDraft.industry || prev.industry,
                    job_title: backendDraft.job_title || prev.job_title,
                    bio: backendDraft.bio || prev.bio,
                    social_links: backendDraft.social_links || prev.social_links,
                    headshotPreview: backendDraft.headshot_url || prev.headshotPreview,
                  }));
                }
              })
              .catch(err => console.error('Error loading draft from backend:', err));
          }
        } catch (e) {
          console.error('Error loading draft from localStorage:', e);
        }
      }
    }

    // Don't clear localStorage on unmount if user is logged in and has incomplete onboarding
    // This allows them to return and continue registration
    return () => {
      // Only clear localStorage if user is not logged in or has completed onboarding
      if (!session || !session.user) {
        localStorage.removeItem('memberRegistrationDraft');
      } else {
        const onboardingStatus = (session.user as any)?.onboarding_status;
        if (onboardingStatus === 'ONBOARDING_FINISHED') {
          localStorage.removeItem('memberRegistrationDraft');
        }
      }
    };
  }, [session]);

  const handleCognitoSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSubmitting(true);

    try {
      // Call backend Cognito proxy
      const response = await fetch(`${API_URL}/api/members/cognito/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setErrorCode(errorData.code || null);
        throw new Error(errorData.error || 'Failed to create account');
      }

      const data = await response.json();
      const updatedFormData = { ...formData, cognitoSub: data.userSub };
      setFormData(updatedFormData);
      
      // Save to localStorage (exclude large files and previews)
      try {
        const { headshot, headshotPreview, password, confirmPassword, verificationCode, ...draftData } = updatedFormData;
        localStorage.setItem('memberRegistrationDraft', JSON.stringify({
          ...draftData,
          password: '', // Don't save password
          confirmPassword: '',
          verificationCode: '',
        }));
      } catch (err: any) {
        if (err.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded. Clearing old drafts...');
          // Try to clear and retry
          try {
            localStorage.removeItem('memberRegistrationDraft');
            const { headshot, headshotPreview, password, confirmPassword, verificationCode, ...draftData } = updatedFormData;
            localStorage.setItem('memberRegistrationDraft', JSON.stringify({
              ...draftData,
              password: '',
              confirmPassword: '',
              verificationCode: '',
            }));
          } catch (retryErr) {
            console.error('Failed to save draft after cleanup:', retryErr);
          }
        } else {
          console.error('Error saving draft:', err);
        }
      }
      
      setCognitoStep('verify');
      setError('');
      setErrorCode(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCognitoVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      // Call backend Cognito proxy
      const response = await fetch(`${API_URL}/api/members/cognito/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.verificationCode,
          cognito_sub: formData.cognitoSub,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid verification code');
      }

      // After verification, create initial draft on backend
      try {
        const draftResponse = await fetch(`${API_URL}/api/members/draft`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cognito_sub: formData.cognitoSub,
            email: formData.email,
          }),
        });

        if (draftResponse.ok) {
          const draftData = await draftResponse.json();
          // Load any existing draft data
          if (draftData.name) setFormData(prev => ({ ...prev, name: draftData.name }));
          if (draftData.membership_number) setFormData(prev => ({ ...prev, membership_number: draftData.membership_number }));
        }
      } catch (err) {
        console.error('Error creating draft:', err);
        // Continue anyway - draft creation is not critical
      }

      // Save to localStorage (exclude large files and previews)
      try {
        const { headshot, headshotPreview, password, confirmPassword, verificationCode, ...draftData } = formData;
        localStorage.setItem('memberRegistrationDraft', JSON.stringify({
          ...draftData,
          password: '', // Don't save password
          confirmPassword: '',
          verificationCode: '',
        }));
      } catch (err: any) {
        if (err.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded. Clearing old drafts...');
          try {
            localStorage.removeItem('memberRegistrationDraft');
            const { headshot, headshotPreview, password, confirmPassword, verificationCode, ...draftData } = formData;
            localStorage.setItem('memberRegistrationDraft', JSON.stringify({
              ...draftData,
              password: '',
              confirmPassword: '',
              verificationCode: '',
            }));
          } catch (retryErr) {
            console.error('Failed to save draft after cleanup:', retryErr);
          }
        } else {
          console.error('Error saving draft:', err);
        }
      }

      // Upload headshot if one was selected before verification
      if (formData.headshot && formData.cognitoSub) {
        const headshotUrl = await uploadHeadshot(formData.headshot);
        if (headshotUrl) {
          setFormData(prev => ({ ...prev, headshotPreview: headshotUrl }));
        }
      }

      // After verification, proceed to next step
      setCurrentStep(2);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Image validation constants
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
  const MAX_IMAGE_WIDTH = 2000;
  const MAX_IMAGE_HEIGHT = 2000;
  const MIN_IMAGE_WIDTH = 200;
  const MIN_IMAGE_HEIGHT = 200;
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const validateImage = (file: File): Promise<{ valid: boolean; error?: string; width?: number; height?: number }> => {
    return new Promise((resolve) => {
      // Check file type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        resolve({
          valid: false,
          error: `Invalid file type. Please upload a JPEG, PNG, or WebP image.`,
        });
        return;
      }

      // Check file size
      if (file.size > MAX_IMAGE_SIZE) {
        resolve({
          valid: false,
          error: `Image is too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`,
        });
        return;
      }

      // Check image dimensions
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        
        if (img.width < MIN_IMAGE_WIDTH || img.height < MIN_IMAGE_HEIGHT) {
          resolve({
            valid: false,
            error: `Image is too small. Minimum dimensions are ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT} pixels.`,
            width: img.width,
            height: img.height,
          });
          return;
        }

        if (img.width > MAX_IMAGE_WIDTH || img.height > MAX_IMAGE_HEIGHT) {
          resolve({
            valid: false,
            error: `Image is too large. Maximum dimensions are ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT} pixels.`,
            width: img.width,
            height: img.height,
          });
          return;
        }

        resolve({
          valid: true,
          width: img.width,
          height: img.height,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve({
          valid: false,
          error: 'Invalid image file. Please try a different image.',
        });
      };

      img.src = objectUrl;
    });
  };

  const uploadHeadshot = async (file: File): Promise<string | null> => {
    if (!formData.cognitoSub) {
      setError('Please complete email verification first');
      return null;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('cognito_sub', formData.cognitoSub);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('headshot', file);

      const response = await fetch(`${API_URL}/api/members/draft`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to upload headshot' }));
        // Log technical details
        console.error('Error uploading headshot:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
        });
        // Show user-friendly message
        setError(errorData.error || 'Unable to upload your photo. Please try again or continue without it.');
        return null;
      }

      const draftData = await response.json();
      return draftData.headshot_url || null;
    } catch (err: any) {
      // Log technical details
      console.error('Error uploading headshot:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      // Show user-friendly message
      setError('Unable to upload your photo due to a network error. Please check your connection and try again, or continue without it.');
      return null;
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    
    // Validate image
    const validation = await validateImage(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid image');
      e.target.value = ''; // Clear the input
      return;
    }

    // Set file and preview
    setFormData({ ...formData, headshot: file });
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, headshotPreview: reader.result as string }));
    };
    reader.readAsDataURL(file);

    // Upload to S3 immediately if user is verified
    if (formData.cognitoSub) {
      const headshotUrl = await uploadHeadshot(file);
      if (headshotUrl) {
        setFormData(prev => ({ ...prev, headshotPreview: headshotUrl }));
      }
    }
  };

  // Auto-save draft to backend and localStorage
  const saveDraft = useCallback(async () => {
    if (!formData.cognitoSub) return; // Only save after Cognito verification

    // Save to localStorage immediately (exclude large files and previews)
    try {
      const { headshot, headshotPreview, password, confirmPassword, verificationCode, ...draftData } = formData;
      localStorage.setItem('memberRegistrationDraft', JSON.stringify({
        ...draftData,
        password: '', // Don't save password
        confirmPassword: '',
        verificationCode: '',
      }));
    } catch (err: any) {
      if (err.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded. Clearing old drafts...');
        try {
          localStorage.removeItem('memberRegistrationDraft');
          const { headshot, headshotPreview, password, confirmPassword, verificationCode, ...draftData } = formData;
          localStorage.setItem('memberRegistrationDraft', JSON.stringify({
            ...draftData,
            password: '',
            confirmPassword: '',
            verificationCode: '',
          }));
        } catch (retryErr) {
          console.error('Failed to save draft after cleanup:', retryErr);
          // Silently fail - draft saving is not critical
        }
      } else {
        console.error('Error saving draft:', err);
      }
    }

    // Save to backend (debounced - only save essential fields that are filled)
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('cognito_sub', formData.cognitoSub);
      formDataToSend.append('email', formData.email);
      
      if (formData.name) formDataToSend.append('name', formData.name);
      if (formData.membership_number) formDataToSend.append('membership_number', formData.membership_number);
      if (formData.initiated_chapter_id) formDataToSend.append('initiated_chapter_id', formData.initiated_chapter_id);
      if (formData.initiated_season) formDataToSend.append('initiated_season', formData.initiated_season);
      if (formData.initiated_year) formDataToSend.append('initiated_year', formData.initiated_year);
      if (formData.ship_name) formDataToSend.append('ship_name', formData.ship_name);
      if (formData.line_name) formDataToSend.append('line_name', formData.line_name);
      if (formData.location) formDataToSend.append('location', formData.location);
      if (formData.address) formDataToSend.append('address', formData.address);
      formDataToSend.append('address_is_private', formData.address_is_private.toString());
      if (formData.phone_number) formDataToSend.append('phone_number', formData.phone_number);
      formDataToSend.append('phone_is_private', formData.phone_is_private.toString());
      if (formData.industry) formDataToSend.append('industry', formData.industry);
      if (formData.job_title) formDataToSend.append('job_title', formData.job_title);
      if (formData.bio) formDataToSend.append('bio', formData.bio);
      formDataToSend.append('social_links', JSON.stringify(formData.social_links));
      
      // Only upload headshot if it's a File and not already uploaded (headshotPreview would be a URL if uploaded)
      if (formData.headshot && !formData.headshotPreview?.startsWith('http')) {
        formDataToSend.append('headshot', formData.headshot);
      }

      const response = await fetch(`${API_URL}/api/members/draft`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save draft' }));
        // Log technical details
        console.error('Error auto-saving draft:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          url: `${API_URL}/api/members/draft`,
        });
        // Show user-friendly message (but don't interrupt their flow)
        // Only show if it's a critical error (not a validation error)
        if (response.status >= 500) {
          console.warn('Draft auto-save failed. Your progress is saved locally and will be restored when you continue.');
        }
      }
    } catch (err: any) {
      // Log technical details
      console.error('Error auto-saving draft:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      // Fail silently for network errors - localStorage backup is sufficient
      console.warn('Draft auto-save failed due to network error. Your progress is saved locally.');
    }
  }, [formData, API_URL]);

  // Debounced auto-save effect
  useEffect(() => {
    if (currentStep >= 2 && formData.cognitoSub) {
      const timer = setTimeout(() => {
        saveDraft();
      }, 1000); // Debounce 1 second

      return () => clearTimeout(timer);
    }
  }, [formData, currentStep, saveDraft]);

  const handleNext = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    console.log('handleNext called', { 
      currentStep, 
      formData: { 
        name: formData.name, 
        membership_number: formData.membership_number,
        nameLength: formData.name?.length,
        membershipLength: formData.membership_number?.length
      } 
    });
    
    // Validate required fields for step 2
    if (currentStep === 2) {
      if (!formData.name || formData.name.trim().length === 0) {
        setError('Please enter your full name');
        console.warn('Validation failed: name is required');
        return;
      }
      if (!formData.membership_number || formData.membership_number.trim().length === 0) {
        setError('Please enter your membership number');
        console.warn('Validation failed: membership number is required');
        return;
      }
    }
    
    if (currentStep < 6) {
      setError(''); // Clear any previous errors
      setCurrentStep(currentStep + 1);
      
      // Auto-save draft after Step 1 (Cognito verification)
      if (currentStep >= 2 && formData.cognitoSub) {
        saveDraft();
      }
    } else {
      console.warn('Cannot advance: already at step 6');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    setError('');

    try {
      // Request browser geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Call backend to reverse geocode
      const response = await fetch(`${API_URL}/api/location/reverse-geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get location information');
      }

      const locationData = await response.json();

      // Auto-fill location and address fields
      setFormData(prev => ({
        ...prev,
        location: locationData.location || '',
        address: locationData.address || '',
      }));

      setError('');
    } catch (err: any) {
      console.error('Error detecting location:', err);
      
      let errorMessage = 'Failed to detect your location.';
      if (err.message?.includes('denied') || err.message?.includes('permission')) {
        errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
      } else if (err.message?.includes('timeout')) {
        errorMessage = 'Location detection timed out. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('membership_number', formData.membership_number);
      formDataToSend.append('initiated_chapter_id', formData.initiated_chapter_id);
      formDataToSend.append('cognito_sub', formData.cognitoSub || '');
      
      // Always send these fields, even if empty (backend will handle null conversion)
      formDataToSend.append('initiated_season', formData.initiated_season || '');
      formDataToSend.append('initiated_year', formData.initiated_year || '');
      formDataToSend.append('ship_name', formData.ship_name || '');
      formDataToSend.append('line_name', formData.line_name || '');
      formDataToSend.append('location', formData.location || '');
      formDataToSend.append('address', formData.address || '');
      formDataToSend.append('address_is_private', formData.address_is_private.toString());
      formDataToSend.append('phone_number', formData.phone_number || '');
      formDataToSend.append('phone_is_private', formData.phone_is_private.toString());
      formDataToSend.append('industry', formData.industry || '');
      formDataToSend.append('job_title', formData.job_title || '');
      formDataToSend.append('bio', formData.bio || '');
      formDataToSend.append('social_links', JSON.stringify(formData.social_links));
      
      // Always send headshot if it exists (whether File or already uploaded URL)
      if (formData.headshot) {
        formDataToSend.append('headshot', formData.headshot);
      }

      const response = await fetch(`${API_URL}/api/members/register`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register');
      }

      // Clear localStorage draft on success
      localStorage.removeItem('memberRegistrationDraft');
      
      // After successful registration, the user should be logged in
      // The onboarding status will be ONBOARDING_FINISHED, so they'll be redirected to home
      // But we need to refresh the session to get the updated onboarding status
      const { signIn, getSession } = await import('next-auth/react');
      
      // Try to sign in to update the session
      // Note: This requires the user's password, which we don't have here
      // Instead, we'll redirect to login page or home page
      // The session will be updated on next login
      
      setSuccess(true);
      
      // Redirect to home page - the session will be updated on next login
      // Or we could redirect to login page with a success message
      setTimeout(() => {
        router.push('/');
      }, 2000); // Give user time to see success message
    } catch (err: any) {
      setError(err.message || 'Failed to submit registration');
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md border border-frost-gray">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-display font-bold mb-4 text-green-600">Registration Successful!</h1>
          <p className="text-midnight-navy/70 mb-6">
            Welcome to the brotherhood! Your member profile has been created. You can now shop, connect with brothers, and apply to become a seller or promoter.
          </p>
          <Link
            href="/"
            className="inline-block bg-crimson text-white px-6 py-2 rounded-lg hover:bg-crimson/90 transition shadow-md"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <SkeletonLoader />;
  }

  const steps = [
    { number: 1, title: 'Create Account', description: 'Sign up with AWS Cognito' },
    { number: 2, title: 'Basic Info', description: 'Name and membership details' },
    { number: 3, title: 'Initiation', description: 'Chapter and line information' },
    { number: 4, title: 'Location', description: 'Contact and location details' },
    { number: 5, title: 'Professional', description: 'Career and bio information' },
    { number: 6, title: 'Social Links', description: 'Connect your social profiles' },
  ];

  return (
    <main className="min-h-screen bg-cream">
      {currentStep === 1 ? (
        <div className="min-h-screen flex items-center justify-center py-8">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border border-frost-gray">
            {/* Icon with animation/glow */}
            <div className="mb-6 text-center">
              <div className="inline-block relative">
                <div className="absolute inset-0 bg-crimson/20 rounded-full blur-xl animate-pulse"></div>
                <Image
                  src="/header-icon.png"
                  alt="1Kappa Icon"
                  width={64}
                  height={64}
                  className="relative z-10 object-contain animate-pulse"
                  style={{ animationDuration: '3s' }}
                />
              </div>
            </div>
            
            <h1 className="text-2xl font-display font-bold mb-2 text-center text-midnight-navy">
              Welcome to 1KAPPA
            </h1>
            <p className="text-sm text-midnight-navy/70 text-center mb-6">
              {cognitoStep === 'signup' 
                ? 'Sign in to continue the Bond'
                : 'Please check your email for a verification code and enter it below.'}
            </p>
            
            <form onSubmit={(e) => {
              if (cognitoStep === 'signup') {
                handleCognitoSignUp(e);
              } else {
                handleCognitoVerify(e);
              }
            }} className="space-y-6">
              {/* Step 1: Cognito Registration */}
              {cognitoStep === 'signup' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-midnight-navy">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setError('');
                        setErrorCode(null);
                      }}
                      className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-midnight-navy">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2 pr-10 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                        placeholder="Create a strong password"
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-navy/60 hover:text-midnight-navy transition"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <PasswordStrengthIndicator password={formData.password} />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-midnight-navy">Confirm Password *</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2 pr-10 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-midnight-navy/60 hover:text-midnight-navy transition"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-midnight-navy">Verification Code *</label>
                    <VerificationCodeInput
                      length={6}
                      value={formData.verificationCode}
                      onChange={(code) => setFormData({ ...formData, verificationCode: code })}
                      disabled={submitting}
                    />
                    <p className="text-xs text-midnight-navy/60 mt-2 text-center">
                      Enter the 6-digit code sent to {formData.email}
                    </p>
                    <p className="text-xs text-midnight-navy/50 mt-1 text-center">
                      You can paste the code to fill all fields at once
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        if (resendTimer > 0) return;
                        setSubmitting(true);
                        setError('');
                        setResendTimer(60);
                        setFormData({ ...formData, verificationCode: '' });
                        try {
                          const response = await fetch(`${API_URL}/api/members/cognito/signup`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              email: formData.email,
                              password: formData.password,
                            }),
                          });
                          if (!response.ok) {
                            const errorData = await response.json();
                            setError(errorData.error || 'Failed to resend code');
                            setResendTimer(0);
                          } else {
                            setError('');
                          }
                        } catch (err: any) {
                          setError(err.message || 'Failed to resend code');
                          setResendTimer(0);
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      disabled={resendTimer > 0 || submitting}
                      className={`text-sm transition ${
                        resendTimer > 0
                          ? 'text-midnight-navy/40 cursor-not-allowed'
                          : 'text-crimson hover:underline'
                      }`}
                    >
                      {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
                    </button>
                  </div>
                </>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || loading}
                className="w-full bg-crimson text-white py-3 rounded-lg font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : cognitoStep === 'signup' ? 'Create Account' : 'Verify Email'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <nav className="bg-white shadow-sm border-b border-frost-gray">
            <div className="container mx-auto px-4 py-4">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Image
                  src="/header-icon.png"
                  alt="1Kappa Icon"
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <span className="font-display font-bold text-crimson text-xl">1KAPPA</span>
              </Link>
            </div>
          </nav>

          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8">
              <h1 className="text-3xl font-display font-bold text-midnight-navy mb-2">Become a Member</h1>
              <p className="text-midnight-navy/70">
                Join the 1Kappa brotherhood network. Create your profile to connect with brothers, shop authentic merchandise, and participate in events.
              </p>
            </div>

        {/* Welcome Back Message */}
        {showWelcomeBack && (
          <div className="bg-gradient-to-r from-crimson/10 to-midnight-navy/10 border-l-4 border-crimson p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-display font-semibold text-midnight-navy mb-2">
                  Welcome Back!
                </h3>
                <p className="text-midnight-navy/80 mb-3">
                  We noticed your registration isn&apos;t complete yet. Please finish setting up your profile to enjoy full access to the 1Kappa brotherhood network, including shopping authentic merchandise, connecting with brothers, and participating in events.
                </p>
                <p className="text-sm text-midnight-navy/70">
                  Your progress has been saved. You can pick up right where you left off!
                </p>
              </div>
              <button
                onClick={() => setShowWelcomeBack(false)}
                className="flex-shrink-0 text-midnight-navy/60 hover:text-midnight-navy transition"
                aria-label="Dismiss message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-frost-gray mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                      currentStep === step.number
                        ? 'bg-crimson text-white'
                        : currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-frost-gray text-midnight-navy/60'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${currentStep >= step.number ? 'text-midnight-navy' : 'text-midnight-navy/40'}`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 rounded ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-frost-gray'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={(e) => {
          if (currentStep === 6) {
            handleFinalSubmit(e);
          } else {
            handleNext(e);
          }
        }} className="bg-white p-8 rounded-lg shadow-lg border border-frost-gray">
          {/* Step 2: Basic Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-semibold text-midnight-navy mb-2">Basic Information</h2>
                <p className="text-midnight-navy/70 mb-6">Tell us about yourself</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onInvalid={(e) => {
                    e.preventDefault();
                    setError('Please enter your full name');
                  }}
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">Membership Number *</label>
                <input
                  type="text"
                  required
                  value={formData.membership_number}
                  onChange={(e) => setFormData({ ...formData, membership_number: e.target.value.trim() })}
                  onInvalid={(e) => {
                    e.preventDefault();
                    setError('Please enter your membership number');
                  }}
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  placeholder="Your Kappa Alpha Psi membership number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">Headshot Photo</label>
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs font-semibold text-blue-900 mb-1">Image Guidelines:</p>
                  <ul className="text-xs text-blue-800 space-y-0.5 list-disc list-inside">
                    <li>File size: Maximum 2MB</li>
                    <li>Dimensions: 200x200 to 2000x2000 pixels</li>
                    <li>Formats: JPEG, PNG, or WebP</li>
                    <li>Recommended: Square image, 500x500 to 1000x1000 pixels</li>
                  </ul>
                </div>
                <div className="flex items-center gap-4">
                  {formData.headshotPreview && (
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-frost-gray">
                      <img src={formData.headshotPreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="text-sm text-midnight-navy/70"
                  />
                </div>
                <p className="text-xs text-midnight-navy/60 mt-1">Optional - Upload a professional headshot</p>
              </div>
            </div>
          )}

          {/* Step 3: Initiation Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-semibold text-midnight-navy mb-2">Initiation Information</h2>
                <p className="text-midnight-navy/70 mb-6">Your chapter and line details</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">Initiated Chapter *</label>
                <SearchableSelect
                  required
                  value={formData.initiated_chapter_id}
                  onChange={(value) => setFormData({ ...formData, initiated_chapter_id: value })}
                  placeholder="Search for your initiated chapter..."
                  options={chapters.map((chapter) => {
                    const locationParts = [];
                    if (chapter.city) locationParts.push(chapter.city);
                    if (chapter.state) locationParts.push(chapter.state);
                    const location = locationParts.length > 0 ? locationParts.join(', ') : '';
                    const displayName = location 
                      ? `${chapter.name} - ${location}${chapter.province ? ` (${chapter.province})` : ''}`
                      : chapter.name;
                    return {
                      id: chapter.id,
                      value: chapter.id,
                      label: displayName,
                    };
                  })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-midnight-navy">Initiation Season</label>
                  <select
                    value={formData.initiated_season}
                    onChange={(e) => setFormData({ ...formData, initiated_season: e.target.value })}
                    className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  >
                    <option value="">Select season</option>
                    <option value="Fall">Fall</option>
                    <option value="Spring">Spring</option>
                    <option value="Summer">Summer</option>
                    <option value="Winter">Winter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-midnight-navy">Initiation Year</label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={formData.initiated_year}
                    onChange={(e) => setFormData({ ...formData, initiated_year: e.target.value })}
                    className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                    placeholder="YYYY"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-midnight-navy">Ship Name</label>
                  <input
                    type="text"
                    value={formData.ship_name}
                    onChange={(e) => setFormData({ ...formData, ship_name: e.target.value })}
                    className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                    placeholder="Your ship name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-midnight-navy">Line Name</label>
                  <input
                    type="text"
                    value={formData.line_name}
                    onChange={(e) => setFormData({ ...formData, line_name: e.target.value })}
                    className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                    placeholder="Your line name"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Location & Contact */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-semibold text-midnight-navy mb-2">Location & Contact</h2>
                <p className="text-midnight-navy/70 mb-6">Where can brothers reach you?</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">Location</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="flex-1 px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                    placeholder="City, State or general location"
                  />
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="px-4 py-2 bg-midnight-navy text-white rounded-lg hover:bg-midnight-navy/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                    title="Detect your current location"
                  >
                    {detectingLocation ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="hidden sm:inline">Detecting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="hidden sm:inline">Detect</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-midnight-navy/60 mt-1">
                  Click &quot;Detect&quot; to automatically fill your location using your device&apos;s GPS
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy resize-none"
                  placeholder="Street address (optional)"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="address_private"
                    checked={formData.address_is_private}
                    onChange={(e) => setFormData({ ...formData, address_is_private: e.target.checked })}
                    className="rounded border-frost-gray text-crimson focus:ring-crimson"
                  />
                  <label htmlFor="address_private" className="text-sm text-midnight-navy/70">
                    Keep address private
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  placeholder="(555) 123-4567"
                />
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="phone_private"
                    checked={formData.phone_is_private}
                    onChange={(e) => setFormData({ ...formData, phone_is_private: e.target.checked })}
                    className="rounded border-frost-gray text-crimson focus:ring-crimson"
                  />
                  <label htmlFor="phone_private" className="text-sm text-midnight-navy/70">
                    Keep phone number private
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Professional Information */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-semibold text-midnight-navy mb-2">Professional Information</h2>
                <p className="text-midnight-navy/70 mb-6">Share your career and professional background</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">Industry</label>
                <SearchableSelect
                  options={industries.map(industry => ({
                    id: industry.id,
                    label: industry.name,
                    value: industry.name,
                  }))}
                  value={formData.industry}
                  onChange={(value) => setFormData({ ...formData, industry: value })}
                  placeholder="Select your industry"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">Job Title</label>
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  placeholder="Your current job title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy resize-none"
                  placeholder="Tell us about yourself, your interests, and your connection to the brotherhood..."
                />
              </div>
            </div>
          )}

          {/* Step 6: Social Links */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-semibold text-midnight-navy mb-2">Social Links</h2>
                <p className="text-midnight-navy/70 mb-6">Connect your social profiles (all optional)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">Instagram</label>
                <input
                  type="text"
                  value={formData.social_links.instagram}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, instagram: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  placeholder="@username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">Twitter</label>
                <input
                  type="text"
                  value={formData.social_links.twitter}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, twitter: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  placeholder="@username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">LinkedIn</label>
                <input
                  type="text"
                  value={formData.social_links.linkedin}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, linkedin: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  placeholder="linkedin.com/in/username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-midnight-navy">Website</label>
                <input
                  type="url"
                  value={formData.social_links.website}
                  onChange={(e) => setFormData({
                    ...formData,
                    social_links: { ...formData.social_links, website: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-frost-gray rounded-lg focus:ring-2 focus:ring-crimson focus:border-transparent text-midnight-navy"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-6">
              <p className="mb-3">{error}</p>
              {errorCode === 'USER_ALREADY_EXISTS' && (
                <Link
                  href="/login"
                  className="inline-block bg-crimson text-white px-6 py-2 rounded-lg font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg text-sm"
                >
                  Go to Login
                </Link>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col gap-4 pt-6 mt-6 border-t border-frost-gray">
            <div className="flex gap-4">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 px-4 py-2 border border-frost-gray rounded-lg font-semibold text-midnight-navy hover:bg-cream transition"
                >
                  Back
                </button>
              )}
              {currentStep < 6 ? (
                <button
                  type="submit"
                  className="flex-1 bg-crimson text-white px-4 py-2 rounded-lg font-semibold hover:bg-crimson/90 transition shadow-md hover:shadow-lg"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-crimson text-white px-4 py-2 rounded-lg font-semibold hover:bg-crimson/90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {submitting ? 'Submitting...' : 'Complete Registration'}
                </button>
              )}
            </div>
            {currentStep === 1 && cognitoStep === 'verify' && (
              <Link href="/" className="w-full">
                <button
                  type="button"
                  onClick={() => {
                    // Clear localStorage when user explicitly leaves
                    localStorage.removeItem('memberRegistrationDraft');
                  }}
                  className="w-full bg-gray-200 text-midnight-navy px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Return to Home Page
                </button>
              </Link>
            )}
          </div>
        </form>
      </div>
        </>
      )}
    </main>
  );
}
