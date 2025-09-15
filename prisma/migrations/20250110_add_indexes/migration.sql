-- Performance indexes for CroweCode Platform

-- User table indexes
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_github_id ON "User"("githubId");
CREATE INDEX idx_user_created_at ON "User"("createdAt" DESC);

-- Session table indexes
CREATE INDEX idx_session_token ON "Session"("sessionToken");
CREATE INDEX idx_session_user_id ON "Session"("userId");
CREATE INDEX idx_session_expires ON "Session"(expires);

-- Project table indexes
CREATE INDEX idx_project_user_id ON "Project"("userId");
CREATE INDEX idx_project_visibility ON "Project"(visibility);
CREATE INDEX idx_project_created_at ON "Project"("createdAt" DESC);
CREATE INDEX idx_project_language ON "Project"(language);
CREATE INDEX idx_project_is_template ON "Project"("isTemplate");

-- File table indexes
CREATE INDEX idx_file_project_id ON "File"("projectId");
CREATE INDEX idx_file_path ON "File"(path);
CREATE INDEX idx_file_mime_type ON "File"("mimeType");

-- Collaboration indexes
CREATE INDEX idx_collaboration_project_id ON "Collaboration"("projectId");
CREATE INDEX idx_collaboration_user_id ON "Collaboration"("userId");
CREATE INDEX idx_collaboration_role ON "Collaboration"(role);

-- Deployment indexes
CREATE INDEX idx_deployment_project_id ON "Deployment"("projectId");
CREATE INDEX idx_deployment_status ON "Deployment"(status);
CREATE INDEX idx_deployment_provider ON "Deployment"(provider);
CREATE INDEX idx_deployment_created_at ON "Deployment"("createdAt" DESC);

-- Analytics indexes
CREATE INDEX idx_analytics_user_id ON "Analytics"("userId");
CREATE INDEX idx_analytics_event_type ON "Analytics"("eventType");
CREATE INDEX idx_analytics_timestamp ON "Analytics"(timestamp DESC);

-- GitHub repository indexes
CREATE INDEX idx_github_repo_user_id ON "GitHubRepository"("userId");
CREATE INDEX idx_github_repo_full_name ON "GitHubRepository"("fullName");
CREATE INDEX idx_github_repo_private ON "GitHubRepository"(private);

-- AI conversation indexes
CREATE INDEX idx_ai_conversation_user_id ON "AIConversation"("userId");
CREATE INDEX idx_ai_conversation_project_id ON "AIConversation"("projectId");
CREATE INDEX idx_ai_conversation_created_at ON "AIConversation"("createdAt" DESC);

-- Notification indexes
CREATE INDEX idx_notification_user_id ON "Notification"("userId");
CREATE INDEX idx_notification_read ON "Notification"(read);
CREATE INDEX idx_notification_created_at ON "Notification"("createdAt" DESC);

-- Audit log indexes
CREATE INDEX idx_audit_user_id ON "AuditLog"("userId");
CREATE INDEX idx_audit_entity_type ON "AuditLog"("entityType");
CREATE INDEX idx_audit_entity_id ON "AuditLog"("entityId");
CREATE INDEX idx_audit_action ON "AuditLog"(action);
CREATE INDEX idx_audit_created_at ON "AuditLog"("createdAt" DESC);

-- Composite indexes for common queries
CREATE INDEX idx_project_user_visibility ON "Project"("userId", visibility);
CREATE INDEX idx_collaboration_project_user ON "Collaboration"("projectId", "userId");
CREATE INDEX idx_file_project_path ON "File"("projectId", path);
CREATE INDEX idx_analytics_user_event_time ON "Analytics"("userId", "eventType", timestamp DESC);

-- Full text search indexes (if using PostgreSQL)
CREATE INDEX idx_project_search ON "Project" USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_file_content_search ON "File" USING gin(to_tsvector('english', COALESCE(content, '')));