import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FloatingLabelField } from '../components/FloatingLabelField';
import { PrimaryButton } from '../components/Button';
import { ScreenHeader } from '../components/ScreenHeader';
import { validateEmail, validatePhone } from '../utils/validation';
import { Camera, User, Mail, Phone, Lock, ArrowLeft, Fingerprint, Shield, Loader} from 'lucide-react';
import { MapPicker } from '../components/MapPicker';
import api from '../utils/api';
import ImageCropModal from '../components/ImageCropModal';
import { DiscardChangesDialog, SuccessDialog, ErrorDialog } from '../components/DialogBox';

interface ProfileData {
  userId: string
  staffId: number
  fullName: string
  designation: string
  mobile: string
  email: string
  dateOfBirth: string | null
  dateOfJoining: string
  userRole: string
  profilePictureUrl: string | null
  institute: {
    instituteId: number
    instituteName: string
    instituteType: string
    latitude: number | null
    longitude: number | null
    districtName: string
    tehsilName: string
    villageName: string
  }
}

export default function ProfileScreen() {
  const navigate = useNavigate();

  // Profile data from backend
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    inchargeName: '',
    email: '',
    mobile: '',
    latitude: '',
    longitude: ''
  });

  // Original data for change detection
  const [originalData, setOriginalData] = useState({
    inchargeName: '',
    email: '',
    mobile: '',
    latitude: '',
    longitude: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);

  // Dialog states
  const [successDialog, setSuccessDialog] = useState({ isOpen: false, message: '' });
  const [errorDialog, setErrorDialog] = useState({ isOpen: false, message: '' });

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  // Detect unsaved changes
  useEffect(() => {
    const hasChanges =
      formData.inchargeName !== originalData.inchargeName ||
      formData.email !== originalData.email ||
      formData.mobile !== originalData.mobile ||
      formData.latitude !== originalData.latitude ||
      formData.longitude !== originalData.longitude;

    setHasUnsavedChanges(hasChanges);
  }, [formData, originalData]);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await api.getProfile() as ProfileData;
      setProfileData(data);

      // Initialize form with backend data
      const initialData = {
        inchargeName: data.fullName,
        email: data.email,
        mobile: data.mobile,
        latitude: data.institute.latitude?.toString() || '',
        longitude: data.institute.longitude?.toString() || ''
      };

      setFormData(initialData);
      setOriginalData(initialData);
      setProfilePicture(data.profilePictureUrl);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setErrorDialog({ isOpen: true, message: 'Failed to load profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };


  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorDialog({ isOpen: true, message: 'Please select an image file' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorDialog({ isOpen: true, message: 'Image size must be less than 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setTempImageUrl(e.target?.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImage: string) => {
    try {
      await api.uploadProfilePicture(croppedImage);
      setProfilePicture(croppedImage);
      if (profileData) {
        setProfileData({ ...profileData, profilePictureUrl: croppedImage });
      }
      setSuccessDialog({ isOpen: true, message: 'Profile picture updated successfully' });
    } catch (err) {
      console.error('Failed to upload profile picture:', err);
      setErrorDialog({ isOpen: true, message: 'Failed to update profile picture' });
    }
  };

  const handleSave = async () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.inchargeName.trim()) {
      newErrors.inchargeName = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.mobile) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!validatePhone(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        setIsSaving(true);

        // Update profile
        const updates: {
          fullName?: string
          mobile?: string
          email?: string
        } = {};

        if (formData.inchargeName !== originalData.inchargeName) updates.fullName = formData.inchargeName;
        if (formData.mobile !== originalData.mobile) updates.mobile = formData.mobile;
        if (formData.email !== originalData.email) updates.email = formData.email;

        if (Object.keys(updates).length > 0) {
          await api.updateProfile(updates);
        }

        // Update location if changed
        const lat = parseFloat(formData.latitude);
        const lng = parseFloat(formData.longitude);
        if (
          !isNaN(lat) &&
          !isNaN(lng) &&
          (formData.latitude !== originalData.latitude ||
            formData.longitude !== originalData.longitude)
        ) {
          await api.updateLocation({ latitude: lat, longitude: lng });
        }

        // Refresh profile
        await fetchProfile();
        setHasUnsavedChanges(false);
        setSuccessDialog({ isOpen: true, message: 'Profile updated successfully' });
      } catch (err) {
        console.error('Failed to save profile:', err);
        setErrorDialog({
          isOpen: true,
          message: err instanceof Error ? err.message : 'Failed to save profile'
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setShowDiscardDialog(true);
    } else {
      navigate(-1);
    }
  };

  const handleDiscard = () => {
    setShowDiscardDialog(false);
    navigate(-1);
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  const handleManagePasskeys = () => {
    navigate('/manage-passkeys');
  };

  const handleActiveSessions = () => {
    navigate('/active-sessions');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-['Poppins']">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ProfileScreen w-full h-screen max-w-md mx-auto bg-white flex flex-col overflow-hidden">

      {/* Header */}
      <ScreenHeader title="Edit Profile" onBack={handleBack} />

      {/* Scrollable Content - Takes remaining space, scrolls internally */}
      <div
        className="flex-1 overflow-y-auto bg-gray-50"
        style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >

        {/* Profile Picture Section */}
        <div className="flex flex-col items-center py-8 bg-white">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center shadow-lg border-4 border-white overflow-hidden">
              {profilePicture ? (
                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={64} className="text-yellow-600" />
              )}
            </div>
            <label
              htmlFor="profile-picture-input"
              className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg hover:from-yellow-500 hover:to-yellow-600 transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <Camera size={20} className="text-white" />
              <input
                id="profile-picture-input"
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Form Section - Added extra bottom padding for button clearance */}
        <div className="px-6 py-6 space-y-6 pb-32">

          {/* Personal Information Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-semibold text-gray-900 font-['Poppins'] mb-4">Personal Information</h2>

            {/* Incharge Name */}
            <FloatingLabelField
              field="inchargeName"
              label="Full Name"
              type="text"
              required
              value={formData.inchargeName}
              error={errors.inchargeName}
              onChange={handleInputChange}
              icon={<User size={20} />}
            />

            {/* Email Address */}
            <FloatingLabelField
              field="email"
              label="Email Address"
              type="email"
              required
              value={formData.email}
              error={errors.email}
              onChange={handleInputChange}
              icon={<Mail size={20} />}
            />

            {/* Mobile */}
            <FloatingLabelField
              field="mobile"
              label="Mobile Number"
              type="tel"
              required
              value={formData.mobile}
              error={errors.mobile}
              onChange={handleInputChange}
              icon={<Phone size={20} />}
            />
          </div>

          {/* Institute Details Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 font-['Poppins'] mb-4">Institute Details</h2>
            {/* Location Selection - Accordion Style */}
            <MapPicker
              latitude={formData.latitude}
              longitude={formData.longitude}
              title="Update Location"
              onLocationSelect={(lat, lng) => {
                handleInputChange('latitude', lat.toString())
                handleInputChange('longitude', lng.toString())
              }}
            />
            {/* <button
              onClick={handleChangePassword}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Lock size={20} className="text-yellow-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900 font-['Poppins']">Change Password</p>
                  <p className="text-xs text-gray-500 font-['Poppins']">Update your password</p>
                </div>
              </div>
              <ArrowLeft size={20} className="text-gray-400 rotate-180" />
            </button> */}
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 font-['Poppins'] mb-4">Security</h2>

            <div className="space-y-3">
              <button
                onClick={handleChangePassword}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Lock size={20} className="text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 font-['Poppins']">Change Password</p>
                    <p className="text-xs text-gray-500 font-['Poppins']">Update your password</p>
                  </div>
                </div>
                <ArrowLeft size={20} className="text-gray-400 rotate-180" />
              </button>

              <button
                onClick={handleManagePasskeys}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Fingerprint size={20} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 font-['Poppins']">Manage Passkeys</p>
                    <p className="text-xs text-gray-500 font-['Poppins']">Setup biometric authentication</p>
                  </div>
                </div>
                <ArrowLeft size={20} className="text-gray-400 rotate-180" />
              </button>

              <button
                onClick={handleActiveSessions}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield size={20} className="text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 font-['Poppins']">Active Sessions</p>
                    <p className="text-xs text-gray-500 font-['Poppins']">Manage logged-in devices</p>
                  </div>
                </div>
                <ArrowLeft size={20} className="text-gray-400 rotate-180" />
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800 font-['Poppins'] leading-relaxed">
              Your profile information is used across the AH Punjab system. Make sure to keep it up to date for better communication.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button - Fixed at bottom of ProfileScreen */}
      <div
        className="flex-shrink-0 bg-white border-t border-gray-100 w-full px-6 pt-6"
        style={{
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))'
        }}
      >
        <PrimaryButton onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <div className="flex items-center justify-center gap-2">
              <Loader size={20} className="animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            'Save Changes'
          )}
        </PrimaryButton>
      </div>

      {/* Image Crop Modal */}
      {tempImageUrl && (
        <ImageCropModal
          isOpen={showCropModal}
          imageUrl={tempImageUrl}
          onClose={() => {
            setShowCropModal(false);
            setTempImageUrl(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Discard Changes Dialog */}
      <DiscardChangesDialog
        isOpen={showDiscardDialog}
        onDiscard={handleDiscard}
        onCancel={() => setShowDiscardDialog(false)}
      />

      {/* Success Dialog */}
      <SuccessDialog
        isOpen={successDialog.isOpen}
        message={successDialog.message}
        onClose={() => setSuccessDialog({ isOpen: false, message: '' })}
      />

      {/* Error Dialog */}
      <ErrorDialog
        isOpen={errorDialog.isOpen}
        message={errorDialog.message}
        onClose={() => setErrorDialog({ isOpen: false, message: '' })}
      />
    </div>
  );
}