# Database Schema Reference

Mongoose collections schema reference for Drittech.

### 1. User
- `name` (String, required)
- `email` (String, unique, indexed)
- `password` (String, hashed bcrypt, select: false)
- `role` (Enum: `super_admin`, `clinic_admin`, `receptionist`, `doctor`, `lab_technician`, `patient`)
- `clinicId` (ObjectId ref Clinic)
- `departmentId` (ObjectId ref Department)
- `phone` (String)
- `isActive` (Boolean)
- `preferences` (Object: notifyEmail, notifySms, notifyWhatsApp)

### 2. Clinic
- `name` (String)
- `code` (String, unique uppercase)
- `address` (Object: street, city, state, zipCode, country)
- `phone`, `email`, `website`
- `settings` (Object: operatingHours, averageConsultationTimeMinutes, turnApproachingMinutes)

### 3. Department
- `clinicId` (ObjectId ref Clinic)
- `name` (String)
- `code` (String, unique within clinic)
- `description` (String)
- `avgWaitTimeMinutes` (Number)

### 4. Doctor
- `userId` (ObjectId ref User)
- `clinicId` (ObjectId ref Clinic)
- `departmentId` (ObjectId ref Department)
- `specialty` (String)
- `qualifications` (String)
- `roomNumber` (String)
- `avgConsultationMinutes` (Number)
- `isAvailable` (Boolean)
- `currentPatientId`, `currentQueueEntryId`

### 5. Patient
- `clinicId` (ObjectId ref Clinic)
- `patientIdentifier` (String, unique within clinic, e.g. `PAT-2026-0001`)
- `fullName` (String)
- `phone` (String, indexed)
- `email` (String)
- `age`, `gender`, `bloodGroup`
- `allergies` ([String])
- `chronicConditions` ([String])

### 6. QueueEntry
- `clinicId` (ObjectId ref Clinic)
- `departmentId` (ObjectId ref Department)
- `doctorId` (ObjectId ref Doctor)
- `patientId` (ObjectId ref Patient)
- `tokenNumber` (String, e.g. `GEN-002`)
- `sequenceNumber` (Number)
- `queueDate` (String: YYYY-MM-DD)
- `trackingToken` (String, high-entropy unique)
- `status` (Enum: `waiting`, `called`, `in_consultation`, `completed`, `skipped`, `cancelled`)
- `priority` (Enum: `normal`, `urgent`, `senior_child`, `emergency`)
- `checkInTime`, `calledTime`, `consultationStartTime`, `completedTime`
- `estimatedWaitMinutes`, `patientsAhead`

### 7. Consultation
- `clinicId`, `patientId`, `doctorId`, `queueEntryId`
- `chiefComplaint`, `symptoms`, `vitals`
- `clinicalExamination`, `assessment`, `diagnosis` (ICD-10)
- `prescriptions` ([Object])
- `recommendedLabTests` ([Object])
- `status` (Enum: `draft`, `completed`, `cancelled`)
- `durationMinutes`

### 8. LabOrder
- `orderNumber` (String, e.g. `ORD-2026-0001`)
- `clinicId`, `patientId`, `doctorId`, `consultationId`
- `testType`, `category`, `urgency`
- `status` (Enum: `ordered`, `sample_collected`, `processing`, `awaiting_review`, `published`)

### 9. LabReport
- `reportNumber` (String, e.g. `REP-2026-0001`)
- `clinicId`, `patientId`, `doctorId`, `labOrderId`
- `filePath`, `originalFileName`, `mimeType`, `fileSizeBytes`
- `results` ([Parameter, Value, Unit, RefRange, Flag])
- `aiSummary` (Object: status, bullets, disclaimer, generatedAt, provider)
- `status` (Enum: `draft`, `published`, `archived`)

### 10. AuditLog
- `clinicId`, `userId`, `userRole`, `action`, `resourceType`, `resourceId`, `details`, `ipAddress`, `userAgent`
