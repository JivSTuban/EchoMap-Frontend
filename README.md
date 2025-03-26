# naviGram Project Requirements

## Overview
naviGram is an anonymous, location-based platform for sharing memories tied to physical spaces. Users leave voice notes, stories, or art at GPS coordinates, creating invisible emotional landmarks.

## Memory Creation Feature Setup

### Cloudinary Setup
1. Create a Cloudinary account at https://cloudinary.com/
2. Create an unsigned upload preset:
   - Go to Settings > Upload
   - Scroll to "Upload presets"
   - Click "Add upload preset"
   - Set "Signing Mode" to "Unsigned"
   - Save the preset name

### Environment Configuration
1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in the Cloudinary configuration:
```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

### Media Upload Guidelines
- **Audio**: MP3, WAV (max 10MB)
- **Images**: JPEG, PNG, GIF (max 10MB)
- **Video**: MP4, MOV, AVI (max 50MB)

### Features
- Drag and drop file upload
- Interactive location picker
- Privacy controls
- Media preview
- Upload progress tracking
- Comprehensive error handling
- Description support
- Responsive layout

### Testing
1. Start the backend server
2. Start the frontend development server:
```bash
npm run dev
```
3. Navigate to the memory creation page
4. Test with different media types:
   - Try uploading various file formats
   - Check file size restrictions
   - Verify privacy settings
   - Test location picker
   - Confirm preview functionality
   - Verify upload progress indicator

### Troubleshooting
1. If uploads fail, check:
   - Cloudinary configuration
   - File size limits
   - File format compatibility
   - Network connectivity
   - Backend API availability

2. If location picker doesn't work:
   - Enable location services in browser
   - Check browser permissions
   - Verify map tiles are loading

3. Common Issues:
   - **413 Entity Too Large**: File exceeds size limit
   - **415 Unsupported Media Type**: Invalid file format
   - **401 Unauthorized**: Invalid Cloudinary configuration
   - **CORS errors**: Backend CORS configuration issue

### Security Notes
- All uploads use unsigned upload presets
- File size limits are enforced client-side and server-side
- Media types are strictly validated
- Location data is sanitized before submission
- Privacy settings are enforced server-side