-- Blog System Schema for Azure SQL

-- Blog Posts Table
CREATE TABLE blog_posts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    title NVARCHAR(255) NOT NULL,
    slug NVARCHAR(150) NOT NULL UNIQUE,
    content NVARCHAR(MAX) NOT NULL,
    excerpt NVARCHAR(500),
    cover_image_url NVARCHAR(500),
    category NVARCHAR(100),
    author_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status NVARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    read_time_minutes INT DEFAULT 1,
    view_count INT DEFAULT 0,
    published_at DATETIME2,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_category ON blog_posts(category);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC);

-- Blog Permissions Table
CREATE TABLE blog_permissions (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission NVARCHAR(20) NOT NULL CHECK (permission IN ('write', 'manage')),
    granted_by UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT uq_blog_permission UNIQUE (user_id, permission)
);

CREATE INDEX idx_blog_permissions_user ON blog_permissions(user_id);
