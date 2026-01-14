-- Email Preferences Schema for Azure SQL

CREATE TABLE user_email_preferences (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_checkin_reminder BIT DEFAULT 1,
    email_checkin_submitted BIT DEFAULT 1,
    email_checkin_reviewed BIT DEFAULT 1,
    email_plan_assigned BIT DEFAULT 1,
    email_coach_message BIT DEFAULT 1,
    email_marketing BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_email_prefs_user ON user_email_preferences(user_id);
