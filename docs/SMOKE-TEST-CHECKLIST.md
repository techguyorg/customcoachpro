# CustomCoachPro - Azure Migration Smoke Test Checklist

This comprehensive checklist validates all modules are working correctly after the Azure migration. Execute these tests in order to ensure the platform is fully functional.

## Pre-Test Setup

- [ ] Azure SQL Database is running and accessible
- [ ] Azure Blob Storage container exists and is configured
- [ ] Backend Express server is running (`npm start` in `/backend`)
- [ ] Frontend is running (`npm run dev` in root)
- [ ] Environment variables are correctly configured:
  - `VITE_API_URL` points to backend
  - Backend has valid `SQL_*` credentials
  - Backend has valid `AZURE_STORAGE_*` credentials
  - Backend has valid `GOOGLE_APP_PASSWORD` for SMTP

---

## 1. Authentication Module

### 1.1 User Registration
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Sign up as Client | 1. Navigate to /signup<br>2. Fill form with valid data<br>3. Select "Client" role<br>4. Submit | User created, redirected to client dashboard | ⬜ |
| Sign up as Coach | 1. Navigate to /signup<br>2. Fill form with valid data<br>3. Select "Coach" role<br>4. Submit | User created, redirected to coach dashboard | ⬜ |
| Sign up validation | 1. Submit empty form<br>2. Submit with invalid email<br>3. Submit with short password | Appropriate error messages shown | ⬜ |
| Duplicate email | 1. Sign up with existing email | Error: "Email already registered" | ⬜ |

### 1.2 User Login
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Valid login | 1. Navigate to /login<br>2. Enter valid credentials<br>3. Submit | Logged in, redirected to appropriate dashboard | ⬜ |
| Invalid password | 1. Enter valid email, wrong password | Error: "Invalid credentials" | ⬜ |
| Non-existent user | 1. Enter non-registered email | Error: "Invalid credentials" | ⬜ |
| Remember session | 1. Login<br>2. Close browser<br>3. Reopen | Still logged in (token persisted) | ⬜ |

### 1.3 Password Management
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Forgot password | 1. Click "Forgot Password"<br>2. Enter email<br>3. Submit | Email sent with reset link | ⬜ |
| Reset password | 1. Click reset link from email<br>2. Enter new password<br>3. Submit | Password updated, can login with new password | ⬜ |
| Change password (logged in) | 1. Go to Settings<br>2. Enter current + new password<br>3. Submit | Password updated successfully | ⬜ |

### 1.4 Session Management
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Logout | 1. Click logout button | Token cleared, redirected to login | ⬜ |
| Token expiry | 1. Wait for token to expire<br>2. Make API request | Redirected to login | ⬜ |
| Token refresh | 1. Login<br>2. Wait for access token expiry<br>3. Make request | Token refreshed automatically | ⬜ |

---

## 2. User Profile Module

### 2.1 Profile Management
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View profile | 1. Navigate to Profile page | Profile data displayed correctly | ⬜ |
| Update name | 1. Edit full name<br>2. Save | Name updated in DB and UI | ⬜ |
| Update bio | 1. Edit bio text<br>2. Save | Bio updated | ⬜ |
| Update phone | 1. Add/edit phone number<br>2. Save | Phone updated | ⬜ |
| Update date of birth | 1. Select DOB<br>2. Save | DOB updated | ⬜ |

### 2.2 Avatar Upload
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Upload avatar | 1. Click avatar<br>2. Select image file<br>3. Upload | Image uploaded to Azure Blob, URL saved | ⬜ |
| View avatar | 1. Reload profile page | Avatar displays from Azure Blob URL | ⬜ |
| Replace avatar | 1. Upload new avatar | Old avatar replaced, new one displayed | ⬜ |
| Invalid file type | 1. Try uploading non-image file | Error message shown | ⬜ |

---

## 3. Coach Features Module

### 3.1 Coach Dashboard
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View dashboard | 1. Login as coach<br>2. Navigate to dashboard | Stats displayed (clients, check-ins, etc.) | ⬜ |
| Dashboard stats accuracy | 1. Compare displayed stats with DB | Numbers match database counts | ⬜ |

### 3.2 Client Management
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View clients list | 1. Navigate to Clients page | All assigned clients displayed | ⬜ |
| View client details | 1. Click on a client card | Client detail sheet opens with full info | ⬜ |
| Filter clients | 1. Use search/filter options | List filtered correctly | ⬜ |
| Add client note | 1. Open client details<br>2. Add note<br>3. Save | Note saved and displayed | ⬜ |
| Pin client note | 1. Click pin icon on note | Note pinned to top | ⬜ |

### 3.3 Client Invitation
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Invite new client | 1. Click "Invite Client"<br>2. Enter email and message<br>3. Send | Invitation email sent | ⬜ |
| Accept client request | 1. View pending requests<br>2. Accept request | Relationship created, client appears in list | ⬜ |
| Reject client request | 1. View pending requests<br>2. Reject request | Request marked as rejected | ⬜ |

### 3.4 Plan Assignment
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Assign workout plan | 1. Open client details<br>2. Click "Assign Plan"<br>3. Select workout<br>4. Assign | Plan assigned, client notified | ⬜ |
| Assign diet plan | 1. Open client details<br>2. Click "Assign Plan"<br>3. Select diet<br>4. Assign | Plan assigned, client notified | ⬜ |
| View assigned plans | 1. Open client details | Assigned plans listed | ⬜ |

### 3.5 Check-in Review
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View pending check-ins | 1. Navigate to Check-ins page | Unreviewed check-ins listed | ⬜ |
| Review check-in | 1. Open check-in<br>2. Add feedback<br>3. Mark reviewed | Check-in updated, client notified | ⬜ |
| View check-in history | 1. Open client details<br>2. View check-ins tab | All check-ins displayed | ⬜ |

### 3.6 Coach Analytics
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View analytics page | 1. Navigate to Analytics | Charts and metrics displayed | ⬜ |
| Client progress chart | 1. View client progress section | Charts render with correct data | ⬜ |
| Export analytics PDF | 1. Click export button | PDF generated and downloaded | ⬜ |

---

## 4. Client Features Module

### 4.1 Client Dashboard
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View dashboard | 1. Login as client<br>2. Navigate to dashboard | Stats and recent activity shown | ⬜ |
| View assigned plans | 1. Check "My Plans" section | Active workout/diet plans displayed | ⬜ |

### 4.2 Workout Logging
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Start workout | 1. Navigate to Workouts<br>2. Start a workout session | Workout log created | ⬜ |
| Log exercise sets | 1. During workout<br>2. Enter reps/weight for each set | Set data saved | ⬜ |
| Complete workout | 1. Finish all exercises<br>2. Complete workout | Workout marked complete, stats updated | ⬜ |
| View workout history | 1. Navigate to workout logs | Past workouts displayed | ⬜ |

### 4.3 Nutrition Logging
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Log food item | 1. Navigate to Nutrition Log<br>2. Add food item<br>3. Save | Food logged with macros | ⬜ |
| Log recipe | 1. Add recipe to log | Recipe logged with calculated macros | ⬜ |
| View daily summary | 1. View nutrition log page | Daily totals calculated correctly | ⬜ |
| Edit logged item | 1. Click on logged item<br>2. Edit quantity<br>3. Save | Macros recalculated | ⬜ |

### 4.4 Check-ins
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Submit check-in | 1. Navigate to Check-ins<br>2. Fill check-in form<br>3. Submit | Check-in saved, coach notified | ⬜ |
| Add measurements | 1. In check-in form<br>2. Enter weight, measurements | Measurements saved | ⬜ |
| View past check-ins | 1. View check-in history | All submitted check-ins shown | ⬜ |
| View coach feedback | 1. Open reviewed check-in | Coach feedback displayed | ⬜ |

### 4.5 Progress Tracking
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View progress page | 1. Navigate to Progress | Charts and stats displayed | ⬜ |
| Add measurement | 1. Click "Add Measurement"<br>2. Enter data<br>3. Save | Measurement saved, chart updated | ⬜ |
| Upload progress photo | 1. Click "Add Photo"<br>2. Select image<br>3. Upload | Photo saved to Azure Blob | ⬜ |
| View photo gallery | 1. Browse progress photos | Photos load from Azure Blob | ⬜ |
| Delete progress photo | 1. Select photo<br>2. Delete | Photo removed from storage | ⬜ |

### 4.6 Goals
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Add goal | 1. Click "Add Goal"<br>2. Enter details<br>3. Save | Goal created | ⬜ |
| Update goal progress | 1. Open goal<br>2. Update current value | Progress percentage updated | ⬜ |
| Complete goal | 1. Mark goal as complete | Goal status changed | ⬜ |

### 4.7 Coach Marketplace
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Browse coaches | 1. Navigate to Find Coach | Available coaches listed | ⬜ |
| View coach profile | 1. Click on coach card | Coach details displayed | ⬜ |
| Send coaching request | 1. Click "Request Coaching"<br>2. Add message<br>3. Submit | Request sent, coach notified | ⬜ |

---

## 5. Content Management Module

### 5.1 Exercises Library
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Browse exercises | 1. Navigate to Exercises | Exercise list displayed | ⬜ |
| Filter by muscle | 1. Select muscle group filter | List filtered correctly | ⬜ |
| Filter by equipment | 1. Select equipment filter | List filtered correctly | ⬜ |
| Search exercises | 1. Enter search term | Matching exercises shown | ⬜ |
| View exercise details | 1. Click exercise card | Detail sheet with instructions | ⬜ |
| Create exercise (coach) | 1. Click "Create Exercise"<br>2. Fill form<br>3. Save | Exercise created | ⬜ |

### 5.2 Workout Templates
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Browse templates | 1. Navigate to Workout Templates | Templates listed | ⬜ |
| View template details | 1. Click template card | Full template with days/exercises | ⬜ |
| Create template (coach) | 1. Click "Create Template"<br>2. Add days and exercises<br>3. Save | Template created | ⬜ |
| Clone system template | 1. Click clone on system template | Editable copy created | ⬜ |

### 5.3 Diet Plans
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Browse diet plans | 1. Navigate to Diet Plans | Plans listed | ⬜ |
| View plan details | 1. Click plan card | Meals and macros displayed | ⬜ |
| Create diet plan (coach) | 1. Click "Create Plan"<br>2. Add meals<br>3. Save | Plan created | ⬜ |

### 5.4 Foods Database
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Browse foods | 1. Navigate to Foods | Food items listed | ⬜ |
| Search foods | 1. Enter search term | Matching foods shown | ⬜ |
| View food details | 1. Click food item | Nutrition info displayed | ⬜ |
| Add custom food | 1. Click "Add Food"<br>2. Enter nutrition data<br>3. Save | Food created | ⬜ |

### 5.5 Recipes
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Browse recipes | 1. Navigate to Recipes | Recipes listed | ⬜ |
| View recipe | 1. Click recipe card | Ingredients and instructions shown | ⬜ |
| Create recipe | 1. Click "Create Recipe"<br>2. Add ingredients<br>3. Save | Recipe created with calculated macros | ⬜ |

---

## 6. Messaging Module

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View conversations | 1. Navigate to Messages | Conversation list displayed | ⬜ |
| Open conversation | 1. Click on conversation | Messages displayed | ⬜ |
| Send message | 1. Type message<br>2. Send | Message appears in thread | ⬜ |
| Receive message | 1. Other user sends message | Message appears (realtime or on refresh) | ⬜ |
| Start new conversation | 1. Click "New Message"<br>2. Select recipient<br>3. Send | Conversation created | ⬜ |
| Mark as read | 1. Open unread conversation | Messages marked as read | ⬜ |

---

## 7. Notifications Module

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View notifications | 1. Click notification bell | Notification list displayed | ⬜ |
| Unread count | 1. Check bell icon | Correct unread count shown | ⬜ |
| Mark as read | 1. Click notification | Notification marked as read | ⬜ |
| Mark all as read | 1. Click "Mark all read" | All notifications marked read | ⬜ |
| Notification on plan assign | 1. Coach assigns plan | Client receives notification | ⬜ |
| Notification on check-in review | 1. Coach reviews check-in | Client receives notification | ⬜ |
| Notification on new message | 1. Receive message | Notification created | ⬜ |

---

## 8. Admin Features Module

### 8.1 User Management
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View all users | 1. Login as super_admin<br>2. Navigate to Admin | User list displayed | ⬜ |
| Search users | 1. Enter search term | Filtered results shown | ⬜ |
| View user details | 1. Click on user | Full user info displayed | ⬜ |
| Grant coach role | 1. Select user<br>2. Add coach role | Role added | ⬜ |
| Revoke role | 1. Select user<br>2. Remove role | Role removed | ⬜ |
| Grant super_admin | 1. Use assign function | Super admin role added | ⬜ |

### 8.2 Platform Analytics
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View platform stats | 1. Navigate to Analytics | Total users, active users, etc. | ⬜ |
| View growth charts | 1. Check registration chart | Chart renders correctly | ⬜ |
| Export admin report | 1. Click export | PDF generated | ⬜ |

### 8.3 Audit Logs
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View audit logs | 1. Navigate to Audit Logs | Log entries displayed | ⬜ |
| Filter by action | 1. Select action type filter | Filtered results | ⬜ |
| Filter by user | 1. Search by user | Filtered results | ⬜ |

### 8.4 System Content
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View system exercises | 1. Navigate to System Content | System exercises listed | ⬜ |
| Edit system exercise | 1. Select exercise<br>2. Edit<br>3. Save | Exercise updated | ⬜ |
| View system templates | 1. Switch to templates tab | System templates listed | ⬜ |

---

## 9. File Storage Module (Azure Blob)

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Upload avatar | 1. Update profile avatar | File uploaded to Azure Blob | ⬜ |
| View avatar | 1. Load profile page | Avatar loads from Azure URL | ⬜ |
| Upload progress photo | 1. Add progress photo | Photo uploaded to Azure Blob | ⬜ |
| View progress photos | 1. Open photo gallery | Photos load from Azure URLs | ⬜ |
| Delete file | 1. Delete progress photo | File removed from Azure Blob | ⬜ |
| File access control | 1. Try accessing another user's private file | Access denied or redirect | ⬜ |

---

## 10. Database Verification

### 10.1 Schema Verification
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Run verify script | 1. Execute `docs/azure-sql-schema.verify.sql` | No missing columns reported | ⬜ |
| Check all tables exist | 1. Query sys.tables | All expected tables present | ⬜ |
| Check indexes | 1. Query sys.indexes | Required indexes exist | ⬜ |

### 10.2 Data Integrity
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Foreign key constraints | 1. Try inserting orphan record | Constraint violation error | ⬜ |
| Unique constraints | 1. Try duplicate email | Constraint violation error | ⬜ |
| Default values | 1. Insert minimal record | Defaults applied correctly | ⬜ |

---

## 11. API Verification

### 11.1 Endpoint Testing
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Health check | GET /health | 200 OK with status | ⬜ |
| Auth endpoints | Test /api/auth/* | All return expected responses | ⬜ |
| Protected endpoints | Request without token | 401 Unauthorized | ⬜ |
| CORS headers | Check response headers | Correct CORS headers present | ⬜ |

### 11.2 Error Handling
| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Invalid JSON | Send malformed JSON | 400 Bad Request | ⬜ |
| Not found | Request non-existent resource | 404 Not Found | ⬜ |
| Server error | Trigger error condition | 500 with error message (no stack trace in prod) | ⬜ |

---

## Test Summary

| Module | Total Tests | Passed | Failed | Blocked |
|--------|-------------|--------|--------|---------|
| Authentication | 12 | ⬜ | ⬜ | ⬜ |
| User Profile | 8 | ⬜ | ⬜ | ⬜ |
| Coach Features | 20 | ⬜ | ⬜ | ⬜ |
| Client Features | 22 | ⬜ | ⬜ | ⬜ |
| Content Management | 16 | ⬜ | ⬜ | ⬜ |
| Messaging | 6 | ⬜ | ⬜ | ⬜ |
| Notifications | 7 | ⬜ | ⬜ | ⬜ |
| Admin Features | 12 | ⬜ | ⬜ | ⬜ |
| File Storage | 6 | ⬜ | ⬜ | ⬜ |
| Database | 6 | ⬜ | ⬜ | ⬜ |
| API | 6 | ⬜ | ⬜ | ⬜ |
| **TOTAL** | **121** | ⬜ | ⬜ | ⬜ |

---

## Notes

- **Tester Name**: _______________
- **Test Date**: _______________
- **Environment**: ☐ Development ☐ Staging ☐ Production
- **Backend Version**: _______________
- **Frontend Version**: _______________

### Issues Found
| # | Module | Test Case | Description | Severity | Status |
|---|--------|-----------|-------------|----------|--------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

### Sign-off

- [ ] All critical tests passed
- [ ] All high-priority issues resolved
- [ ] Ready for production deployment

**Approved by**: _______________ **Date**: _______________
