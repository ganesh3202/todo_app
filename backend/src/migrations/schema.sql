-- ============================================================
--  TaskFlow MySQL Schema
--  Run this once if you prefer manual setup over auto-sync.
--  CREATE DATABASE taskflow; USE taskflow; then run this file.
-- ============================================================

CREATE DATABASE IF NOT EXISTS taskflow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE taskflow;

-- ── users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  name                 VARCHAR(100)  NOT NULL,
  email                VARCHAR(191)  NOT NULL UNIQUE,
  password             VARCHAR(255)  NOT NULL,
  role                 ENUM('user','admin') DEFAULT 'user',
  avatar               VARCHAR(500)  NULL,
  bio                  VARCHAR(500)  NULL,
  theme                ENUM('dark','light') DEFAULT 'dark',
  isActive             TINYINT(1)    DEFAULT 1,
  resetPasswordToken   VARCHAR(255)  NULL,
  resetPasswordExpire  DATETIME      NULL,
  createdAt            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt            DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── projects ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  description TEXT          NULL,
  color       VARCHAR(20)   DEFAULT '#6366f1',
  icon        VARCHAR(10)   DEFAULT '📁',
  status      ENUM('planning','active','on_hold','completed','cancelled') DEFAULT 'active',
  priority    ENUM('low','medium','high') DEFAULT 'medium',
  startDate   DATE          NULL,
  deadline    DATE          NULL,
  completedAt DATETIME      NULL,
  progress    INT           DEFAULT 0,
  tags        TEXT          NULL,   -- JSON array
  ownerId     INT           NOT NULL,
  createdAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── tasks ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(250)  NOT NULL,
  description      TEXT          NULL,
  status           ENUM('todo','in_progress','completed','cancelled') DEFAULT 'todo',
  priority         ENUM('low','medium','high','urgent') DEFAULT 'medium',
  dueDate          DATE          NULL,
  completedAt      DATETIME      NULL,
  category         VARCHAR(100)  NULL,
  tags             TEXT          NULL,   -- JSON array
  isRecurring      TINYINT(1)    DEFAULT 0,
  recurringPattern ENUM('daily','weekly','monthly') NULL,
  estimatedTime    INT           NULL COMMENT 'minutes',
  actualTime       INT           NULL COMMENT 'minutes',
  sortOrder        INT           DEFAULT 0,
  subtasks         MEDIUMTEXT    NULL,   -- JSON array
  attachments      TEXT          NULL,   -- JSON array
  projectId        INT           NULL,
  assignedToId     INT           NULL,
  createdById      INT           NOT NULL,
  createdAt        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId)    REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (assignedToId) REFERENCES users(id)    ON DELETE SET NULL,
  FOREIGN KEY (createdById)  REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_task_user_status (createdById, status),
  INDEX idx_task_due         (dueDate),
  INDEX idx_task_project     (projectId)
) ENGINE=InnoDB;

-- ── task_comments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_comments (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  text      TEXT    NOT NULL,
  taskId    INT     NOT NULL,
  userId    INT     NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── notes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(250) NOT NULL,
  content      LONGTEXT     NULL,
  type         ENUM('note','snippet','interview_qa','learning','resource') DEFAULT 'note',
  color        VARCHAR(20)  DEFAULT '#6366f1',
  isPinned     TINYINT(1)   DEFAULT 0,
  isArchived   TINYINT(1)   DEFAULT 0,
  tags         TEXT         NULL,  -- JSON array
  codeLanguage VARCHAR(50)  NULL,
  codeContent  LONGTEXT     NULL,
  links        TEXT         NULL,  -- JSON array
  projectId    INT          NULL,
  createdById  INT          NOT NULL,
  createdAt    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId)   REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (createdById) REFERENCES users(id)    ON DELETE CASCADE,
  INDEX idx_note_user (createdById),
  INDEX idx_note_pin  (isPinned)
) ENGINE=InnoDB;

-- ── documents ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  originalName  VARCHAR(255) NULL,
  filename      VARCHAR(255) NULL,
  url           VARCHAR(500) NULL,
  size          BIGINT       NULL,
  mimetype      VARCHAR(100) NULL,
  type          ENUM('pdf','docx','xlsx','image','other') DEFAULT 'other',
  description   TEXT         NULL,
  tags          TEXT         NULL,  -- JSON array
  downloadCount INT          DEFAULT 0,
  projectId     INT          NULL,
  taskId        INT          NULL,
  uploadedById  INT          NOT NULL,
  createdAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId)    REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (taskId)       REFERENCES tasks(id)    ON DELETE SET NULL,
  FOREIGN KEY (uploadedById) REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB;
